const { ipcMain, dialog, app } = require('electron');

function setupAppSecurity(banManager) {
    // IPC handler để hiển thị thông báo ban từ renderer process
    ipcMain.on('show-ban-dialog', (event, data) => {
        dialog.showMessageBox({
            type: 'error',
            title: 'Ứng dụng hết hạnhạn',
            message: `Ứng dụng của bạn đã hết hạn!\n\nLý do: ${data.reason}\nHết hạn: ${data.expiry ? new Date(data.expiry).toLocaleDateString('vi-VN') : 'Vĩnh viễn'}`,
            buttons: ['Đóng'],
            defaultId: 0
        }).then(() => {
            app.quit();
        });
    });

    async function checkAppStatus() {
        try {
            const status = await banManager.checkStatus();
            
            if (status.isBanned) {
                // Hiển thị dialog thông báo ban
                dialog.showMessageBox({
                    type: 'error',
                    title: 'Ứng dụng bị cấm',
                    message: `Ứng dụng của bạn đã bị cấm!\n\nLý do: ${status.banReason || 'Không có'}\nHết hạn: ${status.banExpiry ? new Date(status.banExpiry).toLocaleDateString('vi-VN') : 'Vĩnh viễn'}`,
                    buttons: ['Đóng'],
                    defaultId: 0
                }).then(() => {
                    app.quit();
                });
                return false;
            }
            return true;
        } catch (error) {
            console.error('Lỗi khi kiểm tra trạng thái:', error);
            
            // Kiểm tra trạng thái offline nếu lỗi kết nối
            const offlineStatus = banManager.readBanStatus();
            if (offlineStatus.isBanned) {
                dialog.showMessageBox({
                    type: 'error',
                    title: 'Ứng dụng bị cấm (Offline)',
                    message: `Ứng dụng của bạn đã bị cấm!\n\nLý do: ${offlineStatus.banReason || 'Không có'}\nHết hạn: ${offlineStatus.banExpiry ? new Date(offlineStatus.banExpiry).toLocaleDateString('vi-VN') : 'Vĩnh viễn'}`,
                    buttons: ['Đóng'],
                    defaultId: 0
                }).then(() => {
                    app.quit();
                });
                return false;
            }
            
            // Cho phép chạy trong trường hợp lỗi mà không có ban status
            return true;
        }
    }

    // Kiểm tra trạng thái định kỳ
    function startStatusCheck(mainWindow) {
        const checkInterval = setInterval(async () => {
            try {
                const status = await banManager.checkStatus();
                if (status.isBanned && mainWindow) {
                    // Gửi thông báo cho renderer process
                    mainWindow.webContents.send('app-banned', status);
                    
                    // Hiển thị dialog thông báo
                    dialog.showMessageBox({
                        type: 'error',
                        title: 'Ứng dụng bị cấm',
                        message: `Ứng dụng của bạn đã bị cấm!\n\nLý do: ${status.banReason || 'Không có'}\nHết hạn: ${status.banExpiry ? new Date(status.banExpiry).toLocaleDateString('vi-VN') : 'Vĩnh viễn'}`,
                        buttons: ['Đóng'],
                        defaultId: 0
                    }).then(() => {
                        clearInterval(checkInterval); // Dừng kiểm tra
                        app.quit();
                    });
                }
            } catch (error) {
                console.error('Lỗi kiểm tra trạng thái định kỳ:', error);
                
                // Kiểm tra trạng thái offline
                const offlineStatus = banManager.readBanStatus();
                if (offlineStatus.isBanned && mainWindow) {
                    mainWindow.webContents.send('app-banned', offlineStatus);
                    
                    dialog.showMessageBox({
                        type: 'error',
                        title: 'Ứng dụng bị cấm (Offline)',
                        message: `Ứng dụng của bạn đã bị cấm!\n\nLý do: ${offlineStatus.banReason || 'Không có'}\nHết hạn: ${offlineStatus.banExpiry ? new Date(offlineStatus.banExpiry).toLocaleDateString('vi-VN') : 'Vĩnh viễn'}`,
                        buttons: ['Đóng'],
                        defaultId: 0
                    }).then(() => {
                        clearInterval(checkInterval); // Dừng kiểm tra
                        app.quit();
                    });
                }
            }
        }, 5000); // Kiểm tra mỗi 5 giây
        
        // Lưu interval để có thể dừng khi cần
        return checkInterval;
    }

    return {
        checkAppStatus,
        startStatusCheck
    };
}

module.exports = setupAppSecurity;