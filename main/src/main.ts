import { BrowserWindow, app, screen } from 'electron';
import { is } from 'electron-util';
import { isDev } from 'electron-util/main';
import * as path from 'path';
import { format } from 'url';

let win: BrowserWindow | null = null;

async function createWindow() {
  const size = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    minWidth: 1200,
    minHeight: 600,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });

  if (isDev) {
    // this is the default port electron-esbuild is using
    win.loadURL('http://localhost:4200');
  } else {
    win.loadURL(
      format({
        pathname: path.join(__dirname, 'renderer/index.html'),
        protocol: 'file',
        slashes: true,
      }),
    );
  }

  win.on('closed', () => {
    win = null;
  });

  win.webContents.on('devtools-opened', () => {
    win!.focus();
  });

  win.on('ready-to-show', () => {
    win!.show();
    win!.focus();

    if (isDev) {
      win!.webContents.openDevTools({ mode: 'bottom' });
    }
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (!is.macos) {
    app.quit();
  }
});

app.on('activate', () => {
  if (win === null && app.isReady()) {
    createWindow();
  }
});
