/* FocusPulse — Electron main process
 * - Loads the built Vite app from ../dist
 * - Creates a system tray so the app runs forever in the background
 * - Hides to tray on window close (instead of quitting)
 * - Auto-launches at OS login
 */
const { app, BrowserWindow, Tray, Menu, nativeImage, shell } = require("electron");
const path = require("path");

let mainWindow = null;
let tray = null;
let isQuitting = false;

const INDEX_HTML = path.join(__dirname, "..", "dist", "index.html");
const ICON_PATH = path.join(__dirname, "icon.png"); // optional; falls back to empty image

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: true,
    backgroundColor: "#0b0d10",
    title: "FocusPulse",
    icon: ICON_PATH,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.removeMenu();
  mainWindow.loadFile(INDEX_HTML);

  // Safety net: if anything tries to navigate to a non-file URL inside the
  // window (e.g. a stray <a href="/settings">), cancel it and route it
  // through the in-app HashRouter instead. Prevents the "404 / black screen"
  // that happens when Electron is asked to load a path that doesn't exist
  // on disk.
  mainWindow.webContents.on("will-navigate", (e, url) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "file:") {
        e.preventDefault();
        shell.openExternal(url);
        return;
      }
      // Same file:// origin but a different path — bounce back to index.html
      if (!url.endsWith("index.html") && !url.includes("index.html#")) {
        e.preventDefault();
        mainWindow.loadFile(INDEX_HTML);
      }
    } catch {
      e.preventDefault();
    }
  });

  // Hide to tray instead of quitting
  mainWindow.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

function createTray() {
  let image;
  try {
    image = nativeImage.createFromPath(ICON_PATH);
    if (image.isEmpty()) image = nativeImage.createEmpty();
  } catch {
    image = nativeImage.createEmpty();
  }
  tray = new Tray(image);
  tray.setToolTip("FocusPulse — running in background");

  const menu = Menu.buildFromTemplate([
    {
      label: "Open FocusPulse",
      click: () => {
        if (!mainWindow) createWindow();
        else {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: "separator" },
    {
      label: "Launch at login",
      type: "checkbox",
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => {
        app.setLoginItemSettings({ openAtLogin: item.checked, openAsHidden: true });
      },
    },
    { type: "separator" },
    {
      label: "Quit FocusPulse",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(menu);
  tray.on("click", () => {
    if (!mainWindow) return createWindow();
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

// Single-instance lock — prevents multiple background copies
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    createTray();

    // Auto-launch at OS login (first run sets it; user can toggle from tray)
    if (!app.getLoginItemSettings().openAtLogin) {
      app.setLoginItemSettings({ openAtLogin: true, openAsHidden: true });
    }

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
      else mainWindow?.show();
    });
  });
}

// Keep app alive when all windows are hidden (tray-resident)
app.on("window-all-closed", (e) => {
  e.preventDefault();
});

app.on("before-quit", () => {
  isQuitting = true;
});
