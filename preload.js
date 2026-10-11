// Ponte segura entre a orb (página) e o Electron. A página NÃO ganha acesso ao Node.
// Aqui também ficamos ouvindo o WebSocket do jarvis.py: quando o Jarvis entende
// "fique em segundo plano" / "tela cheia", ele manda {type:"window", action:"..."}.
const { contextBridge, ipcRenderer } = require("electron");

const arg = (name, def) => {
  const hit = process.argv.find((a) => a.startsWith("--" + name + "="));
  return hit ? hit.split("=").slice(1).join("=") : def;
};
const WS_PORT = parseInt(arg("jarvis-ws-port", "8765"), 10) || 8765;
const ALLOWED = new Set(["hide", "show", "fullscreen", "exit-fullscreen", "toggle-fullscreen", "minimize"]);

contextBridge.exposeInMainWorld("jarvisDesktop", {
  isDesktop: true,
  window: (action) => (ALLOWED.has(action) ? ipcRenderer.send("jarvis:window", action) : undefined),
  onStats: (cb) => {
    if (typeof cb !== "function") return;
    ipcRenderer.on("jarvis:stats", (_e, s) => {
      const n = (v) => (typeof v === "number" && isFinite(v) ? v : null);
      cb({ cpu: n(s && s.cpu), ram: n(s && s.ram), disk: n(s && s.disk) });
    });
  },
});

let sock = null;
function connect() {
  try {
    sock = new WebSocket("ws://127.0.0.1:" + WS_PORT);
  } catch (_) {
    return setTimeout(connect, 2000);
  }
  sock.onopen = () => sock.send(JSON.stringify({ type: "hello", client: "desktop" }));
  sock.onmessage = (ev) => {
    if (typeof ev.data !== "string") return;
    let msg;
    try { msg = JSON.parse(ev.data); } catch (_) { return; }
    if (msg && msg.type === "window" && ALLOWED.has(msg.action)) {
      ipcRenderer.send("jarvis:window", msg.action);
    }
  };
  sock.onclose = () => setTimeout(connect, 2000);
  sock.onerror = () => { try { sock.close(); } catch (_) {} };
}
connect();
