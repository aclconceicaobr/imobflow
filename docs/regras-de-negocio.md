# Regras de negócio

Copiadas da seção 7 do [PRD aprovado](https://claude.ai/artifact/3ydw7vY4BU4mcT6yxC7cgB). Cite o código (RN01 a RN41) no nome do teste que verifica a regra, por exemplo `it("RN15: reaproveita lead com o mesmo telefone")`.

Os ajustes de [decisoes.md](decisoes.md) complementam estas regras: A7 soma à RN27 o teto de 200 envios por imobiliária por dia, A8 limita as fotos por plano (15 no Starter, 30 no Pro) e A9 confirma a RN11 no banco.

## 7.1 Organização, membros e permissões

- **RN01.** Todo dado de negócio (imóvel, foto, lead, negociação, atividade, compromisso, uso de IA) pertence a exatamente uma organização e nunca é visível para outra.
- **RN02.** Toda organização tem exatamente um Proprietário. A propriedade só é transferida por ação do próprio Proprietário para outro membro ativo.
- **RN03.** Um usuário pode participar de várias organizações e sempre trabalha dentro de uma organização ativa por vez.
- **RN04.** Convites expiram em 7 dias, valem para um e-mail específico e só podem ser enviados se houver vaga no plano. Convites pendentes contam como vaga ocupada. No Pro, cada usuário ativo além do 5º acrescenta R$ 29 à mensalidade seguinte, até o máximo de 20 usuários.
- **RN05.** Membro desativado perde acesso imediatamente, mas seu nome continua no histórico. Nada é apagado ao desativar.
- **RN06.** Matriz de permissões:

| Ação | Proprietário | Administrador | Corretor |
| --- | --- | --- | --- |
| Ver e editar todos os imóveis | Sim | Sim | Ver todos, editar os seus |
| Criar imóvel | Sim | Sim | Sim (fica como responsável) |
| Excluir/inativar imóvel | Sim | Sim | Não (só inativar os seus) |
| Ver leads e negociações | Todos | Todos | Atribuídos a ele |
| Atribuir e transferir leads | Sim | Sim | Não |
| Ver agenda | Todos | Todos | A sua |
| Dashboard da equipe | Sim | Sim | Não |
| Convidar e desativar membros | Sim | Sim (exceto Proprietário) | Não |
| Assinatura e faturamento | Sim | Não | Não |
| Configurações da organização | Sim | Sim | Não |
| Usar IA | Sim | Sim | Sim |

## 7.2 Imóveis

- **RN07.** Campos obrigatórios: tipo, finalidade, preço da finalidade escolhida, cidade, bairro e responsável. O restante pode ficar para depois, para não travar o cadastro.
- **RN08.** O código de referência é único na organização e não muda depois de criado.
- **RN09.** Só imóveis com status disponível ou reservado têm página pública. Os demais mostram "Imóvel indisponível" com o formulário geral da organização.
- **RN10.** Notas internas, dados do proprietário e número do endereço (quando oculto) nunca saem na página pública nem no texto de compartilhamento.
- **RN11.** Imóveis ativos (disponível ou reservado) contam para o limite do plano. Vendido, alugado e inativo não contam.
- **RN12.** Fotos: JPG, PNG ou WebP, até 10 MB antes da compressão. A primeira foto é a capa se nenhuma for escolhida.
- **RN13.** Excluir imóvel é exclusão lógica por 30 dias (recuperável). Depois, fotos e dados são removidos de fato. Negociações mantêm o código e o título do imóvel no histórico.

## 7.3 Leads e negociações

- **RN14.** Lead exige nome e pelo menos um contato (WhatsApp ou e-mail). Telefones são guardados no formato internacional (+55…).
- **RN15.** Na mesma organização, telefone ou e-mail repetido indica o mesmo lead. Pelo formulário, o lead existente é reaproveitado e recebe nova atividade e, se o imóvel for diferente, nova negociação. No cadastro manual, o sistema avisa e oferece abrir o existente.
- **RN16.** Lead do formulário de um imóvel vai para o responsável pelo imóvel. Lead do formulário geral fica sem responsável e aparece para Proprietário e Administradores. No plano Starter, vai sempre para o Proprietário.
- **RN17.** Etapas do funil, nesta ordem: Novo, Em atendimento, Visita, Proposta, Ganho, Perdido. Qualquer etapa pode ir para qualquer outra, e toda mudança gera registro automático no histórico com autor e data.
- **RN18.** Mover para Perdido exige motivo (sem retorno, comprou com outro, sem crédito, desistiu, preço, outro). Mover para Ganho pergunta se o imóvel deve virar vendido ou alugado.
- **RN19.** Uma negociação tem no máximo uma proposta com status "enviada" por vez. Propostas antigas ficam no histórico.
- **RN20.** Histórico de atendimento não pode ser editado depois de 24 h nem excluído por Corretor, para preservar a rastreabilidade.

## 7.4 Agenda e lembretes

- **RN21.** Visita exige data, hora e responsável. Lead e imóvel são recomendados, não obrigatórios.
- **RN22.** Visita em horário que se sobrepõe a outra do mesmo corretor gera aviso, mas pode ser salva.
- **RN23.** Ao agendar visita ligada a uma negociação em Novo ou Em atendimento, o sistema sugere mover para Visita.
- **RN24.** Lembretes: visita, 1 h antes; tarefa, no início do dia do vencimento. Tarefa vencida e não concluída aparece como atrasada no dashboard.
- **RN25.** Horários guardados em UTC e exibidos no fuso da organização (padrão America/Sao\_Paulo).

## 7.5 Captação e LGPD

- **RN26.** O formulário exige nome, WhatsApp ou e-mail e aceite da política de privacidade. A data, o IP e a versão do texto aceito são registrados.
- **RN27.** Limite de 5 envios por IP a cada 10 minutos e de 3 envios por telefone por dia para a mesma organização. O excesso é descartado sem revelar o motivo.
- **RN28.** Perante a LGPD, a imobiliária é controladora dos dados dos seus leads e o Imobbay é operador. Isso consta nos Termos de Uso e no contrato de tratamento de dados.
- **RN29.** A organização pode excluir um lead definitivamente a pedido do titular. A exclusão remove dados pessoais e mantém apenas números anonimizados para indicadores.

## 7.6 IA

- **RN30.** Cada geração ou revisão conta 1 uso, mesmo que o texto seja descartado. Falha da API não conta.
- **RN31.** A cota é mensal por organização e reinicia no dia 1 de cada mês. Ao atingir 80%, o Proprietário recebe aviso no sistema. Ao atingir 100%, o botão fica bloqueado com convite para upgrade.
- **RN32.** O texto enviado à IA contém apenas dados do imóvel, nunca dados de leads ou do proprietário. O texto gerado não cita endereço completo.
- **RN33.** Limite de 10 chamadas por minuto por usuário, independentemente da cota.

## 7.7 Assinatura e cobrança

- **RN34.** Estados: Em teste, Ativa, Em atraso, Somente leitura, Cancelada. Somente o webhook do Asaas (ou ação manual auditada do admin da plataforma) muda o estado para Ativa.
- **RN35.** Teste de 14 dias. Ao fim sem pagamento, a conta vai para Somente leitura.
- **RN36.** Cobrança vencida: 7 dias em Em atraso com uso normal e aviso fixo. Depois, Somente leitura: tudo pode ser consultado, nada pode ser criado ou editado, e a captação continua recebendo leads para o cliente não perder contatos.
- **RN37.** Upgrade vale na hora, com cobrança proporcional calculada pelo Asaas. Downgrade vale no próximo ciclo e só é permitido se o uso atual couber no novo plano.
- **RN38.** Cancelamento vale no fim do período pago. Os dados ficam guardados por 90 dias (reativar a assinatura recupera tudo, e uma exportação em planilha pode ser pedida ao suporte) e depois são excluídos, com aviso por e-mail 15 dias antes.
- **RN39.** Todo webhook é gravado antes de ser processado, é validado pelo token do Asaas e é processado uma única vez (chave de idempotência pelo ID do evento).

## 7.8 Auditoria e segurança operacional

- **RN40.** Ações sensíveis ficam em log: login, convite, mudança de papel, desativação, transferência de carteira, exclusão de lead ou imóvel, mudança de plano e ações do admin da plataforma.
- **RN41.** Backups diários do banco com retenção mínima de 7 dias e teste de restauração antes do lançamento.
