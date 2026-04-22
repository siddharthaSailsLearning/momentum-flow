# FocusPulse — Run it for real, forever, on your machine

You have **three** ways to run FocusPulse on your computer. Pick the one that matches your goal.

| Option | What you get | Best for |
|---|---|---|
| **A. Native desktop app (Electron)** | A real `FocusPulse.exe` / `.app` / Linux binary. Lives in the system tray. Auto-starts at login. Single-click launch. | Windows / macOS / Linux desktop users — **recommended** |
| **B. Docker (always-on web app)** | A container that runs forever, restarts on reboot, accessible at `http://localhost:8080` | Servers, NAS, Raspberry Pi, headless boxes |
| **C. Plain web (npm run dev)** | Local dev server | Quick test only |

---

## Prerequisites

Install **once**:

- **Node.js 20+** — <https://nodejs.org>
- **Git** — <https://git-scm.com>
- (Option B only) **Docker Desktop** — <https://www.docker.com/products/docker-desktop/>

Then clone your project from Lovable (GitHub export) and `cd` into it:

```bash
git clone <your-repo-url> focuspulse
cd focuspulse
npm install
```

---

## Option A — Native desktop app (recommended) 🖥️

This produces a real OS executable that:
- Runs in the **system tray** (background-resident, never closes)
- **Auto-launches at login** (toggle from the tray menu)
- Survives window close (hides to tray instead of quitting)
- Single-instance (clicking the icon twice doesn't open two copies)

### 1. Install Electron tooling (one-time)

```bash
npm install --save-dev electron@^33 @electron/packager@^18
```

### 2. Add 4 scripts to `package.json`

Open `package.json` and merge these into the `scripts` block (see `electron/package-overrides.json` for the exact JSON):

```json
{
  "main": "electron/main.cjs",
  "scripts": {
    "electron:dev": "vite build && electron electron/main.cjs",
    "electron:build:win":   "vite build && electron-packager . FocusPulse --platform=win32  --arch=x64       --out=electron-release --overwrite --asar --ignore=^/src --ignore=^/public --ignore=^/electron-release",
    "electron:build:mac":   "vite build && electron-packager . FocusPulse --platform=darwin --arch=universal --out=electron-release --overwrite --asar --ignore=^/src --ignore=^/public --ignore=^/electron-release",
    "electron:build:linux": "vite build && electron-packager . FocusPulse --platform=linux  --arch=x64       --out=electron-release --overwrite --asar --ignore=^/src --ignore=^/public --ignore=^/electron-release"
  }
}
```

> ⚠️ Make sure `"main": "electron/main.cjs"` is at the **root** of `package.json`, not inside `scripts`.

### 3. Try it (dev mode)

```bash
npm run electron:dev
```

A native window opens with the full FocusPulse app. Close the window → it minimises to the tray. Right-click the tray icon → **Quit FocusPulse** to fully exit.

### 4. Build the real installer / executable

Run the command for **your OS**:

```bash
# Windows  → produces electron-release/FocusPulse-win32-x64/FocusPulse.exe
npm run electron:build:win

# macOS    → produces electron-release/FocusPulse-darwin-universal/FocusPulse.app
npm run electron:build:mac

# Linux    → produces electron-release/FocusPulse-linux-x64/FocusPulse
npm run electron:build:linux
```

### 5. Install & run forever

#### Windows
1. Open `electron-release\FocusPulse-win32-x64\`
2. (Optional) Move the whole folder to `C:\Program Files\FocusPulse\`
3. Right-click `FocusPulse.exe` → **Create shortcut** → drag the shortcut onto your Desktop & Start Menu
4. **Double-click `FocusPulse.exe` once.** It will:
   - Show the main window
   - Add itself to the system tray (bottom-right)
   - Register itself for auto-launch at login (toggle anytime from the tray menu)
5. From now on it starts automatically every time Windows boots, and lives quietly in the tray sending reminders.

> Want a real `.msi` / `.exe` installer instead of a folder? Use [`electron-builder`](https://www.electron.build) on a Windows machine — same source files work.

#### macOS
1. Drag `FocusPulse.app` into `/Applications`
2. Open it once (right-click → Open the first time, to bypass Gatekeeper)
3. Tray menu → ✅ **Launch at login**

#### Linux
1. Move `electron-release/FocusPulse-linux-x64/` to `/opt/focuspulse/`
2. Create a desktop entry at `~/.config/autostart/focuspulse.desktop`:
   ```ini
   [Desktop Entry]
   Type=Application
   Name=FocusPulse
   Exec=/opt/focuspulse/FocusPulse
   X-GNOME-Autostart-enabled=true
   ```
3. Reboot — FocusPulse starts automatically on login.

---

## Option B — Docker (always-on web service) 🐳

Use this if you want FocusPulse running on a **server, NAS, or Raspberry Pi** and accessible from any browser on your network.

### 1. Build the image

```bash
docker build -t focuspulse .
```

### 2. Run it forever

```bash
docker run -d \
  --name focuspulse \
  --restart=always \
  -p 8080:80 \
  focuspulse
```

`--restart=always` makes Docker restart the container on crash **and on every reboot**. It will run forever until you `docker stop focuspulse`.

### 3. Open it

<http://localhost:8080> (or `http://<your-server-ip>:8080` from another device)

### Useful commands

```bash
docker logs -f focuspulse        # live logs
docker stop focuspulse           # stop
docker start focuspulse          # start again
docker rm -f focuspulse          # remove
docker pull <new image> && ...   # update
```

### docker-compose alternative

Create `docker-compose.yml`:

```yaml
services:
  focuspulse:
    build: .
    restart: always
    ports:
      - "8080:80"
```

Then: `docker compose up -d`

---

## Option C — Plain web (dev only) 🌐

```bash
npm run dev
```

Open <http://localhost:8080>. **Stops when you close the terminal.** Not for daily use.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| **404 page on launch, then black screen after "Return to homepage"** (Windows .exe) | Caused by `BrowserRouter` under the `file://` protocol. Already fixed in `src/App.tsx` — the app auto-switches to `HashRouter` when `window.location.protocol === "file:"`. Just rebuild: delete `dist/` and `electron-release/`, then re-run `npm run electron:build:win`. URLs inside the .exe will look like `index.html#/settings` — that's correct. |
| White / blank window in Electron | `vite.config.ts` must have `base: "./"` (already set in this repo). Re-run `vite build`. |
| Tray icon missing on Windows | Drop a 256×256 PNG named `icon.png` into `electron/`. |
| App opens twice | The single-instance lock is enabled — make sure only one `FocusPulse.exe` is in autostart. |
| `__dirname is not defined` | The main file **must** be `electron/main.cjs` (CommonJS), not `.js`. |
| Reminders don't fire when window is closed | They do — the engine keeps running in the hidden window because the tray keeps the process alive. Don't right-click → Quit unless you mean it. |
| Docker build fails on `npm install` | Delete `bun.lock` locally, or use `node:20` (not alpine) if you hit native-module errors. |

---

## What "runs forever" actually means here

- **Electron build:** the OS auto-starts FocusPulse at login → it lives in the tray → reminders keep firing as long as you're logged in. Survives lid-close/sleep (resumes on wake).
- **Docker build:** `--restart=always` means the container restarts on crash and on host reboot. Truly 24/7 if the host is on.

Pick **Option A** for personal desktop use, **Option B** for a home-server / always-on box.
