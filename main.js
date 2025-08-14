import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';
const port = 5000;

async function healthCheck() {
  const maxRetries = 30; // 30 retries * 1 second = 30 seconds max wait
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`http://localhost:${port}/health`, { timeout: 1000 });
      if (response.ok) {
        console.log('Health check passed. Server is ready.');
        return;
      }
    } catch (e) {
      // Ignore connection refused errors and try again
    }
    console.log(`Health check attempt ${i + 1}/${maxRetries} failed. Retrying in 1 second...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Server did not become ready in time.');
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !isDev,
    },
    icon: path.join(__dirname, 'attached_assets', 'image_1755143284120.png'),
    show: false,
  });

  win.webContents.once('did-finish-load', () => {
    win.show();
  });

  if (isDev) {
    await healthCheck(); // Wait for the server to be ready
    win.loadURL(`http://localhost:${port}`);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(async () => {
  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
