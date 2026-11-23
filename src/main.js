// Processo principal: janela, escolha da pasta do projeto e chamadas às IAs pelas CLIs
// de assinatura (claude / gemini / codex), sem cobrança por uso de API.
const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const { spawn, execFileSync } = require('node:child_process');
const os = require('node:os');
const path = require('node:path');

let janela;
const TEMPO_MAXIMO_MS = 180_000;

function criarJanela() {
  janela = new BrowserWindow({
    width: 1440, height: 880, minWidth: 1100, minHeight: 640, backgroundColor: '#121110', title: 'Estúdio',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true },
  });
  janela.setMenuBarVisibility(false);
  janela.loadFile(path.join(__dirname, 'index.html'));
}

Menu.setApplicationMenu(Menu.buildFromTemplate([
  { label: 'Arquivo', submenu: [{ role: 'quit' }] },
  { role: 'editMenu' },
  { label: 'Exibir', submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }, { role: 'togglefullscreen' }] },
]));

app.whenReady().then(criarJanela);
app.on('window-all-closed', () => app.quit());

// ---------- provedores ----------
function existe(cmd) {
  try { execFileSync('sh', ['-c', `command -v ${cmd}`], { stdio: 'ignore' }); return true; } catch { return false; }
}

// Cada provedor vira uma linha de comando. O claude só pode ler a pasta (Read/Grep/Glob):
// em modo -p, qualquer outra ferramenta é negada automaticamente.
const COMANDOS = {
  claude: (prompt) => ['claude', ['-p', prompt, '--output-format', 'text', '--allowedTools', 'Read,Grep,Glob']],
  // --skip-trust: em modo -p o gemini recusa pasta "não confiável"; a pasta é a que a pessoa escolheu.
  // --approval-mode plan: só leitura, como o claude.
  gemini: (prompt) => ['gemini', ['--skip-trust', '--approval-mode', 'plan', '-o', 'text', '-p', prompt]],
  // --skip-git-repo-check: sem ele o codex recusa pastas fora de um repositório git confiável.
  codex: (prompt) => ['codex', ['exec', '--sandbox', 'read-only', '--skip-git-repo-check', prompt]],
};

ipcMain.handle('provedores', () =>
  Object.fromEntries(Object.keys(COMANDOS).map((p) => [p, existe(p)])));

function rodar(cmd, args, cwd, tempo = TEMPO_MAXIMO_MS) {
  return new Promise((resolve) => {
    const filho = spawn(cmd, args, { cwd, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    let saida = ''; let erro = '';
    const timer = setTimeout(() => { filho.kill('SIGTERM'); erro += '\n(tempo esgotado)'; }, tempo);
    filho.stdout.on('data', (d) => { saida += d; });
    filho.stderr.on('data', (d) => { erro += d; });
    filho.on('error', (e) => { clearTimeout(timer); resolve({ ok: false, saida, erro: e.message }); });
    filho.on('close', (codigo) => { clearTimeout(timer); resolve({ ok: codigo === 0, codigo, saida: saida.trim(), erro: erro.trim() }); });
  });
}

ipcMain.handle('executar-agente', async (_ev, { provedor, prompt, pasta }) => {
  const montar = COMANDOS[provedor];
  if (!montar || !existe(provedor)) return { simulado: true };
  const [cmd, args] = montar(String(prompt));
  return rodar(cmd, args, pasta || os.homedir());
});

// Só roda depois que a pessoa clicou em Executar/Aprovar na tela.
ipcMain.handle('executar-comando', async (_ev, { comando, pasta }) =>
  rodar('bash', ['-lc', String(comando)], pasta || os.homedir(), 60_000));

ipcMain.handle('escolher-pasta', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(janela, {
    title: 'Pasta do projeto', properties: ['openDirectory'],
  });
  return canceled || !filePaths.length ? null : filePaths[0];
});
