const { ipcMain } = require('electron');
const database = require('../windows/server/database');

function setupTournamentHandlers(liveTournamentWindow) {
    // Lấy thông tin tournament
    ipcMain.handle('get-tournament-data', async () => {
        try {
            // Chỉ lấy 2 cột buy_in_price và starting_stack từ bảng tournaments
            const tournaments = await database.executeQueries(`
                SELECT buy_in_price, starting_stack 
                FROM tournaments 
                ORDER BY id DESC LIMIT 1
            `);
            console.log('Tournament data:', tournaments);

            if (tournaments && tournaments[0]) {
                const tournament = tournaments[0];
                
                // Trả về dữ liệu với các giá trị từ database
                const result = {
                    buy_in_price: tournament.buy_in_price / 100, // Chuyển đổi từ cents sang dollars
                    starting_stack: tournament.starting_stack
                };
                console.log('Final processed tournament data:', result);
                return result;
            }
            
            console.log('No tournament data found');
            return null;
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu giải đấu:', error);
            return null;
        }
    });

    // Lấy tên giải đấu
    ipcMain.handle('get-tournament-name', async () => {
        try {
            // Lấy tên giải đấu từ database
            const tournaments = await database.executeQueries(`
                SELECT name 
                FROM tournaments 
                ORDER BY id DESC LIMIT 1
            `);
            
            console.log('Tournament name data:', tournaments);

            if (tournaments && tournaments[0] && tournaments[0].name) {
                return tournaments[0].name;
            }
            
            // Trả về tên mặc định nếu không tìm thấy
            console.log('No tournament name found, returning default');
            return "POKER TOURNAMENT";
        } catch (error) {
            console.error('Lỗi khi lấy tên giải đấu:', error);
            // Trả về tên mặc định nếu có lỗi
            return "POKER TOURNAMENT";
        }
    });

    // Lưu dữ liệu tournament
    ipcMain.handle('save-tournament-data', async (event, data) => {
        try {
            // Kiểm tra xem đã có tournament chưa
            const existingTournament = await database.executeQueries(`
                SELECT id FROM tournaments ORDER BY id DESC LIMIT 1
            `);

            if (existingTournament && existingTournament[0]) {
                // Cập nhật tournament hiện có
                await database.executeQuery(`
                    UPDATE tournaments 
                    SET name = ?, 
                        location = ?, 
                        buy_in_price = ?,
                        starting_stack = ?,
                        currency = ?,
                        charge_rake = ?,
                        rake_amount = ?
                    WHERE id = ?
                `, [
                    data.name,
                    data.location,
                    Math.round(data.buy_in_price * 100), // Chuyển đổi sang cents
                    data.starting_stack,
                    data.currency,
                    data.charge_rake ? 1 : 0,
                    Math.round(data.rake_amount * 100), // Chuyển đổi sang cents
                    existingTournament[0].id
                ]);
            } else {
                // Tạo tournament mới
                await database.executeQuery(`
                    INSERT INTO tournaments (
                        name, location, buy_in_price, starting_stack,
                        currency, charge_rake, rake_amount
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    data.name,
                    data.location,
                    Math.round(data.buy_in_price * 100), // Chuyển đổi sang cents
                    data.starting_stack,
                    data.currency,
                    data.charge_rake ? 1 : 0,
                    Math.round(data.rake_amount * 100)  // Chuyển đổi sang cents
                ]);
            }

            return { success: true };
        } catch (error) {
            console.error('Lỗi khi lưu dữ liệu tournament:', error);
            throw error;
        }
    });

    // Xử lý tournament stats
    ipcMain.handle('update-tournament-stats', async (event, data) => {
        try {
            console.log('=== Start update-tournament-stats ===');
            console.log('Input data:', data);

            // Lấy thông tin tournament
            const tournament = await database.executeQueries(`
                SELECT name, buy_in_price, starting_stack FROM tournaments ORDER BY id DESC LIMIT 1
            `);

            if (!tournament || !tournament[0]) {
                throw new Error('Không tìm thấy dữ liệu tournament');
            }

            // Lấy stats hiện tại
            const currentStats = await database.executeQueries(`
                SELECT * FROM tournament_stats LIMIT 1
            `);

            if (!currentStats || !currentStats[0]) {
                throw new Error('Không tìm thấy dữ liệu tournament stats');
            }

            // Chuẩn bị dữ liệu để cập nhật
            const updateData = {
                ...currentStats[0],
                ...data
            };

            // Tính toán total_chips dựa trên entries và reentries
            let totalChips = 0;

            // Tính chips từ entries
            const totalEntries = data.total_entries ?? currentStats[0].total_entries;
            totalChips += totalEntries * tournament[0].starting_stack;

            // Tính chips từ reentries
            const reentries = data.reentries ?? currentStats[0].reentries;
            // Sử dụng rebuy_stack thay vì starting_stack cho reentries
            totalChips += reentries * currentStats[0].rebuy_stack;

            // Tính chips từ addons
            const addons = data.addons ?? currentStats[0].addons;
            if (addons > 0) {
                const reentriesData = await database.executeQueries(`
                    SELECT addon_chips FROM reentries_addons LIMIT 1
                `);
                if (reentriesData && reentriesData[0]) {
                    totalChips += addons * reentriesData[0].addon_chips;
                }
            }

            // Cập nhật total_chips
            updateData.total_chips = totalChips;

            // Tính average_stack
            updateData.average_stack = updateData.players_left > 0 ? 
                Math.floor(updateData.total_chips / updateData.players_left) : 0;

            // Cập nhật database
            await database.executeQuery(`
                UPDATE tournament_stats 
                SET total_entries = COALESCE(?, total_entries),
                    players_left = COALESCE(?, players_left),
                    reentries = COALESCE(?, reentries),
                    addons = COALESCE(?, addons),
                    total_chips = ?,
                    average_stack = ?
                WHERE id = ?
            `, [
                updateData.total_entries,
                updateData.players_left,
                updateData.reentries,
                updateData.addons,
                updateData.total_chips,
                updateData.average_stack,
                currentStats[0].id
            ]);

            console.log('Updated stats:', updateData);

            // Gửi dữ liệu đến cửa sổ live tournament nếu có
            if (liveTournamentWindow && liveTournamentWindow()) {
                const updatedStats = {
                    ...updateData,
                    name: tournament[0].name,  // Thêm tên giải đấu
                    buy_in_price: tournament[0].buy_in_price / 100,
                    starting_stack: tournament[0].starting_stack
                };
                liveTournamentWindow().webContents.send('tournament-data', updatedStats);
            }

            console.log('=== End update-tournament-stats ===');
            return updateData;

        } catch (error) {
            console.error('Error in update-tournament-stats:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    });

    // Lấy dữ liệu tournament stats
    ipcMain.handle('getTournamentStats', async () => {
        try {
            const result = await database.executeQuery('SELECT * FROM tournament_stats LIMIT 1');
            return result[0] || {};
        } catch (error) {
            console.error('Lỗi khi lấy tournament stats:', error);
            throw error;
        }
    });

    // Cập nhật tournament stats
    ipcMain.handle('updateTournamentStats', async (event, data) => {
        try {
            const setClause = Object.keys(data)
                .map(key => `${key} = ?`)
                .join(', ');
            const values = Object.values(data);
            
            const query = `UPDATE tournament_stats SET ${setClause}`;
            await database.executeQuery(query, values);
            return true;
        } catch (error) {
            console.error('Lỗi khi cập nhật tournament stats:', error);
            throw error;
        }
    });

    // Lấy tournament stats
    ipcMain.handle('get-tournament-stats', async () => {
        try {
            console.log('=== Start get-tournament-stats ===');
            const stats = await database.executeQueries(`
                SELECT * FROM tournament_stats ORDER BY id DESC LIMIT 1
            `);
            console.log('Tournament stats:', stats);
            console.log('=== End get-tournament-stats ===');
            return stats;
        } catch (error) {
            console.error('Error in get-tournament-stats:', error);
            throw error;
        }
    });

    // Xử lý reentries data
    ipcMain.handle('get-reentries-data', async () => {
        try {
            // Kiểm tra xem đã có tournament chưa
            const existingTournament = await database.executeQueries(`
                SELECT id FROM tournaments ORDER BY id DESC LIMIT 1
            `);

            if (existingTournament && existingTournament[0]) {
                // Lấy dữ liệu reentries của tournament hiện tại
                const reentriesData = await database.executeQueries(`
                    SELECT * FROM reentries_addons 
                    WHERE tournament_id = ? 
                    ORDER BY id DESC LIMIT 1
                `, [existingTournament[0].id]);

                if (reentriesData && reentriesData[0]) {
                    const data = reentriesData[0];
                    return {
                        allow_reentry: data.allow_reentry,
                        reentry_limit: data.reentry_limit,
                        allow_addon: data.allow_addon,
                        addon_price: data.addon_price / 100,
                        addon_chips: data.addon_chips
                    };
                }
            }
            
            return null;
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu reentries:', error);
            return null;
        }
    });

    // Lưu dữ liệu reentries
    ipcMain.handle('save-reentries-data', async (event, data) => {
        try {
            // Lấy bản ghi đầu tiên từ bảng reentries_addons
            const existingReentries = await database.executeQueries(`
                SELECT * FROM reentries_addons 
                ORDER BY id ASC LIMIT 1
            `);

            if (existingReentries && existingReentries[0]) {
                // Tạo câu lệnh UPDATE động dựa trên các trường được thay đổi
                const updateFields = [];
                const updateValues = [];
                
                if ('allow_reentry' in data) {
                    updateFields.push('allow_reentry = ?');
                    updateValues.push(data.allow_reentry);
                }
                if ('reentry_limit' in data) {
                    updateFields.push('reentry_limit = ?');
                    updateValues.push(data.reentry_limit);
                }
                if ('allow_addon' in data) {
                    updateFields.push('allow_addon = ?');
                    updateValues.push(data.allow_addon);
                }
                if ('addon_price' in data) {
                    updateFields.push('addon_price = ?');
                    updateValues.push(Math.round(data.addon_price * 100)); // Chuyển đổi sang cents
                }
                if ('addon_chips' in data) {
                    updateFields.push('addon_chips = ?');
                    updateValues.push(data.addon_chips);
                }

                // Thêm id vào cuối mảng values
                updateValues.push(existingReentries[0].id);

                // Thực hiện câu lệnh UPDATE
                if (updateFields.length > 0) {
                    await database.executeQuery(`
                        UPDATE reentries_addons 
                        SET ${updateFields.join(', ')}
                        WHERE id = ?
                    `, updateValues);
                }

                return { success: true };
            }

            throw new Error('Không tìm thấy bản ghi reentries_addons');
        } catch (error) {
            console.error('Lỗi khi lưu dữ liệu reentries:', error);
            throw error;
        }
    });

    return {
        // Phương thức có thể cần xuất ra khi import module
    };
}

module.exports = setupTournamentHandlers;