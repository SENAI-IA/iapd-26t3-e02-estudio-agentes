# Regras do Estúdio

Origem: texto do post (Fernando Nogueira, LinkedIn) e o print do slide da atividade.

| # | Regra | Entrada → saída | Origem |
|---|---|---|---|
| R1 | Time padrão: Maestro (coordenador, Claude), Pixel (front-end), Chevron (back-end, Claude), Scout (pesquisa, Gemini), Revisor (revisão, Codex). | — | post |
| R2 | Texto é comparado sem acento e sem caixa. | `"Página"` → `"pagina"` | — |
| R3 | Proposta: 10% + 30% por palavra do papel no pedido (máx. 95%); aceita com ≥ 40%. O coordenador sempre passa ("Coordeno, mas não sou eu quem executa isso"). | pedido → `{confianca, aceita, fala}` | print |
| R4 | Rodada de propostas: todos respondem, da maior para a menor confiança. | pedido → lista ordenada | post + print |
| R5 | Maestro monta o time em etapas: pesquisa → execução (paralela) → revisão. Revisor entra sempre que alguém executou. Se ninguém aceitar, o de maior confiança assume. | propostas → `etapas` | post |
| R6 | Fala do Maestro: "Fica com Chevron e Pixel. Revisor, acompanha no final." | etapas → texto | print |
| R7 | Comandos sensíveis pedem aprovação na tela. | comando → `true/false` | post |
| R8 | Comandos sugeridos são lidos dos blocos ```bash da resposta. | texto → `[{comando, sensivel}]` | — |
| R9 | Cada agente recebe papel, personalidade, pedido e o que as etapas anteriores entregaram. | → prompt | post |
| R10 | Estados: disponível, pensando, trabalhando, concluído; topo mostra "N de M trabalhando". | | print |
| R11 | Criar agente pelo painel (nome único, papel obrigatório, provedor/visual/cor); o coordenador não pode ser removido. | | post |
| R12 | Conversas separadas; o título é a primeira pergunta (até 60 caracteres). | | post |
| R13 | Sem IA disponível, cada agente tem uma resposta simulada. | | — |
