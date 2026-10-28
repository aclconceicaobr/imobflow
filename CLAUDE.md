# ImobFlow · regras do projeto

CRM imobiliário em SaaS para imobiliárias de até 20 corretores. Toda sessão de IA que gera código neste repositório segue estas regras (D42). As decisões aprovadas estão em `docs/decisoes.md`; as regras de negócio, em `docs/regras-de-negocio.md`.

## Stack e versões

Node 24, pnpm, Next.js 16 (App Router, Turbopack, `proxy.ts` no lugar de `middleware.ts`), React 19, TypeScript 6 estrito, Tailwind 4 (tema em CSS com `@theme`), shadcn/ui, Lucide, Supabase (Postgres, Auth, Storage, RLS), Zod 4, Vitest, Playwright. Versões fixas no `package.json`; atualizar só em PR próprio. Sem ORM, sem biblioteca de estado global, sem React Query, sem biblioteca de gráficos, sem TanStack Table (D15, D29, D30).

O Next.js 16 mudou APIs e convenções: antes de usar uma API do Next, confira a documentação da versão instalada em `node_modules/next/dist/docs/` (ver `AGENTS.md`, mantido pelo próprio `next dev`).

## Idioma

- Código, nomes de tabelas, colunas, funções e arquivos em inglês.
- Rotas da área logada, textos de tela e mensagens de erro em português do Brasil.
- Commits, PRs e issues em português com prefixo convencional: `feat(imoveis): cadastro em etapas`, `fix`, `chore`, `test`, `docs`, `refactor` (D43).

## Fluxo

- Uma história do backlog = uma branch = um PR (D38). Nome da branch: `if-031-cadastro-imovel`.
- O PR segue `.github/pull_request_template.md`, fecha a issue (`Fecha #N`) e só entra com CI verde e revisão do Alan, por squash.
- Nenhuma tela de negócio (épicos E3 a E8) antes da IF-013, os testes de isolamento, estar verde (D44).
- Antes de abrir o PR: `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`; se a história mexe no banco, também `pnpm db:reset` e `pnpm test:db`. O CI roda tudo isso e a `main` só aceita merge com ele verde.

## Segurança

- Variáveis de ambiente só por `env` (`@/lib/env`, servidor) ou `publicEnv` (`@/lib/env/public`, navegador). O ESLint recusa `process.env` fora desses arquivos. Variável nova é declarada em `src/lib/env/schema.ts` (ver `docs/operacao.md`).
- Nunca use a chave secreta do Supabase fora de `src/lib/supabase/admin.ts`. Todo acesso a dados usa o cliente do próprio usuário, com RLS ativa (D14).
- Arquivo que usa chave secreta ou chama serviço externo começa com `import "server-only";`.
- Toda tabela nova tem RLS ligada e políticas separadas por operação, com teste pgTAP do caso permitido e do negado (`docs/seguranca-rls.md`).
- Roteiro fixo de toda Server Action: validar com Zod, obter usuário e organização ativa, checar o papel, gravar, registrar auditoria quando a ação for sensível (RN40), revalidar a página.
- O mesmo schema Zod valida o formulário e o servidor; mensagens em português.
- Sem permissão, a resposta é "não encontrado", igual a um registro que não existe.

## Design

- Cores, raios e espaços só pelos tokens do design system (Fase 3), nunca valores soltos no componente. Os temas escuro (padrão) e claro saem das mesmas variáveis; toda tela é conferida nos dois.
- Celular primeiro (430 px), depois desktop (1920 px). Alvo de toque mínimo de 44 px, texto base de 16 px, contraste AA, foco visível por teclado.
- Toda tela tem estados de carregando (skeleton), vazio, erro e sem permissão.
- Movimento conforme D36: tempos curtos, ease-out, toque encolhe para 97%, nada de animação em ação repetida, respeitar `prefers-reduced-motion`.
- Ícones só do Lucide, com rótulo de texto em navegação e ações principais.

## Testes

- Unitário ao lado do arquivo (`*.test.ts`), RLS em `supabase/tests`, ponta a ponta em `tests/e2e`.
- O teste que verifica uma regra de negócio cita o código dela no nome: `it("RN15: reaproveita lead com o mesmo telefone")`.
- Nunca desligue, pule ou apague um teste para o CI passar.

## Definição de pronto

Vale para toda história, além dos critérios dela:

- Critérios gerais 8.1 do PRD: 430 px e 1920 px, alvo de toque de 44 px, estados de carregando, vazio e erro, contraste AA, teclado.
- Funciona nos temas escuro e claro.
- Permissão checada na Server Action e na RLS, com teste pgTAP quando a história toca o banco.
- Mesmo schema Zod no formulário e no servidor, mensagens em português.
- Nenhum segredo no navegador; arquivos com chave secreta importam `server-only`.
- Preview da Vercel testado pelo Alan antes do merge.
