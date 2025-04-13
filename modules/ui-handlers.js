const { ipcMain, BrowserWindow } = require('electron');
const path = require('path');

function setupUIHandlers(appState) {
    // Handler cho sự kiện đặt màu nền
    ipcMain.on('set-background-color', (event, color) => {
        appState.currentBackgroundColor = color;
        // Nếu cửa sổ live tournament đang mở, gửi màu nền mới tới nó
        if (appState.liveTournamentWindow) {
            appState.liveTournamentWindow.webContents.send('background-color-changed', color);
        }
    });

    // Handler cho sự kiện đặt ảnh nền
    ipcMain.on('set-background-image', (event, imageUrl) => {
        appState.currentBackgroundImage = imageUrl;
        // Nếu cửa sổ live tournament đang mở, gửi ảnh nền mới tới nó
        if (appState.liveTournamentWindow) {
            appState.liveTournamentWindow.webContents.send('background-image-changed', imageUrl);
        }
    });

    // Handler cho sự kiện đặt video nền
    ipcMain.on('set-background-video', (event, videoData) => {
        appState.currentBackgroundVideo = videoData.url;
        appState.currentBackgroundVideoType = videoData.type;
        // Nếu cửa sổ live tournament đang mở, gửi video nền mới tới nó
        if (appState.liveTournamentWindow) {
            appState.liveTournamentWindow.webContents.send('background-video-changed', videoData);
        }
    });

    // Xử lý timer control
    ipcMain.handle('timer-control', async (event, action) => {
        if (appState.liveTournamentWindow) {
            appState.liveTournamentWindow.webContents.send('timer-control', action);
        }
    });

    // Xử lý minimize window
    ipcMain.on('minimize-window', (event) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (window) {
            window.minimize();
        } else if (appState.liveTournamentWindow) {
            appState.liveTournamentWindow.minimize();
        }
    });

    // Xử lý hiển thị bảng điểm
    ipcMain.handle('show-leaderboard', async (event, action) => {
        if (appState.liveTournamentWindow) {
            appState.liveTournamentWindow.webContents.send('show-leaderboard', action);
            return { success: true };
        }
        return { success: false, error: 'Màn hình live tournament chưa được mở' };
    });

    // Xử lý IPC start live tournament
    ipcMain.on('start-live-tournament', async (event, tournamentData) => {
        try {
            // Lưu dữ liệu giải đấu hiện tại
            appState.currentTournamentData = tournamentData;

            // Tạo cửa sổ live tournament nếu chưa tồn tại
            if (!appState.liveTournamentWindow) {
                createLiveTournamentWindow(appState);
            }
        } catch (error) {
            console.error('Lỗi khi bắt đầu live tournament:', error);
        }
    });

    function createLiveTournamentWindow(appState) {
        // Tạo cửa sổ mới cho live tournament
        appState.liveTournamentWindow = new BrowserWindow({
            width: 1000,
            height: 700,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload: path.join(__dirname, '../preload.js')
            }
        });

        // Xóa menu bar cho cửa sổ live tournament
        appState.liveTournamentWindow.setMenu(null);

        // Load file live-tournament.html
        appState.liveTournamentWindow.loadFile(path.join(__dirname, '../windows/live-tournament.html'));

        // Xử lý khi cửa sổ bị đóng
        appState.liveTournamentWindow.on('closed', () => {
            appState.liveTournamentWindow = null;
        });

        // Gửi màu nền hiện tại khi cửa sổ được tạo
        appState.liveTournamentWindow.webContents.on('did-finish-load', () => {
            if (appState.currentBackgroundColor) {
                appState.liveTournamentWindow.webContents.send('background-color-changed', appState.currentBackgroundColor);
            }
            if (appState.currentBackgroundImage) {
                appState.liveTournamentWindow.webContents.send('background-image-changed', appState.currentBackgroundImage);
            }
            if (appState.currentBackgroundVideo) {
                appState.liveTournamentWindow.webContents.send('background-video-changed', {
                    url: appState.currentBackgroundVideo,
                    type: appState.currentBackgroundVideoType
                });
            }
        });
    }

    return {
        createLiveTournamentWindow
    };
}

module.exports = setupUIHandlers;