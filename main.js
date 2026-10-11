// JARVIS Desktop — casca Electron para o jarvis.py (o cérebro continua sendo o Python).
//   • abre a orb numa janela própria (tela cheia com F11)
//   • "segundo plano": a janela vai para a bandeja; o jarvis.py (mic, voz, agente) segue rodando
//   • inicia o jarvis.py sozinho, se ele ainda não estiver rodando
const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, dialog, nativeImage, session } = require("electron");
const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");

const HTTP_PORT = parseInt(process.env.JARVIS_HUD_HTTP_PORT || "8000", 10) || 8000;
const WS_PORT = parseInt(process.env.JARVIS_HUD_PORT || "8765", 10) || 8765;
const ORB_URL = `http://127.0.0.1:${HTTP_PORT}/` + (WS_PORT !== 8765 ? `?port=${WS_PORT}` : "");
const ORB_ORIGIN = `http://127.0.0.1:${HTTP_PORT}`;
const HIDE_HOTKEY = "CommandOrControl+Alt+H";   // esconde/mostra (Ctrl+Alt+J fica para o atalho do Windows que ABRE o app)
const START_HIDDEN = process.argv.includes("--hidden");   // inicia direto na bandeja (voz já funcionando)

let win = null;
let tray = null;
let pyProc = null;        // só existe se ESTE app iniciou o jarvis.py
let quitting = false;

// ---------- pasta do projeto (onde está o jarvis.py) ----------
const cfgFile = () => path.join(app.getPath("userData"), "config.json");
function readCfg() { try { return JSON.parse(fs.readFileSync(cfgFile(), "utf8")); } catch (_) { return {}; } }
function writeCfg(c) { try { fs.mkdirSync(path.dirname(cfgFile()), { recursive: true }); fs.writeFileSync(cfgFile(), JSON.stringify(c, null, 2)); } catch (_) {} }
const hasJarvis = (d) => !!d && fs.existsSync(path.join(d, "jarvis.py"));

function findProjectDir() {
  const candidates = [process.env.JARVIS_DIR, readCfg().projectDir, path.resolve(__dirname, ".."), path.resolve(__dirname, "..", "jarvis-main")];
  return candidates.find(hasJarvis) || null;
}
async function askProjectDir() {
  const r = await dialog.showOpenDialog({ title: "Selecione a pasta do JARVIS (onde está o jarvis.py)", properties: ["openDirectory"] });
  if (r.canceled || !r.filePaths[0] || !hasJarvis(r.filePaths[0])) return null;
  writeCfg({ ...readCfg(), projectDir: r.filePaths[0] });
  return r.filePaths[0];
}

// ---------- falar com o jarvis.py ----------
function orbIsUp(timeoutMs = 800) {
  return new Promise((resolve) => {
    const req = http.get({ host: "127.0.0.1", port: HTTP_PORT, path: "/", timeout: timeoutMs }, (res) => { res.resume(); resolve(res.statusCode === 200); });
    req.on("error", () => resolve(false));
    req.on("timeout", () => { req.destroy(); resolve(false); });
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function startPython(dir) {
  const out = fs.openSync(path.join(dir, "jarvis_start.txt"), "a");
  const py = process.env.JARVIS_PYTHON || "python";
  pyProc = spawn(py, ["jarvis.py"], {
    cwd: dir, windowsHide: true, stdio: ["ignore", out, out],
    env: { ...process.env, JARVIS_NO_BROWSER: "1", PYTHONIOENCODING: "utf-8" },
  });
  pyProc.on("error", (e) => { pyProc = null; dialog.showErrorBox("JARVIS", `Não consegui iniciar o Python ("${py}"): ${e.message}\nConfira se o Python está no PATH.`); });
  pyProc.on("exit", () => { pyProc = null; });
}
function killPython() {
  if (!pyProc) return;
  try {
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(pyProc.pid), "/T", "/F"], { windowsHide: true });
    else pyProc.kill("SIGTERM");
  } catch (_) {}
  pyProc = null;
}

// ---------- janela ----------
function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 720, minHeight: 480,
    backgroundColor: "#05070b", title: "J.A.R.V.I.S.", autoHideMenuBar: true, show: false,
    icon: path.join(__dirname, "build", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
      additionalArguments: [`--jarvis-ws-port=${WS_PORT}`],
      backgroundThrottling: false,   // a orb não "congela" ao ficar escondida
    },
  });
  win.once("ready-to-show", () => { if (!START_HIDDEN) win.show(); });
  win.loadFile(path.join(__dirname, "loading.html"));
  win.setMenuBarVisibility(false);

  win.webContents.on("before-input-event", (e, input) => {
    if (input.type !== "keyDown") return;
    if (input.key === "F11") { e.preventDefault(); toggleFullscreen(); }
    if (input.key === "Escape" && win.isFullScreen()) { e.preventDefault(); win.setFullScreen(false); }
  });
  // a janela só navega dentro da orb; nada de abrir sites dentro do app
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (e, url) => { if (!url.startsWith(ORB_ORIGIN) && !url.startsWith("file://")) e.preventDefault(); });

  // fechar (X) = segundo plano. Sair de verdade: bandeja → Sair.
  win.on("close", (e) => { if (!quitting) { e.preventDefault(); hideWindow(); } });
}
function showWindow() { if (!win) return; if (win.isMinimized()) win.restore(); win.show(); win.focus(); }
function hideWindow() { if (!win) return; if (win.isFullScreen()) win.setFullScreen(false); win.hide(); }
function toggleFullscreen() { if (win) win.setFullScreen(!win.isFullScreen()); }

function windowAction(action) {
  if (!win) return;
  switch (action) {
    case "hide": hideWindow(); break;
    case "minimize": win.minimize(); break;
    case "show": showWindow(); break;
    case "fullscreen": showWindow(); win.setFullScreen(true); break;
    case "exit-fullscreen": win.setFullScreen(false); break;
    case "toggle-fullscreen": toggleFullscreen(); break;
  }
}


// ---------- estatísticas reais do PC (alimentam o "Monitor do sistema" do painel) ----------
let lastCpu = os.cpus();
function cpuPct() {
  const now = os.cpus(); let idle = 0, total = 0;
  now.forEach((c, i) => {
    const p = lastCpu[i] || c;
    const sum = (x) => Object.values(x.times).reduce((a, b) => a + b, 0);
    total += sum(c) - sum(p); idle += c.times.idle - p.times.idle;
  });
  lastCpu = now;
  return total > 0 ? 100 * (1 - idle / total) : 0;
}
function diskPct() {
  try {
    const st = fs.statfsSync(path.parse(os.homedir()).root);
    return st.blocks > 0 ? 100 * (1 - st.bavail / st.blocks) : null;
  } catch (_) { return null; }
}
function startStats() {
  setInterval(() => {
    if (!win || win.isDestroyed() || !win.isVisible()) return;
    win.webContents.send("jarvis:stats", { cpu: cpuPct(), ram: 100 * (1 - os.freemem() / os.totalmem()), disk: diskPct() });
  }, 2000);
}

// ---------- bandeja ----------
// Rodando com `npm start` (não empacotado), "iniciar com o Windows" precisa apontar para o app, senão abriria um Electron vazio.
const loginOpts = () => (app.isPackaged ? {} : { path: process.execPath, args: [app.getAppPath()] });
function createTray() {
  const img = nativeImage.createFromPath(path.join(__dirname, "build", "tray.png"));
  tray = new Tray(img.isEmpty() ? nativeImage.createEmpty() : img.resize({ width: 16, height: 16 }));
  tray.setToolTip("J.A.R.V.I.S. — rodando em segundo plano");
  const rebuild = () => tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Mostrar JARVIS", click: showWindow },
    { label: "Tela cheia (F11)", click: () => windowAction("fullscreen") },
    { label: "Esconder (segundo plano)", click: hideWindow },
    { type: "separator" },
    { label: "Iniciar com o Windows", type: "checkbox", checked: app.getLoginItemSettings(loginOpts()).openAtLogin,
      click: (m) => { app.setLoginItemSettings({ openAtLogin: m.checked, ...loginOpts() }); rebuild(); } },
    { label: "Trocar pasta do JARVIS…", click: async () => { const d = await askProjectDir(); if (d) dialog.showMessageBox({ message: "Pasta salva. Reinicie o app para valer." }); } },
    { type: "separator" },
    { label: "Sair (encerra o JARVIS)", click: () => { quitting = true; app.quit(); } },
  ]));
  rebuild();
  tray.on("click", showWindow);
}

// ---------- ciclo de vida ----------
if (!app.requestSingleInstanceLock()) { app.quit(); }
else {
  app.on("second-instance", showWindow);
  app.whenReady().then(async () => {
    // microfone só para a própria orb
    session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(perm === "media" && wc.getURL().startsWith(ORB_ORIGIN)));

    createWindow();
    createTray();
    startStats();
    globalShortcut.register(HIDE_HOTKEY, () => (win && win.isVisible() ? hideWindow() : showWindow()));

    let dir = findProjectDir();
    if (!(await orbIsUp())) {                 // se o jarvis.py já roda (ex.: Jarvis.vbs), não abre outro: seriam 2 microfones
      if (!dir) dir = await askProjectDir();
      if (!dir) { dialog.showErrorBox("JARVIS", "Não encontrei o jarvis.py. Selecione a pasta do projeto."); quitting = true; return app.quit(); }
      startPython(dir);
    }
    for (let i = 0; i < 60; i++) {            // espera até ~30 s
      if (await orbIsUp()) { win.loadURL(ORB_URL); return; }
      await sleep(500);
    }
    win.loadFile(path.join(__dirname, "loading.html"), { query: { msg: "O núcleo não respondeu. Veja jarvis_start.txt e jarvis.log na pasta do projeto." } });
  });
  ipcMain.on("jarvis:window", (_e, action) => windowAction(String(action)));
  app.on("window-all-closed", (e) => e.preventDefault());   // continua na bandeja
  app.on("before-quit", () => { quitting = true; });
  app.on("will-quit", () => { globalShortcut.unregisterAll(); killPython(); });
}
