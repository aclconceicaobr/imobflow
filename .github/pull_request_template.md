## História

Fecha #<!-- número da issue --> · IF-<!-- código -->

## O que mudou

<!-- Em poucas linhas, o que esta história entrega e as decisões tomadas no caminho. -->

## Como testar

<!-- Passos para conferir no Preview da Vercel ou localmente. -->

1.

## Checklist de pronto

- [ ] Critérios de aceite da issue atendidos
- [ ] Critérios gerais 8.1 do PRD: 430 px e 1920 px, alvo de toque de 44 px, estados de carregando, vazio e erro, contraste AA, teclado
- [ ] Funciona nos temas escuro e claro
- [ ] Permissão checada na Server Action e na RLS (com teste pgTAP se toca o banco)
- [ ] Mesmo schema Zod no formulário e no servidor, mensagens em português
- [ ] Nenhum segredo no navegador; arquivos com chave secreta importam `server-only`
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam
- [ ] Preview da Vercel testado pelo Alan
