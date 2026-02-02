const { contextBridge, ipcRenderer } = require('electron');

// Storage API
contextBridge.exposeInMainWorld('storage', {
    list: (prefix) => ipcRenderer.invoke('storage:list', prefix),
    get: (key) => ipcRenderer.invoke('storage:get', key),
    set: (key, value) => ipcRenderer.invoke('storage:set', key, value),
    delete: (key) => ipcRenderer.invoke('storage:delete', key),
});

// Updater API
contextBridge.exposeInMainWorld('updater', {
    checkForUpdates: () => ipcRenderer.invoke('updater:check'),
    downloadUpdate: () => ipcRenderer.invoke('updater:download'),
    installUpdate: () => ipcRenderer.invoke('updater:install'),
    getVersion: () => ipcRenderer.invoke('updater:getVersion'),
    onUpdateStatus: (callback) => {
        const listener = (event, data) => callback(data);
        ipcRenderer.on('update-status', listener);
        // Return cleanup function
        return () => ipcRenderer.removeListener('update-status', listener);
    }
});
