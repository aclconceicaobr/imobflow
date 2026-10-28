# Segurança e RLS

Resumo da seção de segurança da [arquitetura aprovada](https://claude.ai/artifact/GCzTwTYJyz5YFqPteadmrc). As migrações entram a partir da IF-010 e os testes pgTAP na IF-013 (D44).

## Princípios de RLS

- RLS ligada em **todas** as tabelas do schema `public`, inclusive as que o cliente não acessa (sem política = tudo negado). Um teste de CI falha se alguma tabela nova vier sem RLS.
- As políticas usam três funções do schema `private`, marcadas `security definer`, `stable` e com `search_path` fixo:
  - `is_member(org_id)`: o usuário é membro ativo da organização.
  - `has_role(org_id, roles[])`: o usuário tem um dos papéis informados.
  - `can_write(org_id)`: a assinatura não está em somente leitura nem cancelada. Entra em toda política de `insert`, `update` e `delete`, e é assim que o modo somente leitura (7 dias de inadimplência) vale para qualquer caminho.
- `auth.uid()` aparece sempre como `(select auth.uid())`, o que faz o Postgres calcular uma vez por consulta e não uma vez por linha.
- Políticas separadas por operação (`select`, `insert`, `update`, `delete`) e sempre com `to authenticated`. O papel `anon` não tem acesso a nenhuma tabela; só à view `public_properties`.
- Colunas que o usuário não pode mudar (`organization_id`, `created_by`, `role` do próprio vínculo) são protegidas por trigger, já que RLS controla linhas e não colunas.

O detalhe por tabela está na seção **Políticas RLS por tabela**.

## Outras camadas de segurança

| Risco | Proteção |
| --- | --- |
| Vazamento de chave | Chave secreta do Supabase, Asaas, OpenAI e Turnstile só em variáveis de ambiente do servidor; `env.ts` falha o build se uma variável secreta tiver prefixo `NEXT_PUBLIC_` |
| Spam e abuso na captação | Turnstile obrigatório, campo *honeypot*, limite de 5 envios por IP por hora e 200 por imobiliária por dia, tamanho máximo dos campos |
| Webhook falso do Asaas | Token secreto no cabeçalho `asaas-access-token` conferido em tempo constante; evento gravado uma única vez pelo `id` (idempotência) |
| Abuso de IA | Cota mensal por plano checada no banco antes da chamada, limite de 10 gerações por minuto por usuário, texto de entrada limitado |
| Upload malicioso | Tipos aceitos só JPEG, PNG e WebP; até 10 MB; limite no bucket e na política |
| XSS e clickjacking | React escapa conteúdo por padrão; descrições salvas como texto puro; cabeçalhos CSP, `X-Frame-Options` e `Referrer-Policy` no `next.config` |
| CSRF | Server Actions conferem a origem por padrão no Next.js; Route Handlers públicos não usam cookie de sessão |
| Conta de admin da plataforma | MFA obrigatório e auditoria de cada acesso |

O limite de requisições (rate limit) fica numa tabela do próprio Postgres com janela por minuto, sem serviço extra. Se o volume crescer, trocamos por Upstash Redis.



Legenda: **M** = `is_member(organization_id)`; **A** = papel `owner` ou `admin`; **O** = só `owner`; **R** = o registro é do próprio corretor (`assigned_to` ou `broker_id` = usuário); **W** = `can_write(organization_id)`. "Servidor" significa sem política para o cliente: só a chave secreta, em código do servidor, acessa.

| Tabela | Ler (select) | Criar (insert) | Alterar (update) | Excluir (delete) |
| --- | --- | --- | --- | --- |
| `organizations` | M | Função `create_organization()` | A + W | Servidor (cancelamento) |
| `profiles` | O próprio, ou colegas de alguma organização em comum | Trigger do Auth | O próprio | Cascata do Auth |
| `organization_members` | M | Função `accept_invitation()` | A + W, sem mexer no `owner`; só O muda papéis | A + W, nunca o `owner` |
| `organization_invitations` | A | A + W | A | A |
| `properties` | M | M + W | A + W, ou R + W | A + W (exclusão lógica) |
| `property_images` | M | Quem pode alterar o imóvel + W | Idem | Idem |
| `leads` | A, ou R | M + W (corretor só cria para si) | A + W, ou R + W sem mudar `assigned_to` | A + W |
| `lead_property_interests` | Quem vê o lead | Quem vê o lead + W | — | Quem vê o lead + W |
| `opportunities` | A, ou R | A + W, ou R + W | A + W, ou R + W | A + W |
| `activities` | Quem vê o lead | Quem vê o lead + W | Autor, até 24 h, + W | A + W |
| `appointments` | A, ou R | A + W, ou R + W | A + W, ou R + W | A + W, ou R + W |
| `subscriptions` | M | Servidor | Servidor | Servidor |
| `plans` | Todos autenticados | Servidor | Servidor | Servidor |
| `billing_events` | Servidor | Servidor | Servidor | Servidor |
| `ai_usage` | A vê tudo; corretor vê o próprio | Função `reserve_ai_credit()` | Servidor | Servidor |
| `audit_logs` | O | Funções e servidor | Ninguém | Ninguém |
| `platform_admins`, `rate_limits` | Servidor | Servidor | Servidor | Servidor |

**Leitura pública.** O papel `anon` não lê nenhuma tabela. A view `public_properties` (dona `postgres`, com `security_barrier`) devolve só imóveis `is_published` e `available`, de organizações com assinatura ativa, sem `owner_name`, `owner_phone` e sem endereço quando `show_exact_address = false`.

**Exemplo de política (leads, leitura)**

```sql
create policy leads_select on public.leads
for select to authenticated
using (
  deleted_at is null
  and private.is_member(organization_id)
  and (
    private.has_role(organization_id, array['owner','admin']::member_role[])
    or assigned_to = (select auth.uid())
  )
);
```

**Storage.** Políticas em `storage.objects` usam a primeira pasta do caminho como organização: upload e remoção em `property-images` exigem `is_member((storage.foldername(name))[1]::uuid)` e `can_write` da mesma organização; `org-assets` exige papel A; `avatars` exige que a pasta seja o próprio `auth.uid()`.

**Como provamos que funciona.** Para cada linha da tabela acima existe um teste pgTAP com três usuários (proprietário, corretor A e corretor B) em duas imobiliárias, cobrindo o caso permitido e o negado. O Supabase Security Advisor também roda a cada migração.

## Segredos no código

- Variáveis de ambiente são lidas só por `src/lib/env.ts` (servidor) e `src/lib/env/public.ts` (navegador). O ESLint recusa `process.env` em qualquer outro arquivo de `src/`.
- `src/lib/env.ts` importa `server-only`: se um componente de cliente o importar, o build quebra.
- O `next.config.ts` valida o ambiente antes do build e do `next dev` (ver [operacao.md](operacao.md)).
