const { ipcMain } = require('electron');
const database = require('../windows/server/database');

// Handler để reset toàn bộ database
function setupDatabaseHandlers() {
    ipcMain.handle('reset-database', async () => {
        try {
            console.log('=== Bắt đầu reset database ===');
            
            // Reset tournament_stats
            await database.executeQuery(`
                UPDATE tournament_stats 
                SET total_entries = 0,
                    players_left = 0,
                    reentries = 0,
                    addons = 0,
                    total_chips = 0,
                    average_stack = 0
                WHERE id = (SELECT id FROM tournament_stats LIMIT 1)
            `);

            // Reset blind_structure
            await database.executeQuery('DELETE FROM blind_structure');

            // Reset reentries_addons về giá trị mặc định
            await database.executeQuery(`
                UPDATE reentries_addons 
                SET allow_reentry = 0,
                    reentry_limit = 2,
                    allow_addon = 0,
                    addon_price = 500,
                    addon_chips = 5000
                WHERE id = (SELECT id FROM reentries_addons LIMIT 1)
            `);

            // Reset tournaments về giá trị mặc định
            await database.executeQuery(`
                UPDATE tournaments 
                SET buy_in_price = 1000,
                    starting_stack = 10000,
                    freeroll = 0,
                    charge_rake = 1,
                    rake_amount = 100
                WHERE id = (SELECT id FROM tournaments LIMIT 1)
            `);

            // Reset players table
            await database.executeQuery('DELETE FROM players');
            await database.executeQuery('DELETE FROM sqlite_sequence WHERE name = "players"');

            console.log('=== Reset database thành công ===');
            return { success: true };
        } catch (error) {
            console.error('Lỗi khi reset database:', error);
            throw error;
        }
    });

    // Handler để thực hiện truy vấn SQL trực tiếp
    ipcMain.handle('execute-query', async (event, sql, params = []) => {
        try {
            const result = await database.executeQuery(sql, params);
            return result;
        } catch (error) {
            console.error('Lỗi khi thực hiện truy vấn SQL:', error);
            throw error;
        }
    });

    // Hàm khởi tạo database
    async function initDatabase() {
        try {
            await database.initDatabase();
            console.log('Database khởi tạo thành công');
        } catch (error) {
            console.error('Lỗi khi khởi tạo database:', error);
            throw error;
        }
    }

    return {
        initDatabase
    };
}

module.exports = setupDatabaseHandlers;