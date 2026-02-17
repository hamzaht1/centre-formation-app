const { app, BrowserWindow } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const { startNextServer, stopServer } = require('./next-server');

let mainWindow;

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

app.whenReady().then(async () => {
  if (isDev) {
    createWindow('http://localhost:3000');
  } else {
    try {
      const userDataPath = app.getPath('userData');
      const port = await startNextServer(userDataPath);
      createWindow(`http://127.0.0.1:${port}`);
    } catch (err) {
      console.error('Failed to start Next.js server:', err);
      app.quit();
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopServer();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    if (isDev) {
      createWindow('http://localhost:3000');
    }
  }
});
