const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'api', {
        // Từ renderer tới main
        startLiveTournament: (data) => {
            ipcRenderer.send('start-live-tournament', data);
        },
        requestTournamentData: () => {
            ipcRenderer.send('request-tournament-data');
        },

        // Từ main tới renderer
        onTournamentData: (callback) => {
            ipcRenderer.on('tournament-data', (event, data) => callback(data));
        },

        // Database operations
        getTournamentData: () => {
            return ipcRenderer.invoke('get-tournament-data');
        },
        
        // API mới để lấy tên giải đấu
        getTournamentName: () => {
            return ipcRenderer.invoke('get-tournament-name');
        },

        // API để thực hiện truy vấn SQL trực tiếp
        query: (sql, params = []) => ipcRenderer.invoke('execute-query', sql, params),

        // Gửi timer control từ dashboard
        sendTimerControl: (action) => ipcRenderer.invoke('timer-control', action),
        
        // Nhận timer control ở live tournament
        onTimerControl: (callback) => ipcRenderer.on('timer-control', (event, action) => callback(action)),

        // API để lưu dữ liệu tournament
        saveTournamentData: (data) => ipcRenderer.invoke('save-tournament-data', data),

        // API để lấy dữ liệu reentries
        getReentriesData: () => ipcRenderer.invoke('get-reentries-data'),

        // API để lưu dữ liệu reentries
        saveReentriesData: (data) => ipcRenderer.invoke('save-reentries-data', data),

        // API để lấy dữ liệu blind structure
        getBlindStructure: () => ipcRenderer.invoke('get-blind-structure'),

        // API để lưu dữ liệu blind structure
        saveBlindStructure: (data) => ipcRenderer.invoke('save-blind-structure', data),

        // API để thêm level mới vào blind structure
        addBlindLevel: (data) => ipcRenderer.invoke('add-blind-level', data),

        // API để xóa level khỏi blind structure
        deleteBlindLevel: (data) => ipcRenderer.invoke('delete-blind-level', data),

        // API để reset toàn bộ blind structure
        resetBlindStructure: () => ipcRenderer.invoke('resetBlindStructure'),

        // API để cập nhật tournament stats
        updateTournamentStats: (data) => ipcRenderer.invoke('update-tournament-stats', data),

        // API để lấy tournament stats
        getTournamentStats: () => ipcRenderer.invoke('get-tournament-stats'),

        // API để reset toàn bộ database
        resetDatabase: () => ipcRenderer.invoke('reset-database'),

        // API để thêm player mới
        addPlayer: (playerData) => ipcRenderer.invoke('add-player', playerData),

        // API để xóa player
        deletePlayer: (playerId) => ipcRenderer.invoke('delete-player', playerId),

        // API để lấy danh sách players
        getPlayers: () => ipcRenderer.invoke('get-players'),

        // API để cập nhật avatar của player
        updatePlayerAvatar: (playerId, avatarBase64) => ipcRenderer.invoke('update-player-avatar', playerId, avatarBase64),

        // API để cập nhật tên của player
        updatePlayerName: (playerId, newName) => ipcRenderer.invoke('update-player-name', playerId, newName),

        // API để cập nhật điểm của player
        updatePlayerScore: (playerId, winType, newValue) => ipcRenderer.invoke('update-player-score', playerId, winType, newValue),

        // API để cập nhật trạng thái người chơi
        updatePlayerStatus: (playerId, newStatus) => ipcRenderer.invoke('update-player-status', playerId, newStatus),

        // API để lấy cấu hình điểm
        getPointConfig: () => ipcRenderer.invoke('get-point-config'),

        // API để cập nhật cấu hình điểm
        updatePointConfig: (data) => ipcRenderer.invoke('update-point-config', data),

        // API để gửi lệnh hiển thị bảng điểm
        sendLeaderboardCommand: (action) => ipcRenderer.invoke('show-leaderboard', action),

        // API để nhận lệnh hiển thị bảng điểm từ main process
        onLeaderboardCommand: (callback) => ipcRenderer.on('show-leaderboard', (event, action) => callback(action)),
        
        // API để ẩn cửa sổ
        minimizeWindow: () => ipcRenderer.send('minimize-window'),

        // API mới để gửi màu nền
        sendBackgroundColor: (color) => ipcRenderer.send('set-background-color', color),

        // API để nhận màu nền từ main process
        onBackgroundColorChange: (callback) => ipcRenderer.on('background-color-changed', (event, color) => callback(color)),
        
        // API mới để gửi ảnh nền
        sendBackgroundImage: (imageUrl) => ipcRenderer.send('set-background-image', imageUrl),
        
        // API để nhận ảnh nền từ main process
        onBackgroundImageChange: (callback) => ipcRenderer.on('background-image-changed', (event, imageUrl) => callback(imageUrl)),
        
        // API mới để gửi video nền
        sendBackgroundVideo: (videoData) => ipcRenderer.send('set-background-video', videoData),
        
        // API để nhận video nền từ main process
        onBackgroundVideoChange: (callback) => ipcRenderer.on('background-video-changed', (event, videoData) => callback(videoData)),

        // === API cho Auto Updater ===
        // Kiểm tra cập nhật mới
        checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
        
        // Tải xuống bản cập nhật
        downloadUpdate: () => ipcRenderer.invoke('download-update'),
        
        // Cài đặt bản cập nhật
        installUpdate: () => ipcRenderer.invoke('install-update'),
        
        // Nhận thông báo khi có bản cập nhật mới
        onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (event, info) => callback(info)),
        
        // Nhận thông tin về tiến độ tải xuống
        onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, progressObj) => callback(progressObj)),
        
        // Nhận thông báo khi bản cập nhật đã tải xong
        onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (event, info) => callback(info)),
        
        // Nhận thông báo khi có lỗi xảy ra trong quá trình cập nhật
        onUpdateError: (callback) => ipcRenderer.on('update-error', (event, message) => callback(message))
    }
);

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    };

    for (const type of ['chrome', 'node', 'electron']) {
        replaceText(`${type}-version`, process.versions[type]);
    }
});


contextBridge.exposeInMainWorld('banAPI', {
    // Nhận thông báo khi ứng dụng bị ban
    onBanned: (callback) => {
        ipcRenderer.on('app-banned', (event, data) => {
            callback(data);
        });
    },
    
    // Hiển thị dialog thông báo ban
    showBanDialog: (data) => {
        ipcRenderer.send('show-ban-dialog', data);
    }
});



