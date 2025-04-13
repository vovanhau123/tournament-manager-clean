# Luồng Dữ Liệu Trong Ứng Dụng Tournament

## 1. Cấu Trúc Database

### Bảng `tournaments`
- `id`: ID của giải đấu
- `name`: Tên giải đấu
- `location`: Địa điểm
- `buy_in_price`: Giá buy-in (cents)
- `starting_stack`: Stack khởi đầu
- `freeroll`: Có phải freeroll không (0/1)
- `charge_rake`: Có tính phí không (0/1)
- `rake_amount`: Số tiền phí (cents)
- `currency`: Loại tiền tệ

### Bảng `blind_structure`
- `id`: ID của level
- `tournament_id`: ID giải đấu (foreign key)
- `level`: Số level
- `duration_minutes`: Thời gian của level (đơn vị: giây)
- `small_blind`: Small blind
- `big_blind`: Big blind
- `ante`: Ante
- `is_break`: Có phải break không (0/1)

## 2. Luồng Dữ Liệu

### 2.1. Lưu Dữ Liệu Tournament Info
```javascript
// Trong tournament-info.js
class TournamentInfo {
    // Cấu trúc dữ liệu tournament
    tournamentData = {
        name: '',
        location: '',
        buy_in_price: 0,
        starting_stack: 10000,
        currency: 'dollar',
        charge_rake: 0,
        rake_amount: 0
    };

    // Lưu dữ liệu khi form thay đổi
    saveTournamentData() {
        window.api.saveTournamentData(this.tournamentData);
    }
}

// Trong main.js
ipcMain.handle('save-tournament-data', async (event, data) => {
    try {
        const db = getDatabase();
        const result = executeQuery(`
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
        return result;
    } catch (error) {
        console.error('Lỗi khi lưu dữ liệu tournament:', error);
        throw error;
    }
});

### 2.2. Khởi động màn Live Tournament
1. User click nút "Bắt đầu giải đấu" trong dashboard
2. `main.js` tạo cửa sổ mới và load `live-tournament.html`
3. `live-tournament.js` được khởi tạo và gọi `loadTournamentData()`

### 2.3. Lấy Dữ Liệu từ Database
```javascript
// Trong main.js
ipcMain.handle('get-tournament-data', async () => {
    try {
        // 1. Lấy thông tin tournament mới nhất
        const tournaments = executeQueries(`
            SELECT * FROM tournaments ORDER BY id DESC LIMIT 1
        `);

        if (tournaments && tournaments[0]) {
            const tournament = tournaments[0];
            
            // 2. Lấy blind structure của tournament
            const blindStructure = executeQueries(`
                SELECT * FROM blind_structure 
                WHERE tournament_id = ? 
                ORDER BY level DESC LIMIT 1
            `, [tournament.id]);

            // 3. Tạo object dữ liệu trả về
            return {
                currentLevel: blindStructure[0]?.level || 1,
                remainingPlayers: 0,
                totalPrize: tournament.buy_in_price * (1 - tournament.rake_amount/100),
                currentBlinds: {
                    sb: blindStructure[0]?.small_blind || 25,
                    bb: blindStructure[0]?.big_blind || 50,
                    ante: blindStructure[0]?.ante || 0
                },
                duration: blindStructure[0]?.duration_minutes || 60
            };
        }
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu giải đấu:', error);
        return null;
    }
});
```

### 2.4. Hiển Thị Dữ Liệu
```javascript
// Trong live-tournament.js
updateTournamentInfo(data) {
    // 1. Cập nhật Level
    this.levelElement.textContent = `Level ${data.currentLevel || 1}`;
    
    // 2. Cập nhật Blinds
    this.blindsElement.textContent = `${blinds.sb} / ${blinds.bb} / ${blinds.ante}`;

    // 3. Cập nhật Timer
    if (data.duration) {
        this.remainingSeconds = data.duration;
        this.updateTimerDisplay();
    }

    // 4. Cập nhật thông tin entries và buyin
    this.updateEntriesInfo(data);
    this.updateBuyinInfo(data);
}
```

## 3. Xử Lý Timer

### 3.1. Khởi tạo Timer
- Timer được khởi tạo với giá trị từ `duration_minutes` trong database
- Thời gian được lưu dưới dạng giây trong `remainingSeconds`

### 3.2. Điều khiển Timer
```javascript
// Trong live-tournament.js
startTimer() {
    if (this.isPaused) {
        this.isPaused = false;
        this.timer = setInterval(() => {
            if (this.remainingSeconds > 0) {
                this.remainingSeconds--;
                this.updateTimerDisplay();
            }
        }, 1000);
    }
}

pauseTimer() {
    this.isPaused = true;
    if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
    }
}
```

### 3.3. Hiển thị Timer
```javascript
// Format MM:SS
formatTime(minutes, seconds) {
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
```

## 4. Giao Tiếp Giữa Các Cửa Sổ

### 4.1. Từ Dashboard đến Live Tournament
```javascript
// Trong dashboard.js
window.api.sendTimerControl('start'); // Bắt đầu timer
window.api.sendTimerControl('pause'); // Tạm dừng timer
window.api.sendTimerControl('resume'); // Tiếp tục timer
```

### 4.2. Xử lý trong Live Tournament
```javascript
// Trong live-tournament.js
window.api.onTimerControl((action) => {
    if (action === 'start' || action === 'resume') {
        this.startTimer();
    } else if (action === 'pause') {
        this.pauseTimer();
    }
});
``` 



dashboard-main.js - Module chính để khởi tạo dashboard
dashboard-ui.js - Chứa mã CSS và HTML template
player-manager.js - Quản lý danh sách người chơi
stats-manager.js - Quản lý thống kê và điểm số
tournament-controls.js - Điều khiển giải đấu