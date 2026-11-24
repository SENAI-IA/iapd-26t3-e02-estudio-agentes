# Estúdio — time visual de agentes de IA

Engenharia reversa (Aula 15, "REA is back") de um post do LinkedIn que mostra o **Estúdio**:
um painel onde você faz o pedido uma vez e um time de agentes decide entre si quem pega cada parte.
Construído só a partir do post e do print (não há código público do original).

## Rodar

Precisa de Node.js 20+.

```bash
npm install
npm start      # abre o app (na primeira vez o Electron baixa o próprio executável, ~100 MB)
npm test       # 19 testes das regras R1–R17
```

Depois, dê a cada IA uma forma de acesso: chave de API ou CLI logada (próxima seção).

## Como cada IA é acessada

Para cada provedor, o app escolhe sozinho a cada pedido:

1. **Chave de API no `.env`** → usa a API oficial pelo SDK (cobrança por uso).
2. **Sem chave** → usa a CLI logada na sua assinatura (sem cobrança por uso).
3. **Nenhum dos dois** → o agente responde dizendo o que falta.

| Agentes | Provedor | Chave no `.env` | Modelo padrão | CLI alternativa |
|---|---|---|---|---|
| Pixel, Chevron (e Maestro, se você falar direto com ele) | claude (Anthropic) | `ANTHROPIC_API_KEY` | `claude-opus-5-5` | `claude` |
| Scout | gemini (Google) | `GEMINI_API_KEY` | `gemini-3.8-flash` | `gemini` |
| Revisor | codex (OpenAI) | `OPENAI_API_KEY` | `gpt-5.5` | `codex` |

O topo do app mostra o modo de cada provedor, por exemplo `claude: CLI · gemini: API · codex: CLI`.

### Por chave de API

```bash
cp .env.example .env   # preencha só as chaves que quiser
```

- Os modelos podem ser trocados no próprio `.env` (`ANTHROPIC_MODEL`, `GEMINI_MODEL`, `OPENAI_MODEL`).
- O `.env` é relido a cada pedido, então não precisa reiniciar o app.
- O `.env` está no `.gitignore`. Nunca faça commit dele nem cole chaves em chats.

### Por CLI (assinatura)

Instale e faça login uma vez. Os logins abrem o navegador.

```bash
npm install -g @anthropic-ai/claude-code   # depois: claude  (escolha "Claude account with subscription")
npm install -g @google/gemini-cli          # depois: gemini  (/auth → "Login with Google")
npm install -g @openai/codex               # depois: codex login  (conta ChatGPT Plus ou superior)
```

Para conferir:

```bash
claude -p "diga oi"
```

```bash
gemini --skip-trust -p "diga oi"
```

```bash
codex exec --skip-git-repo-check "diga oi"
```

Abra o app pelo terminal (`npm start`). Assim ele herda o `PATH` onde as CLIs foram instaladas.

## Pasta do projeto e arquivos

- O botão **📁** no topo escolhe a pasta onde os agentes trabalham. Sem escolha, usa `~/estudio-projetos`.
- **Quem escreve:** quem executa (Pixel, Chevron e agentes criados por você) grava direto na pasta.
  Scout e Revisor nunca escrevem.
- **Pela CLI:** a própria IA edita os arquivos. Pesquisa e revisão rodam em modo só leitura
  (`claude` só com Read/Grep/Glob, `gemini --approval-mode plan`, `codex --sandbox read-only`).
- **Pela API:** a IA devolve cada arquivo num bloco ```` ```arquivo:caminho ```` e o Estúdio grava.
  Caminhos absolutos ou com `..` são recusados. Nesse modo, Scout e Revisor não leem a pasta:
  trabalham com o que o time entregou na rodada.
- No fim da rodada, o cartão **Arquivos criados ou alterados** abre cada arquivo ou a pasta.

## O que dá para fazer

- **Pedir ao Time:**
  1. Rodada de propostas, em que cada agente diz se pega ou passa, com % de confiança.
  2. O Maestro monta o time: pesquisa → execução em paralelo → revisão.
  3. Cada agente entrega e passa o resultado para o próximo.
  
  A rodada e a montagem do time são **regras do app** (palavras-chave de cada papel, ver
  `REGRAS.md`): não gastam chamada de IA.
- **Falar com um agente só:** clique no mascote ou no chip acima da caixa de texto.
- **Comandos sugeridos** em blocos ```bash viram o botão **Executar**, que roda na pasta do projeto
  com limite de 60 s. Os sensíveis (`rm -rf`, `sudo`, `git push`, `curl | sh`, `DROP TABLE`…)
  pedem **Aprovar / Negar**.
- **＋** cria um agente (nome, papel, personalidade, palavras-chave, provedor, visual e cor).
  Botão direito no mascote remove; o Maestro não pode ser removido.
- **Conversas separadas** com histórico (☰ e ＋ no painel), guardadas no `localStorage`.
- Cada agente tem até 5 minutos por resposta.

## Estrutura

| Arquivo | Papel |
|---|---|
| `REGRAS.md` | As regras R1–R17, com entrada, saída e origem. |
| `.env.example` | Modelo do `.env` com as chaves e os modelos de cada IA. |
| `src/nucleo.mjs` | **Todas as regras.** Funções puras, sem DOM, Electron nem rede. |
| `src/renderer.mjs` | Tela: mascotes em SVG, palco, rodada de propostas, chat. |
| `src/main.js` | Janela, pasta do projeto, `.env`, chamadas por API (SDKs oficiais) ou CLI, gravação de arquivos. |
| `src/preload.js` | Ponte segura entre a tela e o processo principal. |
| `test/nucleo.test.mjs` | Testes das regras do núcleo. |

## Fora do escopo (citado no post)

- Voz.
- Deploy automático na VPS.
- Memória de projeto.
- Plano aprovado antes de editar arquivos.
- Revisão linha a linha (diff) dos arquivos alterados. Hoje o app lista os arquivos e os abre.
