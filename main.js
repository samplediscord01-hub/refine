import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serverProcess = null;

const startServer = () => {
  return new Promise((resolve, reject) => {
    serverProcess = spawn('npm', ['run', 'dev:server'], {
      cwd: __dirname,
      stdio: 'pipe'
    });

    serverProcess.stdout.on('data', (data) => {
      console.log('Server:', data.toString());
      if (data.toString().includes('Server running on')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('Server Error:', data.toString());
    });

    serverProcess.on('error', reject);
  });
};

async function createWindow () {
  // Start server first
  try {
    await startServer();
    console.log('Server started successfully');
  } catch (error) {
    console.error('Failed to start server:', error);
  }

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  win.webContents.on('did-finish-load', () => {
    win.webContents.send('server-info', serverInfo);
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5000');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, 'dist/public/index.html'));
  }
}

async function healthCheck(port) {
  for (let i = 0; i < 10; i++) {
    try {
      const response = await fetch(`http://localhost:${port}/health`);
      if (response.ok) {
        return;
      }
    } catch (e) {
      console.error('Health check attempt failed:', e);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Server health check failed');
}

app.whenReady().then(async () => {
  try {
    // serverInfo = await startServer(); // This line is replaced by the startServer call within createWindow
    await healthCheck(serverInfo.port); // serverInfo is not defined here anymore
    createWindow();
  } catch (error) {
    console.error('Failed to start server or health check failed:', error);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', async (event) => {
  event.preventDefault();
  try {
    // Assuming stopServer exists and can be called without arguments or with necessary info
    if (serverProcess) {
      serverProcess.kill(); // Send SIGTERM to the server process
    }
    // If you had a separate stopServer function for graceful shutdown, you'd call it here.
    // For now, we'll rely on process kill.
  } catch (error) {
    console.error('Failed to stop server:', error);
  } finally {
    app.exit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});