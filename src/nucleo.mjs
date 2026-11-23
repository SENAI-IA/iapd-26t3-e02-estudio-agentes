// Núcleo do Estúdio: todas as regras. Funções puras, sem DOM, Electron nem rede.

// ---------- R1: o time padrão ----------
// Cada agente tem papel, provedor (qual IA está por trás) e as palavras que o fazem
// querer pegar uma tarefa na rodada de propostas.
export const TIME_PADRAO = Object.freeze([
  {
    id: 'maestro', nome: 'Maestro', papel: 'Coordenador', provedor: 'claude', forma: 'bloco', cor: '#e2795b',
    coordenador: true, palavras: [],
    personalidade: 'Calmo e direto. Divide o trabalho e não executa tarefas sozinho.',
  },
  {
    id: 'pixel', nome: 'Pixel', papel: 'Front-end', provedor: 'claude', forma: 'bloco', cor: '#e7b866',
    palavras: ['tela', 'pagina', 'visual', 'css', 'html', 'botao', 'layout', 'interface', 'front', 'bonit',
      'componente', 'design', 'cor', 'formulario', 'acessivel', 'responsiv', 'dashboard'],
    personalidade: 'Detalhista com o visual e com acessibilidade. Fala com entusiasmo.',
  },
  {
    id: 'chevron', nome: 'Chevron', papel: 'Back-end', provedor: 'claude', forma: 'bloco', cor: '#e88a5c',
    palavras: ['endpoint', 'api', 'rota', 'servidor', 'banco', 'health', 'back', 'status', 'dados', 'sql',
      'autentica', 'json', 'login', 'cache', 'fila', 'webhook'],
    personalidade: 'Pragmático, um pouco ranzinza, obcecado por código que aguenta produção.',
  },
  {
    id: 'scout', nome: 'Scout', papel: 'Pesquisa', provedor: 'gemini', forma: 'estrela', cor: '#9a7cf0',
    palavras: ['pesquis', 'documentacao', 'referencia', 'compar', 'qual', 'melhor', 'biblioteca', 'oficial',
      'como funciona', 'pesquisar', 'alternativa', 'padrao'],
    personalidade: 'Curioso. Sempre cita a fonte oficial.',
  },
  {
    id: 'revisor', nome: 'Revisor', papel: 'Revisão de código', provedor: 'codex', forma: 'nuvem', cor: '#3f7bf2',
    palavras: ['revis', 'bug', 'teste', 'review', 'erro', 'seguranca', 'corrig', 'falha', 'vulnerab'],
    personalidade: 'Cético e cuidadoso. Procura o bug que ninguém viu.',
  },
]);

export const PROVEDORES = Object.freeze(['claude', 'gemini', 'codex']);
export const FORMAS = Object.freeze(['bloco', 'estrela', 'nuvem']);
export const ESTADOS = Object.freeze(['disponivel', 'pensando', 'trabalhando', 'concluido']);

// ---------- R2: texto normalizado ----------
export function normalizar(texto) {
  return String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// ---------- R3: proposta de um agente ----------
// Confiança: 10% de base + 30% por palavra do papel encontrada no pedido (máx. 95%).
// Aceita a partir de 40%. O coordenador nunca executa: só monta o time.
export const LIMIAR_ACEITE = 40;

export function proporAgente(agente, pedido) {
  const texto = normalizar(pedido);
  if (agente.coordenador) {
    return { id: agente.id, confianca: 15, aceita: false, fala: 'Coordeno, mas não sou eu quem executa isso.' };
  }
  const acertos = agente.palavras.filter((p) => texto.includes(normalizar(p)));
  const confianca = Math.min(95, 10 + acertos.length * 30);
  const aceita = confianca >= LIMIAR_ACEITE;
  return { id: agente.id, confianca, aceita, acertos, fala: falaDaProposta(agente, aceita) };
}

const FALAS = {
  pixel: ['Tela é comigo. Deixa bonito e acessível.', 'Nada de tela aqui, passo.'],
  chevron: ['Hmm. Isso aqui precisa de um endpoint decente.', 'Sem back-end nisso. Passo.'],
  scout: ['Vou atrás da referência oficial.', 'Se precisar de referência, estou aqui.'],
  revisor: ['Quero revisar isso de perto.', 'Nada para revisar ainda.'],
};

function falaDaProposta(agente, aceita) {
  const f = FALAS[agente.id];
  if (f) return aceita ? f[0] : f[1];
  return aceita ? `${agente.papel} é comigo.` : `Não é a minha área (${agente.papel}). Passo.`;
}

// ---------- R4: rodada de propostas ----------
// Todos os agentes respondem; a lista sai da maior confiança para a menor.
export function rodadaDePropostas(agentes, pedido) {
  return agentes.map((a) => proporAgente(a, pedido)).sort((x, y) => y.confianca - x.confianca);
}

// ---------- R5: o coordenador monta o time ----------
// Etapas em sequência; agentes na mesma etapa trabalham em paralelo.
//   1. pesquisa (Scout), se aceitou
//   2. quem executa (todos os que aceitaram, exceto pesquisa e revisão)
//   3. revisão (Revisor) sempre no final quando alguém mexeu em código
// Se ninguém aceitou, o de maior confiança que não é coordenador assume.
export function montarTime(agentes, propostas) {
  const porId = new Map(agentes.map((a) => [a.id, a]));
  const aceitos = propostas.filter((p) => p.aceita).map((p) => porId.get(p.id)).filter(Boolean);
  if (!aceitos.length) {
    const melhor = propostas.map((p) => porId.get(p.id)).find((a) => a && !a.coordenador);
    if (melhor) aceitos.push(melhor);
  }
  const ehPesquisa = (a) => a.papel === 'Pesquisa';
  const ehRevisao = (a) => a.papel === 'Revisão de código';
  const pesquisa = aceitos.filter(ehPesquisa);
  const execucao = aceitos.filter((a) => !ehPesquisa(a) && !ehRevisao(a));
  let revisao = aceitos.filter(ehRevisao);
  if (execucao.length && !revisao.length) revisao = agentes.filter(ehRevisao).slice(0, 1);
  const etapas = [pesquisa, execucao, revisao].filter((e) => e.length).map((e) => e.map((a) => a.id));
  return { etapas, mensagem: mensagemDoMaestro(etapas, porId) };
}

// ---------- R6: a fala do coordenador ----------
export function mensagemDoMaestro(etapas, porId) {
  const nome = (id) => porId.get(id)?.nome ?? id;
  const lista = (ids) => ids.map(nome).join(ids.length > 2 ? ', ' : ' e ').replace(/, ([^,]+)$/, ' e $1');
  if (!etapas.length) return 'Ninguém do time cobre isso. Reformula o pedido?';
  const partes = [];
  const revisor = etapas.length > 1 ? etapas[etapas.length - 1] : null;
  const ehRevisao = revisor && revisor.every((id) => porId.get(id)?.papel === 'Revisão de código');
  const meio = ehRevisao ? etapas.slice(0, -1) : etapas;
  meio.forEach((ids, i) => partes.push(i === 0 ? `Fica com ${lista(ids)}.` : `Depois, ${lista(ids)}.`));
  if (ehRevisao) partes.push(`${lista(revisor)}, acompanha no final.`);
  return partes.join(' ');
}

// ---------- R7: comando sensível pede aprovação ----------
const PADROES_SENSIVEIS = [
  /\brm\s+-[a-z]*[rf]/i, /\bsudo\b/i, /\bgit\s+push\b/i, /\bgit\s+reset\s+--hard\b/i, /\bnpm\s+publish\b/i,
  /\bchmod\s+(-R\s+)?777\b/i, /\b(curl|wget)\b[^|]*\|\s*(sh|bash)\b/i, /\bdrop\s+(table|database)\b/i,
  /\bmkfs\b/i, /\bdd\s+if=/i, /\bshutdown\b|\breboot\b/i, /:\(\)\s*\{/, /\bdocker\s+system\s+prune\b/i,
];

export function comandoSensivel(comando) {
  return PADROES_SENSIVEIS.some((r) => r.test(String(comando)));
}

// ---------- R8: comandos sugeridos numa resposta ----------
// Pega as linhas dos blocos ```bash / ```sh / ```shell e marca as sensíveis.
export function extrairComandos(texto) {
  const comandos = [];
  const bloco = /```(?:bash|sh|shell|console)\n([\s\S]*?)```/g;
  let m;
  while ((m = bloco.exec(String(texto)))) {
    for (const linha of m[1].split('\n')) {
      const cmd = linha.replace(/^\$\s*/, '').trim();
      if (cmd && !cmd.startsWith('#')) comandos.push({ comando: cmd, sensivel: comandoSensivel(cmd) });
    }
  }
  return comandos;
}

// ---------- R9: prompt de cada agente ----------
// O agente recebe o papel, a personalidade, o pedido e o que as etapas anteriores entregaram.
export function montarPrompt(agente, pedido, anteriores = []) {
  const contexto = anteriores.length
    ? '\n\nO que o time já entregou:\n' + anteriores.map((r) => `--- ${r.nome} (${r.papel}) ---\n${r.texto}`).join('\n\n')
    : '';
  return [
    `Você é ${agente.nome}, agente de ${agente.papel} num time de IAs chamado Estúdio.`,
    `Personalidade: ${agente.personalidade || 'objetiva.'}`,
    'Responda em português do Brasil, curto (até 15 linhas), só sobre a sua parte.',
    'Se sugerir comandos de terminal, coloque-os num bloco ```bash.',
    `\nPedido do usuário: ${pedido}${contexto}`,
  ].join('\n');
}

// ---------- R10: estados e barra de status ----------
export function trocarEstado(estados, id, novo) {
  if (!ESTADOS.includes(novo)) throw new Error(`Estado inválido: ${novo}`);
  return { ...estados, [id]: novo };
}

export function resumoStatus(agentes, estados) {
  const n = agentes.filter((a) => ['pensando', 'trabalhando'].includes(estados[a.id])).length;
  return `${n} de ${agentes.length} trabalhando`;
}

// ---------- R11: criar agente pelo painel ----------
export function criarAgente(agentes, dados) {
  const nome = String(dados.nome ?? '').trim();
  const papel = String(dados.papel ?? '').trim();
  if (!nome) throw new Error('O agente precisa de um nome.');
  if (!papel) throw new Error('O agente precisa de um papel.');
  const id = normalizar(nome).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!id || agentes.some((a) => a.id === id)) throw new Error(`Já existe um agente chamado ${nome}.`);
  const provedor = PROVEDORES.includes(dados.provedor) ? dados.provedor : 'claude';
  const forma = FORMAS.includes(dados.forma) ? dados.forma : 'bloco';
  const cor = /^#[0-9a-f]{6}$/i.test(dados.cor ?? '') ? dados.cor : '#7aa2f7';
  const palavras = String(dados.palavras ?? '').split(',').map((p) => normalizar(p).trim()).filter(Boolean);
  return [...agentes, { id, nome, papel, provedor, forma, cor, palavras, personalidade: String(dados.personalidade ?? '').trim() }];
}

export function removerAgente(agentes, id) {
  const alvo = agentes.find((a) => a.id === id);
  if (!alvo || alvo.coordenador) return agentes;
  return agentes.filter((a) => a.id !== id);
}

// ---------- R12: conversas separadas, com histórico ----------
export function novaConversa(agora = Date.now()) {
  return { id: `c${agora}`, titulo: 'Nova conversa', criadaEm: agora, mensagens: [] };
}

export function adicionarMensagem(conversa, msg) {
  const titulo = conversa.mensagens.length === 0 && msg.autor === 'voce'
    ? encurtar(String(msg.texto), 60) : conversa.titulo;
  return { ...conversa, titulo, mensagens: [...conversa.mensagens, { ...msg, em: msg.em ?? Date.now() }] };
}

function encurtar(texto, max) {
  return texto.length > max ? texto.slice(0, max - 1) + '…' : texto;
}

// ---------- R13: resposta simulada (quando a IA real não está disponível) ----------
export function respostaSimulada(agente, pedido) {
  const p = String(pedido).trim();
  switch (agente.id) {
    case 'scout':
      return `Achei a referência oficial para "${p}". Recomendo seguir o padrão da documentação do framework e devolver JSON com status e versão.`;
    case 'pixel':
      return 'Montei a tela: cabeçalho com o estado geral, um cartão por serviço com cor + texto (não só cor, por acessibilidade) e atualização a cada 30 s.';
    case 'chevron':
      return 'Rota pronta:\n\n```js\napp.get(\'/health\', (req, res) => res.json({ status: \'ok\', uptime: process.uptime() }));\n```\n\nPara testar:\n\n```bash\nnpm test\ncurl -s localhost:3000/health\n```';
    case 'revisor':
      return 'Revisei. Um problema real: a rota responde 200 mesmo quando o banco caiu. Sugiro checar a conexão e devolver 503 nesse caso.';
    default:
      return `${agente.nome} (${agente.papel}) cuidou da sua parte de "${p}".`;
  }
}
