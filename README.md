# Estúdio — time visual de agentes de IA

Engenharia reversa (Aula 15, "REA is back") de um post do LinkedIn que mostra o **Estúdio**:
um painel onde você faz o pedido uma vez e um time de agentes decide entre si quem pega cada parte.
Construído só a partir do post e do print (não há código público do original).

## Rodar

```bash
npm install
npm start      # abre o app
npm test       # 14 testes, um por regra (R1–R13)
```

- **IA real:** se a CLI `claude` estiver instalada e logada, Maestro, Pixel e Chevron respondem por ela
  (assinatura, sem cobrança por API). `gemini` (Scout) e `codex` (Revisor) são usados se existirem.
- **Sem CLI, sem login ou com erro:** o agente responde em modo simulado (etiqueta "simulado").
- O botão ⚡ alterna entre IA real e **modo demonstração** (sempre simulado — bom para apresentar).
- 📁 **Sem projeto** escolhe a pasta onde os agentes trabalham (o Claude só pode *ler* a pasta).

## O que dá para fazer

- Pedir ao **Time** → rodada de propostas com % de confiança → Maestro monta o time
  (pesquisa → execução em paralelo → revisão) → cada agente entrega, passando o resultado adiante.
- Clicar num mascote (ou chip) para falar só com ele.
- Comandos sugeridos em blocos ```bash viram botões **Executar**; os sensíveis
  (`rm -rf`, `sudo`, `git push`, `curl | sh`, `DROP TABLE`…) pedem **Aprovar / Negar**.
- **＋** cria agente (nome, papel, personalidade, palavras, provedor, visual e cor); botão direito remove.
- Conversas separadas com histórico (☰ e ＋ no painel), guardadas no `localStorage`.

## Estrutura

| Arquivo | Papel |
|---|---|
| `REGRAS.md` | As regras R1–R13 com entrada e saída. |
| `src/nucleo.mjs` | **Todas as regras.** Funções puras, sem DOM, Electron nem rede. |
| `src/renderer.mjs` | Tela: mascotes em SVG, palco, rodada de propostas, chat. |
| `src/main.js` | Janela, escolha de pasta e chamadas às CLIs `claude` / `gemini` / `codex`. |
| `src/preload.js` | Ponte segura entre tela e processo principal. |
| `test/nucleo.test.mjs` | Um teste por regra. |

## Fora do escopo (citado no post)

Voz, deploy automático na VPS, memória de projeto e plano aprovado antes de editar arquivos.
