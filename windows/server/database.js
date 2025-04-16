const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let db = null;
const DB_DIR = path.join(__dirname, 'database');
const DB_PATH = path.join(DB_DIR, 'data.sqlite');

async function initDatabase() {
    try {
        // Đảm bảo thư mục database tồn tại
        if (!fs.existsSync(DB_DIR)) {
            fs.mkdirSync(DB_DIR, { recursive: true });
            console.log(`Đã tạo thư mục database tại: ${DB_DIR}`);
        }
        
        // Khởi tạo SQL.js
        const SQL = await initSqlJs();
        
        // Kiểm tra xem file database đã tồn tại chưa
        if (fs.existsSync(DB_PATH)) {
            // Nếu có, tải database từ file
            const filebuffer = fs.readFileSync(DB_PATH);
            db = new SQL.Database(filebuffer);
            console.log(`Database đã được tải từ: ${DB_PATH}`);
        } else {
            // Nếu chưa, tạo database mới
            db = new SQL.Database();
            
            // Tạo các bảng tournaments
            createTournamentTables();
            
            // Lưu database vào file
            saveDatabase();
            console.log(`Database mới đã được tạo tại: ${DB_PATH}`);
        }
        
        return db;
    } catch (error) {
        console.error('Lỗi khi khởi tạo database:', error);
        throw error;
    }
}

function getDatabase() {
    if (!db) {
        throw new Error('Database chưa được khởi tạo');
    }
    return db;
}

// Hàm để lưu database vào file
function saveDatabase() {
    if (!db) {
        throw new Error('Database chưa được khởi tạo');
    }
    
    try {
        // Xuất database thành binary data
        const data = db.export();
        // Lưu binary data vào file
        fs.writeFileSync(DB_PATH, Buffer.from(data));
    } catch (error) {
        console.error('Lỗi khi lưu database:', error);
        throw error;
    }
}

// Hàm để thực thi truy vấn SQL đơn lẻ
function executeQuery(sql, params = []) {
    const database = getDatabase();
    try {
        const stmt = database.prepare(sql);
        const result = stmt.getAsObject(params);
        stmt.free();
        // Lưu thay đổi vào file sau khi thực hiện truy vấn
        saveDatabase();
        return result;
    } catch (error) {
        console.error('Lỗi khi thực thi truy vấn:', error);
        throw error;
    }
}

// Hàm để thực thi nhiều truy vấn SQL
function executeQueries(query, params = []) {
    try {
        console.log('Executing query:', query);
        console.log('With params:', params);
        
        const db = getDatabase();
        const stmt = db.prepare(query);
        
        // Bind params nếu có
        if (params && params.length > 0) {
            stmt.bind(params);
        }

        const results = [];
        while (stmt.step()) {
            results.push(stmt.getAsObject());
        }
        
        stmt.free();
        console.log('Query results:', results);
        return results;
    } catch (error) {
        console.error('Lỗi khi thực thi truy vấn:', error);
        throw error;
    }
}

// Hàm để thực thi truy vấn SQL (sử dụng cho việc tạo bảng)
function execSQL(sql) {
    const database = getDatabase();
    try {
        database.run(sql);
        return true;
    } catch (error) {
        console.error('Lỗi khi thực thi SQL:', sql, error);
        throw error;
    }
}

// Hàm tạo các bảng tournament
function createTournamentTables() {
    // 1. Tạo tất cả các bảng trước
    // Tạo bảng tournaments
    execSQL(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT,
      buy_in_price INTEGER DEFAULT 0,
      starting_stack INTEGER DEFAULT 10000,
      freeroll INTEGER DEFAULT 0,
      charge_rake INTEGER DEFAULT 0,
      rake_amount INTEGER DEFAULT 0,
      currency TEXT DEFAULT 'dollar',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    // Tạo bảng blind_structure
    execSQL(`
    CREATE TABLE IF NOT EXISTS blind_structure (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      level INTEGER NOT NULL,
      duration_minutes INTEGER,
      small_blind INTEGER,
      big_blind INTEGER,
      ante INTEGER DEFAULT 0,
      is_break INTEGER DEFAULT 0,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
    );
    `);

    // Tạo bảng reentries_addons
    execSQL(`
    CREATE TABLE IF NOT EXISTS reentries_addons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      allow_reentry INTEGER DEFAULT 0,
      reentry_limit INTEGER DEFAULT 0,
      allow_addon INTEGER DEFAULT 0,
      addon_price INTEGER DEFAULT 0,
      addon_chips INTEGER DEFAULT 0,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
    );
    `);

    // Tạo bảng blind_defaults
    execSQL(`
    CREATE TABLE IF NOT EXISTS blind_defaults (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      level_duration INTEGER,
      break_duration INTEGER,
      ante_type TEXT,
      blind_increase_percent INTEGER,
      final_reentry_level INTEGER,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
    );
    `);

    // Tạo bảng prize_distribution
    execSQL(`
    CREATE TABLE IF NOT EXISTS prize_distribution (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      show_distribution INTEGER DEFAULT 0,
      distribution_type TEXT,
      use_overlay INTEGER DEFAULT 0,
      round_prizes INTEGER DEFAULT 0,
      guaranteed_prize_pool INTEGER DEFAULT 0,
      example_total_entries INTEGER DEFAULT 0,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
    );
    `);

    // Tạo bảng prize_percents
    execSQL(`
    CREATE TABLE IF NOT EXISTS prize_percents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prize_distribution_id INTEGER NOT NULL,
      place INTEGER NOT NULL,
      percentage REAL NOT NULL,
      FOREIGN KEY (prize_distribution_id) REFERENCES prize_distribution(id) ON DELETE CASCADE
    );
    `);

    // Tạo bảng tournament_stats
    execSQL(`
    CREATE TABLE IF NOT EXISTS tournament_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      total_entries INTEGER DEFAULT 0,
      players_left INTEGER DEFAULT 0,
      reentries INTEGER DEFAULT 0,
      addons INTEGER DEFAULT 0,
      total_chips INTEGER DEFAULT 0,
      average_stack INTEGER DEFAULT 0,
      rebuy_stack INTEGER DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
    );
    `);

    // Tạo bảng players
    execSQL(`
           CREATE TABLE players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            avatar TEXT,
            name TEXT,
            win1_sng INTEGER DEFAULT 0,
            win2_sng INTEGER DEFAULT 0,
            win3_sng INTEGER DEFAULT 0,
            win1_tour INTEGER DEFAULT 0,
            win2_tour INTEGER DEFAULT 0,
            win3_tour INTEGER DEFAULT 0,
            points INTEGER DEFAULT 0,
            status TEXT DEFAULT 'Đang chơi' -- Trạng thái: Đang chơi, Bị loại
        );
        `);
        execSQL(`
             CREATE TABLE point_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            win1_sng_points INTEGER,
            win2_sng_points INTEGER,
            win3_sng_points INTEGER,
            win1_tour_points INTEGER,
            win2_tour_points INTEGER,
            win3_tour_points INTEGER
        );
         `);

    console.log("Tất cả các bảng đã được tạo");

    // 2. Thêm dữ liệu mẫu cho tất cả các bảng
    
    // Thêm tournament mẫu
    execSQL(`
    INSERT INTO tournaments (
      name, location, buy_in_price, starting_stack, freeroll, charge_rake, rake_amount, currency
    ) VALUES 
    ('Weekend Tournament', 'Poker Club Saigon', 1000, 10000, 0, 1, 100, 'dollar')
    `);

    // Thêm blind structure mẫu
    // execSQL(`
    // INSERT INTO blind_structure (
    //   tournament_id, level, duration_minutes, small_blind, big_blind, ante, is_break
    // ) VALUES 
    // (1, 1, 20, 25, 50, 0, 0)
    // `);
    
    // Thêm reentries_addons mẫu
    execSQL(`
    INSERT INTO reentries_addons (
      tournament_id, allow_reentry, reentry_limit, allow_addon, addon_price, addon_chips
    ) VALUES 
    (1, 0, 2, 0, 500, 5000)
    `);
    
    // Thêm blind_defaults mẫu
    execSQL(`
    INSERT INTO blind_defaults (
      tournament_id, level_duration, break_duration, ante_type, blind_increase_percent, final_reentry_level
    ) VALUES 
    (1, 20, 10, 'percentage', 30, 6)
    `);
    
    // Thêm prize_distribution mẫu
    execSQL(`
    INSERT INTO prize_distribution (
      tournament_id, show_distribution, distribution_type, use_overlay, round_prizes, guaranteed_prize_pool, example_total_entries
    ) VALUES 
    (1, 1, 'standard', 0, 1, 10000, 20)
    `);
    
    // Thêm prize_percents mẫu
    execSQL(`
    INSERT INTO prize_percents (
      prize_distribution_id, place, percentage
    ) VALUES 
    (1, 1, 50.0)
    `);

    // Thêm dữ liệu mẫu cho tournament_stats
    execSQL(`
    INSERT INTO tournament_stats (
      tournament_id, total_entries, players_left, reentries, addons, total_chips, average_stack, rebuy_stack 
    ) VALUES 
    (1, 0, 0, 0, 0, 0, 0, 0)
    `);



    execSQL(`
        INSERT INTO point_config  (
          win1_sng_points , win2_sng_points , win3_sng_points, win1_tour_points, win2_tour_points, win3_tour_points
        ) VALUES 
        (20, 15, 15, 40, 25, 15)
        `);
    console.log("Đã thêm dữ liệu mẫu vào tất cả các bảng");
}

// Thêm các hàm helper để cập nhật tournament stats
async function updateTournamentStats(tournamentId, stats) {
    try {
        const query = `
            UPDATE tournament_stats 
            SET total_entries = ?,
                players_left = ?,
                reentries = ?,
                addons = ?,
                total_chips = ?,
                average_stack = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE tournament_id = ?
        `;
        
        executeQuery(query, [
            stats.total_entries,
            stats.players_left,
            stats.reentries,
            stats.addons,
            stats.total_chips,
            stats.average_stack,
            tournamentId
        ]);
        
        return true;
    } catch (error) {
        console.error('Lỗi khi cập nhật tournament stats:', error);
        throw error;
    }
}

async function getTournamentStats(tournamentId) {
    try {
        const query = `
            SELECT * FROM tournament_stats 
            WHERE tournament_id = ?
        `;
        
        return executeQueries(query, [tournamentId]);
    } catch (error) {
        console.error('Lỗi khi lấy tournament stats:', error);
        throw error;
    }
}

module.exports = {
    initDatabavvfse,
    getDatabase,
    executvvvveQuery,bgg
    executeQuvvveries,
    save vvDatabase,bgggg
    exbvvecSQL,gf
    updateTourvvvnamentStats,vvv
    getTournabbmentStatsggb
};