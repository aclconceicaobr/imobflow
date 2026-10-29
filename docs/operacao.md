# Operação

Como rodar o projeto, quais variáveis ele precisa e como funcionam os ambientes. Os ambientes remotos (Supabase e Vercel) estão descritos em [Ambientes](#ambientes) e o passo a passo para montá-los, em [Configurar os ambientes](#configurar-os-ambientes).

## Rodar localmente

1. Instale o Node 24 (o `.nvmrc` fixa a versão; com nvm, rode `nvm use`) e ative o pnpm com `corepack enable`.
2. `pnpm install`
3. Copie `.env.example` para `.env.local` e preencha as variáveis (tabela abaixo).
4. `pnpm dev` e abra http://localhost:3000.

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Servidor de desenvolvimento (Turbopack) |
| `pnpm build` | Build de produção; falha com variável faltando ou segredo público |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript sem gerar arquivos |
| `pnpm test` | Testes unitários (Vitest) |
| `pnpm db:start` / `pnpm db:stop` | Sobe ou para o Supabase local (precisa de Docker) |
| `pnpm db:reset` | Recria o banco local do zero: migrações e `seed.sql` |
| `pnpm test:db` | Testes pgTAP de `supabase/tests` contra o banco local |

## Variáveis de ambiente

O `next.config.ts` chama `assertEnv()` de `src/lib/env/schema.ts` antes de qualquer build ou `next dev`. Ele para com uma lista em português do que está errado quando:

- falta uma variável obrigatória ou ela está vazia;
- uma variável secreta aparece com prefixo `NEXT_PUBLIC_` (por exemplo `NEXT_PUBLIC_SUPABASE_SECRET_KEY`);
- uma variável pública tem nome de segredo (`SECRET`, `TOKEN`, `PASSWORD`, `PRIVATE`, `SERVICE_ROLE`) ou valor de chave secreta (`sb_secret_`, `sk-`, `$aact_`);
- existe uma variável `NEXT_PUBLIC_` que não foi declarada no schema. As de sistema da Vercel (`NEXT_PUBLIC_VERCEL_*`) são aceitas.

| Variável | Onde | Obrigatória | Para que serve |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Navegador | Sim | URL pública do app, usada em links e no Open Graph |
| `NEXT_PUBLIC_SUPABASE_URL` | Navegador | Sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Navegador | Sim | Chave publicável do Supabase (`sb_publishable_...`) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Navegador | Sim | Chave de site do Cloudflare Turnstile |
| `SUPABASE_SECRET_KEY` | Servidor | Sim | Chave secreta do Supabase (`sb_secret_...`), só em `lib/supabase/admin.ts` |
| `TURNSTILE_SECRET_KEY` | Servidor | Sim | Verificação do Turnstile na captação |
| `BILLING_ENABLED` | Servidor | Não (padrão `false`) | Liga a cobrança pelo Asaas (onda 2) |
| `ASAAS_API_URL` | Servidor | Não (padrão sandbox) | `https://api-sandbox.asaas.com/v3` ou `https://api.asaas.com/v3` |
| `ASAAS_API_KEY` | Servidor | Com `BILLING_ENABLED=true` | Chave da API do Asaas |
| `ASAAS_WEBHOOK_TOKEN` | Servidor | Com `BILLING_ENABLED=true` | Token conferido no cabeçalho `asaas-access-token` |
| `AI_ENABLED` | Servidor | Não (padrão `false`) | Liga a geração de textos (onda 2) |
| `OPENAI_API_KEY` | Servidor | Com `AI_ENABLED=true` | Chave da OpenAI |
| `OPENAI_MODEL` | Servidor | Com `AI_ENABLED=true` | Modelo usado, trocável sem novo deploy |

Para desenvolver sem uma conta Cloudflare, use as chaves de teste públicas do Turnstile: site `1x00000000000000000000AA` e secreta `1x0000000000000000000000000000000AA`, que sempre aprovam.

Para adicionar uma variável: declare no `publicSchema` ou no `serverSchema`, acrescente ao `.env.example`, a esta tabela e, se for pública, a `src/lib/env/public.ts`. No código, importe `env` de `@/lib/env` no servidor ou `publicEnv` de `@/lib/env/public` no navegador.

## CI

O workflow `.github/workflows/ci.yml` roda em todo PR e em todo push na `main`, com dois jobs:

| Job | Etapas |
| --- | --- |
| App (lint, tipos, testes, build) | `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` |
| Banco (migrações e pgTAP) | `supabase db start`, `supabase db reset --local`, `supabase test db` |

O job do app usa valores de mentira nas variáveis, só para o build validar o formato; nenhum segredo real entra no CI. O job do banco sobe um Postgres descartável no próprio runner, aplica as migrações do zero e roda os testes pgTAP. O teste `supabase/tests/database/000_rls_enabled.test.sql` falha se qualquer tabela do schema `public` estiver sem RLS.

**Proteção da `main`.** Em Settings → Rules → Rulesets, um ruleset ativo na branch padrão com: exigir pull request antes do merge, exigir as checagens `App (lint, tipos, testes, build)` e `Banco (migrações e pgTAP)` verdes, bloquear push forçado e exclusão. Em Settings → General → Pull Requests, só “Allow squash merging” ligado (D38).

## Cabeçalhos de segurança

O `next.config.ts` envia em todas as respostas `Content-Security-Policy`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff` e `Permissions-Policy`. A CSP libera só o próprio domínio, o Supabase do ambiente e o Turnstile. Ela ainda aceita `'unsafe-inline'` em scripts, porque o Next.js precisa disso sem nonce; a troca por nonce gerado no `proxy.ts` fica para a IF-014.

## Ambientes

| Ambiente | Next.js | Supabase | Asaas | OpenAI | Dados |
| --- | --- | --- | --- | --- | --- |
| Local | `next dev` | Supabase CLI em Docker | Sandbox | Chave de dev com limite baixo | `seed.sql` com dados de exemplo |
| Homologação | Vercel Preview (cada PR) | Projeto `imobbay-staging` | Sandbox | Chave de dev | Dados de teste, nunca dados reais |
| Produção | Vercel Production (branch `main`) | Projeto `imobbay-prod`, plano Pro, `sa-east-1` | Conta real | Chave de produção com teto de gasto | Clientes reais |

**Fluxo de mudança**

1. Trabalho em branch, migração criada com `supabase migration new` e testada localmente (`pnpm db:reset` + `pnpm test:db`).
2. *Pull request* roda o CI: lint, checagem de tipos, testes unitários, testes de RLS num banco descartável e o build. A Vercel gera o Preview, ligado ao Supabase de homologação.
3. Para testar uma migração no Preview antes do merge, rode o workflow **Deploy do banco** manualmente (Actions → Deploy do banco → Run workflow) escolhendo a branch do PR. Ele aplica as migrações só em homologação.
4. Ao aprovar o PR, o merge na `main` dispara o mesmo workflow: as migrações novas vão para homologação sozinhas e para produção só depois da aprovação manual do ambiente `production` no Actions. A Vercel publica a produção por último, pelo deploy hook, para o código novo nunca rodar antes do banco. Sem migração nova, a publicação é direta.

Migrações são sempre compatíveis com a versão anterior do código (adicionar antes de remover). Como os PRs saem com o Alan como autor, a aprovação no próprio GitHub não está disponível; por isso a homologação acompanha o merge, e não a aprovação do PR.

**Segredos.** Ficam nas variáveis de ambiente da Vercel (Preview com as chaves de homologação, Production com as de produção) e nos *secrets* dos ambientes `staging` e `production` do GitHub. Nenhum segredo no repositório; um `.env.example` lista os nomes. As chaves novas do Supabase (`sb_publishable_...` no navegador e `sb_secret_...` no servidor) podem ser revogadas individualmente, o que facilita uma troca de emergência.

**Custos fixos estimados no lançamento:** Supabase Pro (US$ 25/mês), Vercel Pro (US$ 20/mês por membro), domínio e SMTP. O projeto de homologação no Supabase acrescenta o custo de uma instância pequena. Valores aproximados; confirmamos na Fase 5.

## Configurar os ambientes

Feito uma vez por quem administra as contas. Os nomes abaixo são os que o workflow `.github/workflows/db-deploy.yml` e o `vercel.json` esperam.

**1. Supabase.** Crie `imobbay-staging` e `imobbay-prod` em `sa-east-1` (São Paulo), cada um com senha forte do banco. Em cada projeto:

- Authentication → URL Configuration: *Site URL* com o endereço do ambiente (o domínio de produção, ou a URL de Preview da Vercel na homologação) e `https://*-agapp.vercel.app/**` nas *Redirect URLs* da homologação.
- Authentication → Emails → SMTP Settings: ligue o SMTP próprio (passo 4).

**2. GitHub.** Em Settings → Environments, crie:

| Ambiente | Proteção | Variável (`vars`) | Secrets |
| --- | --- | --- | --- |
| `staging` | Nenhuma | `SUPABASE_PROJECT_REF` (ref do `imobbay-staging`) | `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` |
| `production` | *Required reviewers*: Alan; *Deployment branches*: só `main` | `SUPABASE_PROJECT_REF` (ref do `imobbay-prod`) | `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` |

O `SUPABASE_ACCESS_TOKEN` é um token pessoal (supabase.com → Account → Access Tokens). Em Settings → Secrets and variables → Actions, crie também o secret de repositório `VERCEL_DEPLOY_HOOK_URL` (passo 3).

**3. Vercel.** Importe o repositório no time Agapp. O `vercel.json` já fixa as funções em `gru1` (São Paulo) e desliga o deploy automático da `main`, que passa a ser feito pelo workflow; os Previews de cada PR continuam automáticos. Depois:

- Settings → Environment Variables: as variáveis da tabela de [Variáveis de ambiente](#variáveis-de-ambiente), com os valores de homologação marcados só para *Preview* e os de produção só para *Production*. As chaves secretas como *Sensitive*.
- Settings → Git → Deploy Hooks: crie um hook para a branch `main` e salve a URL no secret `VERCEL_DEPLOY_HOOK_URL` do GitHub.

**4. SMTP próprio.** O e-mail padrão do Supabase só envia poucas mensagens por hora e só para a equipe. Usamos o Resend:

1. Crie a conta no Resend, verifique o domínio do Imobbay (registros DNS SPF e DKIM) e gere uma chave de API só com permissão de envio.
2. No Supabase, em Authentication → Emails → SMTP Settings: host `smtp.resend.com`, porta `465`, usuário `resend`, senha a chave de API, remetente `nao-responda@<domínio>` com nome `Imobbay`.
3. Em Authentication → Rate Limits, suba o limite de e-mails por hora (o padrão com SMTP próprio é 30).
4. Teste com "Send magic link" em Authentication → Users: o e-mail precisa chegar em menos de 1 minuto.

Sem domínio verificado, o Resend só entrega para o e-mail dono da conta, o que basta para testar a homologação.

**5. Prova do fluxo.** A migração `supabase/migrations/20261029000000_baseline.sql` não muda nada no banco. Com os passos acima feitos, o merge do PR da IF-003 a leva até homologação e, depois da aprovação, até produção, e a Vercel publica em seguida.

## Backups

- No plano Pro do Supabase: backup diário automático com 7 dias de retenção. Antes de abrir a onda paga, ativar PITR (recuperação para qualquer ponto no tempo), que custa à parte.
- Backup lógico semanal (`pg_dump`) para um storage externo via GitHub Actions, com retenção de 30 dias, para não depender de um único fornecedor.
- Teste de restauração em homologação uma vez por trimestre.
- As fotos no Storage não entram no backup do banco; uma cópia semanal do bucket fica como melhoria pós-MVP.
