const { app, BrowserWindow, ipcMain, clipboard } = require('electron');
const path = require('path');
const crypto = require('crypto');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    resizable: true,
    icon: path.join(__dirname, 'assets/icon.png') // We'll create this later
  });

  // Set minimum size
  mainWindow.setMinimumSize(400, 400);

  // and load the index.html of the app.
  mainWindow.loadFile('index.html');

  // Open the DevTools if in development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Store signaling data globally
let hostSignalingData = null;
let connectionToken = null;

// IPC handlers for P2P functionality
ipcMain.handle('generate-token', () => {
  return crypto.randomBytes(32).toString('hex');
});

ipcMain.handle('copy-to-clipboard', (event, text) => {
  clipboard.writeText(text);
  return true;
});

// Store host signaling data
ipcMain.handle('store-host-signal', (event, data) => {
  hostSignalingData = data;
  console.log('Host signaling data stored');
  return true;
});

// Store connection token
ipcMain.handle('store-connection-token', (event, token) => {
  connectionToken = token;
  return true;
});

// Get host signaling data
ipcMain.handle('get-host-signal', (event) => {
  console.log('Getting host signal:', hostSignalingData ? 'available' : 'not available');
  return hostSignalingData;
});

// Get connection token
ipcMain.handle('get-connection-token', (event) => {
  return connectionToken;
});

// Clear signaling data
ipcMain.handle('clear-signaling-data', (event) => {
  hostSignalingData = null;
  connectionToken = null;
  return true;
});