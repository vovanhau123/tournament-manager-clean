const { ipcMain } = require('electron');
const database = require('../windows/server/database');

function setupBlindHandlers() {
    // Lấy blind structure
    ipcMain.handle('get-blind-structure', async () => {
        try {
            // Lấy tournament_id hiện tại
            const tournament = await database.executeQueries(`
                SELECT id FROM tournaments ORDER BY id DESC LIMIT 1
            `);
            
            if (!tournament || !tournament[0]) {
                throw new Error('Không tìm thấy tournament');
            }

            const tournament_id = tournament[0].id;
            console.log('Tournament ID:', tournament_id);

            // Lấy tất cả dữ liệu từ blind structure theo thứ tự id
            const allData = await database.executeQueries(`
                SELECT id, level, duration_minutes, small_blind, big_blind, ante, is_break
                FROM blind_structure 
                WHERE tournament_id = ?
                ORDER BY id ASC
            `, [tournament_id]);

            // Xử lý riêng cho levels (không bao gồm breaks)
            const levels = allData.filter(item => item.is_break === 0);
            
            // Đánh số lại các level từ 1 đến n
            for (let i = 0; i < levels.length; i++) {
                const level = levels[i];
                const newLevelNumber = i + 1;
                
                // Cập nhật số level trong database
                if (level.level !== newLevelNumber) {
                    await database.executeQuery(`
                        UPDATE blind_structure 
                        SET level = ? 
                        WHERE id = ? AND tournament_id = ?
                    `, [newLevelNumber, level.id, tournament_id]);
                    
                    // Cập nhật lại trong object
                    level.level = newLevelNumber;
                }
            }

            // Kết hợp lại kết quả theo thứ tự id ban đầu
            const result = allData.map(item => {
                if (item.is_break === 1) {
                    // Giữ nguyên break
                    return {
                        ...item,
                        level: 0  // Đảm bảo break luôn có level = 0
                    };
                } else {
                    // Lấy level đã được cập nhật số thứ tự
                    return levels.find(l => l.id === item.id);
                }
            });

            console.log('Blind structure from DB:', result);
            return result;
        } catch (error) {
            console.error('Lỗi khi lấy cấu trúc blind:', error);
            throw error;
        }
    });

    // Lưu blind structure
    ipcMain.handle('save-blind-structure', async (event, data) => {
        try {
            // Lấy tournament_id hiện tại
            const tournament = await database.executeQueries(`
                SELECT id FROM tournaments ORDER BY id DESC LIMIT 1
            `);
            
            if (!tournament || !tournament[0]) {
                throw new Error('Không tìm thấy tournament');
            }

            const tournament_id = tournament[0].id;

            // Xóa tất cả blind structure cũ
            await database.executeQuery(
                'DELETE FROM blind_structure WHERE tournament_id = ?',
                [tournament_id]
            );

            // Thêm lại từng level mới với thứ tự đúng
            const insertQuery = `INSERT INTO blind_structure 
                (tournament_id, level, duration_minutes, small_blind, big_blind, ante, is_break) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`;
        
            // Đếm số level thực (không phải break) để đánh số
            let currentLevel = 1;
            
            // Lưu theo đúng thứ tự trong data
            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                // Kiểm tra và đảm bảo các giá trị không undefined
                const small_blind = item.small_blind || 0;
                const big_blind = item.big_blind || 0;
                const ante = item.ante || 0;
                // Không cần chuyển đổi duration_minutes vì đã được chuyển từ blind-structure.js
                const duration_minutes = item.duration_minutes || 0;

                // Nếu là break thì level = 0, còn không thì tăng level
                const level_number = item.is_break ? 0 : currentLevel++;

                await database.executeQuery(insertQuery, [
                    tournament_id,
                    level_number,
                    duration_minutes, // Giữ nguyên giá trị đã được chuyển đổi
                    small_blind,
                    big_blind,
                    ante,
                    item.is_break ? 1 : 0
                ]);
            }
            return true;
        } catch (error) {
            console.error('Lỗi khi lưu cấu trúc blind:', error);
            throw error;
        }
    });

    // Lấy blind defaults
    ipcMain.handle('get-blind-defaults', async () => {
        try {
            // Lấy tournament_id hiện tại
            const tournament = await database.executeQueries(`
                SELECT id FROM tournaments ORDER BY id DESC LIMIT 1
            `);
            
            if (!tournament || !tournament[0]) {
                throw new Error('Không tìm thấy tournament');
            }

            const tournament_id = tournament[0].id;
            
            // Lấy blind defaults của tournament hiện tại
            const defaults = await database.executeQueries(`
                SELECT * FROM blind_structure 
                WHERE tournament_id = ? 
                ORDER BY id DESC LIMIT 1
            `, [tournament_id]);

            if (defaults && defaults[0]) {
                return {
                    level_duration: defaults[0].level_duration || 15,
                    break_duration: defaults[0].break_duration || 10,
                    ante_type: defaults[0].ante_type || 'percentage',
                    blind_increase_percent: defaults[0].blind_increase_percent || 25,
                    final_reentry_level: defaults[0].final_reentry_level || 0
                };
            }

            // Trả về giá trị mặc định nếu không có dữ liệu
            return {
                level_duration: 15,
                break_duration: 10,
                ante_type: 'percentage',
                blind_increase_percent: 25,
                final_reentry_level: 0
            };
        } catch (error) {
            console.error('Lỗi khi lấy blind defaults:', error);
            throw error;
        }
    });

    // Lưu blind defaults
    ipcMain.handle('save-blind-defaults', async (event, data) => {
        try {
            // Lấy tournament_id hiện tại
            const tournament = await database.executeQueries(`
                SELECT id FROM tournaments ORDER BY id DESC LIMIT 1
            `);
            
            if (!tournament || !tournament[0]) {
                throw new Error('Không tìm thấy tournament');
            }

            const tournament_id = tournament[0].id;

            // Kiểm tra xem đã có defaults chưa
            const existingDefaults = await database.executeQueries(`
                SELECT id FROM blind_structure 
                WHERE tournament_id = ?
            `, [tournament_id]);

            if (existingDefaults && existingDefaults[0]) {
                // Cập nhật defaults hiện có
                await database.executeQuery(`
                    UPDATE blind_structure 
                    SET level_duration = ?,
                        break_duration = ?,
                        ante_type = ?,
                        blind_increase_percent = ?,
                        final_reentry_level = ?
                    WHERE tournament_id = ?
                `, [
                    data.level_duration,
                    data.break_duration,
                    data.ante_type,
                    data.blind_increase_percent,
                    data.final_reentry_level,
                    tournament_id
                ]);
            } else {
                // Tạo defaults mới
                await database.executeQuery(`
                    INSERT INTO blind_structure (
                        tournament_id,
                        level_duration,
                        break_duration,
                        ante_type,
                        blind_increase_percent,
                        final_reentry_level
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    tournament_id,
                    data.level_duration,
                    data.break_duration,
                    data.ante_type,
                    data.blind_increase_percent,
                    data.final_reentry_level
                ]);
            }

            return true;
        } catch (error) {
            console.error('Lỗi khi lưu blind defaults:', error);
            throw error;
        }
    });

    // Thêm blind level
    ipcMain.handle('add-blind-level', async (event, data) => {
        try {
            // Lấy tournament_id hiện tại
            const tournament = await database.executeQueries(`
                SELECT id FROM tournaments ORDER BY id DESC LIMIT 1
            `);
            
            if (!tournament || !tournament[0]) {
                throw new Error('Không tìm thấy tournament');
            }

            const tournament_id = tournament[0].id;

            // Không cần chuyển đổi duration vì đã được chuyển từ blind-structure.js
            const duration_minutes = data.duration_minutes || 0;

            const query = `INSERT INTO blind_structure 
                (tournament_id, level, duration_minutes, small_blind, big_blind, ante, is_break) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`;
            
            if (data.is_break) {
                // Nếu là break thì chỉ cần duration, các giá trị khác là 0
                await database.executeQuery(query, [
                    tournament_id,
                    0, // level = 0 cho break
                    duration_minutes,
                    0, // small_blind
                    0, // big_blind
                    0, // ante
                    1  // is_break = true
                ]);
            } else {
                // Nếu là level bình thường
                await database.executeQuery(query, [
                    tournament_id,
                    data.level_number,
                    duration_minutes,
                    data.small_blind || 0,
                    data.big_blind || 0,
                    data.ante || 0,
                    0  // is_break = false
                ]);
            }
            return true;
        } catch (error) {
            console.error('Lỗi khi thêm level blind:', error);
            throw error;
        }
    });

    // Xóa blind level
    ipcMain.handle('delete-blind-level', async (event, data) => {
        try {
            // Lấy tournament_id hiện tại
            const tournament = await database.executeQueries(`
                SELECT id FROM tournaments ORDER BY id DESC LIMIT 1
            `);
            
            if (!tournament || !tournament[0]) {
                throw new Error('Không tìm thấy tournament');
            }

            const tournament_id = tournament[0].id;

            // Xử lý khác nhau cho break và level
            if (data.isBreak) {
                // Xóa break dựa trên vị trí của nó trong bảng
                await database.executeQuery(
                    'DELETE FROM blind_structure WHERE tournament_id = ? AND is_break = 1 AND level = 0', 
                    [tournament_id]
                );
            } else {
                // Xóa level dựa trên level number
                await database.executeQuery(
                    'DELETE FROM blind_structure WHERE tournament_id = ? AND level = ? AND is_break = 0', 
                    [tournament_id, data.level]
                );

                // Lấy tất cả level còn lại (không bao gồm break) và sắp xếp theo id
                const remainingLevels = await database.executeQueries(`
                    SELECT id, level 
                    FROM blind_structure 
                    WHERE tournament_id = ? AND is_break = 0
                    ORDER BY id ASC
                `, [tournament_id]);

                // Cập nhật lại số thứ tự từ 1 đến n
                for (let i = 0; i < remainingLevels.length; i++) {
                    await database.executeQuery(`
                        UPDATE blind_structure 
                        SET level = ? 
                        WHERE id = ? AND tournament_id = ?
                    `, [i + 1, remainingLevels[i].id, tournament_id]);
                }
            }

            return true;
        } catch (error) {
            console.error('Lỗi khi xóa level/break:', error);
            throw error;
        }
    });

    // Reset blind structure
    ipcMain.handle('resetBlindStructure', async () => {
        try {
            // Lấy tournament_id hiện tại
            const tournament = await database.executeQueries(`
                SELECT id FROM tournaments ORDER BY id DESC LIMIT 1
            `);
            
            if (!tournament || !tournament[0]) {
                throw new Error('Không tìm thấy tournament');
            }

            const tournament_id = tournament[0].id;

            // Xóa toàn bộ dữ liệu trong bảng blind_structure cho tournament hiện tại
            await database.executeQuery(
                'DELETE FROM blind_structure WHERE tournament_id = ?',
                [tournament_id]
            );

            return true;
        } catch (error) {
            console.error('Lỗi khi reset blind structure:', error);
            throw error;
        }
    });

    return {
        // Phương thức có thể cần xuất ra khi import module
    };
}

module.exports = setupBlindHandlers;