const { autoUpdater } = require('electron-updater');
const { dialog, ipcMain, BrowserWindow } = require('electron');
const log = require('electron-log');

// Configure logger
log.transports.file.level = 'debug'; // Increase log level for troubleshooting
autoUpdater.logger = log;
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Configure auto updater with more options
autoUpdater.allowDowngrade = false;
autoUpdater.allowPrerelease = false; // Set to true if you want to include beta versions

function setupAutoUpdater(mainWindow) {
    log.info('Auto updater initialized');
    
    // Check for updates on startup (delay to ensure app is fully loaded)
    setTimeout(() => {
        log.info('Checking for updates...');
        autoUpdater.checkForUpdates();
    }, 3000);

    // Schedule periodic update checks (every 4 hours)
    setInterval(() => {
        log.info('Running scheduled update check');
        autoUpdater.checkForUpdates();
    }, 4 * 60 * 60 * 1000);

    // Handle update found
    autoUpdater.on('update-available', (info) => {
        log.info('Update found:', info);
        
        // Send information to renderer process if mainWindow exists
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('update-available', {
                version: info.version,
                releaseDate: info.releaseDate,
                releaseNotes: info.releaseNotes
            });
        }

        // Display update confirmation dialog
        dialog.showMessageBox({
            type: 'info',
            title: 'Application Update',
            message: `New version available: ${info.version}`,
            detail: `New version released on ${new Date(info.releaseDate).toLocaleDateString()}. Do you want to download and install it?`,
            buttons: ['Download', 'Skip'],
            defaultId: 0
        }).then(({ response }) => {
            if (response === 0) {
                log.info('User initiated download');
                autoUpdater.downloadUpdate();
            } else {
                log.info('User skipped update');
            }
        });
    });

    // Handle update not available
    autoUpdater.on('update-not-available', (info) => {
        log.info('No updates available', info);
    });

    // Handle download progress
    autoUpdater.on('download-progress', (progressObj) => {
        log.info(`Download progress: ${progressObj.percent}%`);
        
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('download-progress', progressObj);
        }
    });

    // When download is complete
    autoUpdater.on('update-downloaded', (info) => {
        log.info('Update downloaded:', info);
        
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('update-downloaded', info);
        }

        // Show notification and ask user if they want to install now
        dialog.showMessageBox({
            type: 'info',
            title: 'Install Update',
            message: 'Update Ready',
            detail: 'A new version has been downloaded. Restart the application to install the update?',
            buttons: ['Install Now', 'Install Later'],
            defaultId: 0
        }).then(({ response }) => {
            if (response === 0) {
                log.info('Installing update now');
                autoUpdater.quitAndInstall(false, true);
            } else {
                log.info('User chose to install later');
            }
        });
    });

    // Handle errors
    autoUpdater.on('error', (err) => {
        log.error('Update error:', err);
        
        // Only show error dialog for genuine errors, not when offline
        const errorMessage = err.message || 'Unknown error occurred';
        const isOfflineError = errorMessage.includes('net::ERR_INTERNET_DISCONNECTED') || 
                               errorMessage.includes('net::ERR_NETWORK_CHANGED') ||
                               errorMessage.includes('net::ERR_NAME_NOT_RESOLVED');
        
        if (!isOfflineError && mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('update-error', errorMessage);
            
            dialog.showMessageBox({
                type: 'error',
                title: 'Update Error',
                message: 'Failed to check for updates',
                detail: errorMessage,
                buttons: ['OK']
            });
        }
    });

    // Register IPC handlers to interact with renderer process
    ipcMain.handle('check-for-updates', () => {
        log.info('Manual update check requested');
        return autoUpdater.checkForUpdates();
    });

    ipcMain.handle('download-update', () => {
        log.info('Manual download requested');
        return autoUpdater.downloadUpdate();
    });

    ipcMain.handle('install-update', () => {
        log.info('Manual install requested');
        return autoUpdater.quitAndInstall(false, true);
    });

    return {
        checkForUpdates: () => autoUpdater.checkForUpdates(),
        downloadUpdate: () => autoUpdater.downloadUpdate(),
        quitAndInstall: () => autoUpdater.quitAndInstall(false, true)
    };
}

module.exports = setupAutoUpdater;