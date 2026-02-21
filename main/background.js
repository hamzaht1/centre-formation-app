const { app, BrowserWindow } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;
const RAILWAY_URL = 'https://centre-formation-app-production.up.railway.app';

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  let mainWindow;

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  function createWindow(url) {
    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      icon: path.join(__dirname, '../renderer/public/icon.png'),
    });

    mainWindow.loadURL(url);

    if (isDev) {
      mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }

  app.whenReady().then(() => {
    if (isDev) {
      createWindow('http://localhost:3000/login');
    } else {
      createWindow(`${RAILWAY_URL}/login`);
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      if (isDev) {
        createWindow('http://localhost:3000/login');
      } else {
        createWindow(`${RAILWAY_URL}/login`);
      }
    }
  });
}
