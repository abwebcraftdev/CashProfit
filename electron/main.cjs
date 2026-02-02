const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { autoUpdater } = require('electron-updater');

const DATA_DIR = path.join(app.getPath('userData'), 'data');

// Ensure data directory exists
if (!fsSync.existsSync(DATA_DIR)) {
    fsSync.mkdirSync(DATA_DIR, { recursive: true });
}

let mainWindow = null;

// =====================================================
// AUTO-UPDATER CONFIGURATION
// =====================================================

// Configure auto-updater
autoUpdater.autoDownload = false; // Don't download automatically, let user decide
autoUpdater.autoInstallOnAppQuit = true;

// Logging for debugging
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
    sendUpdateStatus('checking');
});

autoUpdater.on('update-available', (info) => {
    sendUpdateStatus('available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes || 'Ameliorations et corrections de bugs.'
    });
});

autoUpdater.on('update-not-available', (info) => {
    sendUpdateStatus('not-available', { version: info.version });
});

autoUpdater.on('error', (err) => {
    sendUpdateStatus('error', { message: err.message });
});

autoUpdater.on('download-progress', (progressObj) => {
    sendUpdateStatus('downloading', {
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total,
        bytesPerSecond: progressObj.bytesPerSecond
    });
});

autoUpdater.on('update-downloaded', (info) => {
    sendUpdateStatus('downloaded', {
        version: info.version,
        releaseNotes: info.releaseNotes
    });
});

function sendUpdateStatus(status, data = {}) {
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('update-status', { status, ...data });
    }
}

// =====================================================
// IPC HANDLERS FOR UPDATES
// =====================================================

ipcMain.handle('updater:check', async () => {
    try {
        const result = await autoUpdater.checkForUpdates();
        return { success: true, result };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('updater:download', async () => {
    try {
        await autoUpdater.downloadUpdate();
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('updater:install', () => {
    autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('updater:getVersion', () => {
    return app.getVersion();
});

// =====================================================
// WINDOW CREATION
// =====================================================

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'CashProfit',
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

        // Check for updates after window is ready (only in production)
        mainWindow.webContents.on('did-finish-load', () => {
            setTimeout(() => {
                autoUpdater.checkForUpdates().catch(err => {
                    console.log('Update check failed:', err.message);
                });
            }, 3000); // Wait 3 seconds before checking
        });
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// =====================================================
// STORAGE API HANDLERS
// =====================================================

ipcMain.handle('storage:list', async (event, prefix) => {
    try {
        const files = await fs.readdir(DATA_DIR);
        const keys = files
            .filter(f => f.endsWith('.json'))
            .map(f => {
                const id = f.replace('sim_', '').replace('.json', '');
                return `sim:${id}`;
            });

        return { keys };
    } catch (error) {
        console.error('Error listing files:', error);
        return { keys: [] };
    }
});

ipcMain.handle('storage:get', async (event, key) => {
    try {
        const filename = key.replace(':', '_') + '.json';
        const filePath = path.join(DATA_DIR, filename);
        const content = await fs.readFile(filePath, 'utf-8');
        return { value: content };
    } catch (error) {
        return { value: null };
    }
});

ipcMain.handle('storage:set', async (event, key, value) => {
    try {
        const filename = key.replace(':', '_') + '.json';
        const filePath = path.join(DATA_DIR, filename);
        await fs.writeFile(filePath, value, 'utf-8');
        return true;
    } catch (error) {
        console.error('Error saving file:', error);
        throw error;
    }
});

ipcMain.handle('storage:delete', async (event, key) => {
    try {
        const filename = key.replace(':', '_') + '.json';
        const filePath = path.join(DATA_DIR, filename);
        await fs.unlink(filePath);
        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
});
