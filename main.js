const { app, BrowserWindow, dialog, Menu } = require('electron');
const path = require('path');
const BanManager = require('./ban-manager');

// Import modules
const setupDatabaseHandlers = require('./modules/database-handlers');
const setupTournamentHandlers = require('./modules/tournament-handlers');
const setupBlindHandlers = require('./modules/blind-handlers');
const setupPlayerHandlers = require('./modules/player-handlers');
const setupUIHandlers = require('./modules/ui-handlers');
const setupAppSecurity = require('./modules/app-security');
const setupAutoUpdater = require('./modules/auto-updater');

// Initialize state variables
let mainWindow;
let appState = {
    liveTournamentWindow: null,
    currentTournamentData: null,
    currentBackgroundColor: '#121212',
    currentBackgroundImage: null,
    currentBackgroundVideo: null,
    currentBackgroundVideoType: null
};

const banManager = new BanManager();

// Initialize handlers
const appSecurity = setupAppSecurity(banManager);
const databaseHandlers = setupDatabaseHandlers();
const tournamentHandlers = setupTournamentHandlers(() => appState.liveTournamentWindow);
const blindHandlers = setupBlindHandlers();
const playerHandlers = setupPlayerHandlers();
const uiHandlers = setupUIHandlers(appState);

async function createWindow() {
    try {
        // Initialize database
        await databaseHandlers.initDatabase();

        // Remove menu bar completely
        Menu.setApplicationMenu(null);

        // Create browser window
        mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload: path.join(__dirname, 'preload.js')
            }
        });

        // Load index.html file
        mainWindow.loadFile(path.join(__dirname, 'windows/index.html'));

        mainWindow.on('closed', () => {
            mainWindow = null;
        });
        
        // Initialize auto updater
        const autoUpdater = setupAutoUpdater(mainWindow);
    } catch (error) {
        console.error('Could not initialize window:', error);
        throw error;
    }
}

// Add application startup function
async function initializeApp() {
    try {
        // Check ban status first
        const canStart = await appSecurity.checkAppStatus();
        if (!canStart) {
            console.log('Application is banned, cannot start');
            app.quit();
            return;
        }

        // Create main window
        await createWindow();
        
        // Start periodic checks
        const checkInterval = appSecurity.startStatusCheck(mainWindow);
        
        // Stop checks when app exits
        app.on('before-quit', () => {
            clearInterval(checkInterval);
        });

        // Handle activate event for macOS
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
    } catch (error) {
        console.error('Application startup error:', error);
        dialog.showMessageBox({
            type: 'error',
            title: 'Startup Error',
            message: 'An error occurred while starting the application. Please try again.',
            buttons: ['Close'],
            defaultId: 0
        }).then(() => {
            app.quit();
        });
    }
}

// Start application when ready
app.whenReady().then(initializeApp);

// Quit app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});