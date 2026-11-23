// Ponte segura entre a tela e o processo principal.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('estudio', {
  provedores: () => ipcRenderer.invoke('provedores'),
  executarAgente: (dados) => ipcRenderer.invoke('executar-agente', dados),
  executarComando: (dados) => ipcRenderer.invoke('executar-comando', dados),
  escolherPasta: () => ipcRenderer.invoke('escolher-pasta'),
});
