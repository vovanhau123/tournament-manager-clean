const { ipcMain } = require('electron');
const database = require('../windows/server/database');

function setupPlayerHandlers() {
    // Thêm player mới
    ipcMain.handle('add-player', async (event, playerData) => {
        try {
            const result = await database.executeQuery(`
                INSERT INTO players (
                    avatar, name, win1_sng, win2_sng, win3_sng,
                    win1_tour, win2_tour, win3_tour, points
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
                `Người chơi ${Math.floor(Math.random() * 1000)}`,
                0, // win1_sng
                0, // win2_sng
                0, // win3_sng
                0, // win1_tour
                0, // win2_tour
                0, // win3_tour
                0  // points
            ]);
            return result;
        } catch (error) {
            console.error('Lỗi khi thêm player:', error);
            throw error;
        }
    });

    // Xóa player
    ipcMain.handle('delete-player', async (event, playerId) => {
        try {
            await database.executeQuery('DELETE FROM players WHERE id = ?', [playerId]);
            return true;
        } catch (error) {
            console.error('Lỗi khi xóa player:', error);
            throw error;
        }
    });

    // Lấy danh sách players
    ipcMain.handle('get-players', async () => {
        try {
            const players = await database.executeQueries('SELECT * FROM players ORDER BY points DESC');
            return players;
        } catch (error) {
            console.error('Lỗi khi lấy danh sách players:', error);
            throw error;
        }
    });

    // Cập nhật avatar của player
    ipcMain.handle('update-player-avatar', async (event, playerId, avatarBase64) => {
        try {
            const result = await database.executeQuery(`
                UPDATE players 
                SET avatar = ? 
                WHERE id = ?
            `, [avatarBase64, playerId]);
            return result;
        } catch (error) {
            console.error('Lỗi khi cập nhật avatar:', error);
            throw error;
        }
    });

    // Cập nhật tên của player
    ipcMain.handle('update-player-name', async (event, playerId, newName) => {
        try {
            const result = await database.executeQuery(`
                UPDATE players 
                SET name = ? 
                WHERE id = ?
            `, [newName, playerId]);
            return result;
        } catch (error) {
            console.error('Lỗi khi cập nhật tên:', error);
            throw error;
        }
    });

    // Cập nhật điểm của player
    ipcMain.handle('update-player-score', async (event, playerId, winType, newValue) => {
        try {
            // Cập nhật điểm cho loại win cụ thể
            await database.executeQuery(`
                UPDATE players 
                SET ${winType} = ? 
                WHERE id = ?
            `, [newValue, playerId]);

            // Lấy tất cả điểm của player để tính tổng
            const playerData = await database.executeQueries(`
                SELECT win1_sng, win2_sng, win3_sng, win1_tour, win2_tour, win3_tour
                FROM players 
                WHERE id = ?
            `, [playerId]);

            // Lấy cấu hình điểm từ bảng point_config
            const pointConfig = await database.executeQueries(`
                SELECT * FROM point_config ORDER BY id DESC LIMIT 1
            `);

            if (playerData && playerData[0] && pointConfig && pointConfig[0]) {
                // Tính tổng điểm mới dựa trên cấu hình từ database
                const totalPoints = (
                    (playerData[0].win1_sng || 0) * pointConfig[0].win1_sng_points +
                    (playerData[0].win2_sng || 0) * pointConfig[0].win2_sng_points +
                    (playerData[0].win3_sng || 0) * pointConfig[0].win3_sng_points +
                    (playerData[0].win1_tour || 0) * pointConfig[0].win1_tour_points +
                    (playerData[0].win2_tour || 0) * pointConfig[0].win2_tour_points +
                    (playerData[0].win3_tour || 0) * pointConfig[0].win3_tour_points
                );

                // Cập nhật tổng điểm vào database
                await database.executeQuery(`
                    UPDATE players 
                    SET points = ? 
                    WHERE id = ?
                `, [totalPoints, playerId]);

                // Trả về điểm mới để cập nhật giao diện
                return { points: totalPoints };
            }
            throw new Error('Không tìm thấy thông tin người chơi hoặc cấu hình điểm');
        } catch (error) {
            console.error('Lỗi khi cập nhật điểm:', error);
            throw error;
        }
    });

    // Cập nhật trạng thái người chơi
    ipcMain.handle('update-player-status', async (event, playerId, newStatus) => {
        try {
            // Kiểm tra tham số
            if (!playerId) {
                throw new Error('Thiếu ID người chơi');
            }
            if (!newStatus) {
                throw new Error('Thiếu trạng thái mới');
            }

            console.log('Cập nhật trạng thái:', { playerId, newStatus });

            const result = await database.executeQuery(`
                UPDATE players 
                SET status = ? 
                WHERE id = ?
            `, [newStatus, playerId]);

            // Kiểm tra kết quả cập nhật
            if (result) {
                console.log('Cập nhật trạng thái thành công');
                return { success: true, status: newStatus };
            } else {
                throw new Error('Không thể cập nhật trạng thái');
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái người chơi:', error);
            throw error;
        }
    });

    // Lấy cấu hình điểm
    ipcMain.handle('get-point-config', async () => {
        try {
            const pointConfig = await database.executeQueries(`
                SELECT * FROM point_config ORDER BY id DESC LIMIT 1
            `);
            return pointConfig && pointConfig[0] ? pointConfig[0] : null;
        } catch (error) {
            console.error('Lỗi khi lấy cấu hình điểm:', error);
            throw error;
        }
    });

    // Cập nhật cấu hình điểm
    ipcMain.handle('update-point-config', async (event, data) => {
        try {
            // Cập nhật điểm trong database
            await database.executeQuery(`
                UPDATE point_config 
                SET win1_sng_points = ?,
                    win2_sng_points = ?,
                    win3_sng_points = ?,
                    win1_tour_points = ?,
                    win2_tour_points = ?,
                    win3_tour_points = ?
                WHERE id = (SELECT id FROM point_config ORDER BY id DESC LIMIT 1)
            `, [
                data.win1_sng_points,
                data.win2_sng_points,
                data.win3_sng_points,
                data.win1_tour_points,
                data.win2_tour_points,
                data.win3_tour_points
            ]);

            // Cập nhật lại điểm cho tất cả players
            const players = await database.executeQueries('SELECT * FROM players');
            for (const player of players) {
                const totalPoints = (
                    (player.win1_sng || 0) * data.win1_sng_points +
                    (player.win2_sng || 0) * data.win2_sng_points +
                    (player.win3_sng || 0) * data.win3_sng_points +
                    (player.win1_tour || 0) * data.win1_tour_points +
                    (player.win2_tour || 0) * data.win2_tour_points +
                    (player.win3_tour || 0) * data.win3_tour_points
                );

                await database.executeQuery(`
                    UPDATE players 
                    SET points = ? 
                    WHERE id = ?
                `, [totalPoints, player.id]);
            }

            return { success: true };
        } catch (error) {
            console.error('Lỗi khi cập nhật cấu hình điểm:', error);
            throw error;
        }
    });

    return {
        // Phương thức có thể cần xuất ra khi import module
    };
}

module.exports = setupPlayerHandlers;