# Decisões do projeto

Registro das decisões aprovadas pelo Alan em cada fase. Em 29/10/2026 o produto mudou de nome, de ImobFlow para **Imobbay**; os documentos das fases foram escritos com o nome antigo. Para mudar uma decisão, abra uma issue citando o número dela; o texto aqui só muda junto com a aprovação.

| Fase | Documento aprovado | Decisões |
| --- | --- | --- |
| 1 · PRD | [PRD do MVP](https://claude.ai/artifact/3ydw7vY4BU4mcT6yxC7cgB) · 27/10/2026 | D1 a D10 |
| 2 · Arquitetura e banco | [Arquitetura](https://claude.ai/artifact/GCzTwTYJyz5YFqPteadmrc) · 28/10/2026 | D11 a D21 |
| 3 · Design system e telas | [Design system](https://claude.ai/artifact/NdxS1pcYjfbjQ6dbT8j8Fk) · 28/10/2026 · [Figma](https://www.figma.com/design/JOlqUtUxhfp2mQ2EgN75c2/Teste-telas) | D22 a D36, ajustes A1 a A5 |
| 4 · Repositório e backlog | [Backlog](https://claude.ai/artifact/WrWANrVDCUTN2byDtkVctR) · 28/10/2026 | D37 a D44, ajustes A6 a A9 |

## Fase 1 · PRD

| # | Decisão |
| --- | --- |
| D1 | Público do MVP limitado a autônomos e imobiliárias de até 20 corretores, sem gestão de locação. |
| D2 | Papéis Proprietário, Administrador e Corretor, com o Corretor vendo apenas os próprios leads (RN06). |
| D3 | Funil com 6 etapas fixas e proposta como registro da negociação. |
| D4 | Página pública por imóvel + formulário geral como solução de captação e compartilhamento. |
| D5 | Cloudflare Turnstile como proteção anti-spam (alternativa: reCAPTCHA v3). |
| D6 | Planos e limites propostos (Starter R$ 79 e Pro R$ 199) como hipótese inicial. |
| D7 | Teste de 14 dias sem cartão e modo somente leitura em caso de inadimplência. |
| D8 | Lembretes apenas dentro do sistema no MVP. |
| D9 | Lançamento em duas ondas, com beta fechado gratuito antes da cobrança. |
| D10 | Itens P1 podem ser cortados do MVP se o prazo apertar. |

## Fase 2 · Arquitetura e banco

| # | Decisão | Por quê | Alternativa descartada |
| --- | --- | --- | --- |
| D11 | Monólito modular em Next.js (Server Components, Server Actions e Route Handlers), sem backend separado | Um deploy, um repositório, menos custo e menos superfície de ataque para um time pequeno | API separada (NestJS/Express): dobra infraestrutura sem ganho no MVP |
| D12 | Multi-tenant em banco único, coluna `organization_id` em toda tabela de negócio + RLS | Padrão do Supabase, escala bem até milhares de imobiliárias, migrações simples | Um schema ou um banco por cliente: migrações e custo multiplicados |
| D13 | Organização ativa guardada em cookie e validada no servidor a cada request; o banco confere a filiação via função `is_member()` | Funciona sem customizar o JWT e já suporta usuário em mais de uma imobiliária | Claim no JWT via Auth Hook: mais rápido, mas exige refresh do token ao trocar de organização; fica como otimização futura |
| D14 | Todo acesso a dados usa o cliente Supabase do próprio usuário (RLS ativa). A chave secreta só existe em módulo `server-only` para webhooks, captação pública e rotinas agendadas | Um bug na aplicação não vaza dados de outra imobiliária, porque o banco recusa | Usar a chave secreta no servidor para tudo: qualquer filtro esquecido vira vazamento |
| D15 | Sem ORM: migrações SQL versionadas pela Supabase CLI, tipos TypeScript gerados do banco e validação com Zod | RLS, triggers e funções são SQL de qualquer forma; evita uma camada a mais | Prisma ou Drizzle: não conversam bem com RLS e duplicam o schema |
| D16 | Limites de plano (usuários, imóveis, IA) e o modo somente leitura são aplicados no banco por triggers e RLS, além da interface | A regra vale mesmo se alguém chamar a API direto | Validar só na interface: contornável |
| D17 | Exclusão lógica (`deleted_at`) para imóveis, leads e negociações; pedido de exclusão LGPD faz anonimização definitiva | Permite desfazer erros e manter indicadores; atende o direito de exclusão | Exclusão física direta: perde histórico e métricas |
| D18 | Fotos em bucket público com caminho `org/imóvel/uuid`; upload e remoção só por membros via políticas do Storage | Página pública do imóvel e prévia no WhatsApp precisam de URL estável e com cache | URLs assinadas: expiram, quebram o compartilhamento e custam mais |
| D19 | Rotinas de status (fim do teste, inadimplência para somente leitura) rodam com `pg_cron` dentro do Supabase | Regras puramente de banco, sem depender de outro serviço | Vercel Cron chamando uma rota: mais uma peça e um segredo para proteger |
| D20 | Três ambientes: local (Supabase CLI), homologação (projeto Supabase separado + Preview da Vercel) e produção | Testar migrações e webhooks do Asaas em sandbox sem tocar em dados reais | Supabase Branching: útil, mas tem custo extra; pode entrar depois |
| D21 | TypeScript 6.0 no início, avaliando a migração para o 7.0 na Fase 5 | O 7.0 (compilador nativo) saiu em julho de 2026 e ainda é recente para o ecossistema | Adotar o 7.0 já: risco de incompatibilidade em ferramentas |

## Fase 3 · Design system e telas

| # | Decisão | Por quê | Alternativa descartada |
| --- | --- | --- | --- |
| D22 | Visual escuro com verde-limão (#C6F36B) como cor de destaque, seguindo a referência enviada pelo Alan; neutros cinza com um leve tom do próprio limão (nunca cinza puro) | Visual moderno e marcante; a ação principal salta da tela; texto preto sobre o limão tem contraste de 15:1 | Verde-petróleo em tema claro (primeira versão deste documento) |
| D23 | Dois temas no MVP: escuro é o padrão e o claro já vem pronto. O usuário escolhe em “Aparência” (Automático, Claro ou Escuro) no menu do perfil; Automático segue o aparelho | O escuro é a direção visual escolhida; o claro atende quem trabalha na rua, sob sol forte. Os dois saem das mesmas variáveis, então cada tela é revisada nos dois modos sem retrabalho | Só um tema (escuro ou claro) |
| D24 | Fonte única Manrope, carregada pelo `next/font` (servida pelo próprio domínio) | Boa leitura em telas pequenas, números claros, sem chamada ao Google em tempo de uso (melhor para LGPD e LCP) | Inter (muito comum) ou fonte do sistema (visual inconsistente entre aparelhos) |
| D25 | Texto base de 16 px em todo o app; tabelas no desktop com 14 px | Público com pouca familiaridade digital; 16 px evita o zoom automático do iPhone em campos | Base de 14 px, comum em B2B, mas pequena no celular |
| D26 | Desktop com menu lateral; celular com barra inferior de 4 itens e botão central “Novo” | Os 4 destinos diários ficam a um toque do polegar; criar lead, imóvel, visita ou tarefa vira um gesto só | Menu “hambúrguer” no celular: esconde a navegação de quem tem menos prática |
| D27 | No celular, o Funil é uma aba dentro de Leads (Lista \| Funil); no desktop, os dois aparecem no menu | Cabe na barra inferior sem perder o acesso; as rotas `/leads` e `/funil` da Fase 2 continuam iguais | Funil como 5º item da barra inferior, apertando os alvos de toque |
| D28 | Kanban com a biblioteca `@dnd-kit`, sempre acompanhado da ação “Mover para” | Única dependência nova de interface: arrastar e soltar acessível por teclado e toque; o botão atende quem não arrasta | Implementar arrastar e soltar do zero, frágil no toque |
| D29 | Gráficos do painel feitos com barras em HTML/CSS, sem biblioteca de gráficos | O PRD pede só barras simples (P1); economiza cerca de 100 KB no celular | Recharts (usado pelos gráficos do shadcn) |
| D30 | Tabelas sem TanStack Table: filtros, ordem e página ficam na URL e a consulta roda no servidor | Até 2.000 imóveis, paginação no servidor é mais rápida e o link filtrado pode ser compartilhado entre a equipe | DataTable do shadcn com TanStack, que filtra no navegador |
| D31 | Cadastro de imóvel em 5 etapas no celular e em página única com seções no desktop; rascunho salvo a cada etapa | Atende o critério “imóvel com 10 fotos em menos de 5 minutos pelo celular” sem perder dados se a conexão cair | Formulário longo único também no celular |
| D32 | Lead e imóvel abrem em página própria; criar e editar itens pequenos (visita, tarefa, atividade, proposta) abre em painel lateral no desktop e em folha inferior no celular | O corretor não perde o contexto da tela onde estava | Tudo em página própria, com muitas idas e voltas |
| D33 | Ícones só do Lucide, sempre com rótulo de texto em navegação e ações principais | Ícone sozinho é ambíguo para quem tem pouca prática | Barra de ícones sem texto |
| D34 | Forma: cartões em cinza-escuro sem borda e com raio de 24 px, painéis com 28 px, botões e chips em pílula, chip ativo em branco e botão circular com seta (↗) para abrir o detalhe | Segue a referência; o botão circular dá um alvo de toque claro para “abrir” sem ocupar espaço com texto | Raios de 6 e 10 px com bordas (primeira versão) |
| D35 | Indicador de interesse do lead em 5 pontos coloridos (frio → quente) nos cartões de lead e do funil, marcado pelo corretor | Ajuda a priorizar quem chamar primeiro; depende do ajuste A5 | Sem indicador; prioridade só pela etapa e pelo tempo sem resposta |
| D36 | Movimento e acabamento seguem duas referências públicas: o design engineering do Emil Kowalski (tempos curtos, curvas ease-out próprias, toque que encolhe para 97%, sem animação em ação repetida) e o Impeccable (sem rótulo acima de título, sem barra colorida lateral, sem brilho decorativo, cinzas com tom, acabamento do navegador tematizado) | Detalhes invisíveis somam: o app parece rápido e feito à mão, não montado por padrão | Deixar animações e acabamento para decidir no código |

## Fase 4 · Repositório e backlog

| # | Decisão |
| --- | --- |
| D37 | Repositório único `aclconceicaobr/imobflow`, com pnpm e Node 24. O documento previa privado; em 29/10/2026 o Alan manteve público, porque no plano gratuito do GitHub a proteção da `main` só vale em repositório público |
| D38 | Uma história, uma branch, um PR; merge por squash com CI verde e revisão do Alan |
| D39 | O backlog vira GitHub Issues, com marcos Onda 1 e Onda 2 e etiquetas por épico, prioridade e tamanho; cada PR fecha sua issue |
| D40 | Os ajustes A1 a A9 entram direto nas primeiras migrações (IF-010 e IF-011) |
| D41 | Contas do beta ganham 30 dias de Pro grátis quando a onda 2 abrir e depois seguem o fluxo normal de pagamento (IF-105) |
| D42 | `CLAUDE.md` e a pasta `docs/` guardam as regras do projeto dentro do repositório |
| D43 | Commits, PRs e issues em português com prefixo convencional; código em inglês |
| D44 | Nenhuma tela de negócio (E3 a E8) começa antes de a IF-013, os testes de isolamento, estar verde no CI |

## Ajustes entre fases

| # | Diferença | O que vale |
| --- | --- | --- |
| A1 | O PRD prevê visita “Confirmada”, mas o enum de `appointments.status` não tinha esse valor | Adicionar `confirmed` ao enum |
| A2 | Origens do lead diferentes entre PRD e banco | Usar a lista do PRD: formulário, WhatsApp, Instagram, Facebook, portal, indicação, placa, telefone, outro |
| A3 | Faturamento: PRD diz “só o Proprietário”, a Fase 2 dava “Ver” ao Administrador | Administrador vê plano e uso dos limites; faturas, troca de plano e cancelamento só com o Proprietário |
| A4 | Código do imóvel: IMB-0042 no PRD, AP0042 na Fase 2 | Padrão único IMB-0042 |
| A5 | O indicador de interesse (D35) não tinha campo no banco | `leads.interest_level smallint null`, `check (interest_level between 1 and 5)` |
| A6 | O PRD mede o MVP por eventos de produto, sem tabela na Fase 2 | Tabela `product_events` (organização, usuário, evento, dados, data), só inserção, lida pelo admin; gravação em IF-092 |
| A7 | Limite da captação diferente entre PRD (RN27) e Fase 2 | Valores do PRD (5 por IP a cada 10 min, 3 por telefone por dia) mais o teto de 200 por imobiliária por dia |
| A8 | Fotos: PRD limita por plano (15/30), Fase 2 fixava 20 | Limite por plano em `plans.max_photos` |
| A9 | Limite de imóveis: PRD conta só disponível e reservado, o trigger da Fase 2 contava todos | Contar só disponível e reservado |
