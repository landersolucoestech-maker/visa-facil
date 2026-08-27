# Telefonia e SMS — Arquitetura agnóstica de provedor

## Objetivo

O CRM deve poder incorporar telefonia e SMS sem acoplar regras de negócio, VisaChat, Contatos/Leads ou histórico de comunicação a um fornecedor específico. A inclusão de um novo provedor deve exigir somente um novo adapter e sua configuração server-side, preservando o mesmo contrato canônico usado pelo restante do sistema.

Esta documentação descreve arquitetura futura. O repositório atual não possui backend de telefonia, credenciais reais, linhas provisionadas, envio de SMS, recebimento de mensagens ou chamadas reais. A interface não deve declarar nenhum provedor como conectado enquanto o backend não confirmar a conexão.

## Famílias de provedores

A arquitetura contempla duas famílias principais e pontos de extensão genéricos:

- **Operadoras de telefonia tradicionais:** Vivo, TIM, Claro e outras operadoras. O acesso programático, SMS corporativo, voz, linhas, gateways e relatórios depende do contrato comercial e dos recursos/API disponibilizados por cada operadora.
- **Provedores de comunicação por IP/Internet:** Twilio, Dialpad, RingCentral e serviços equivalentes de CPaaS/UCaaS/telefonia em nuvem. Autenticação, números, webhooks e capacidades continuam dependentes do plano e da API do fornecedor.
- **Providers customizados:** qualquer fornecedor futuro pode ser conectado por um adapter compatível sem alterar o modelo central. `CommunicationProviderKey` é deliberadamente `string`, e não uma união fechada de marcas.

O catálogo em `apps/web/src/modules/integrations/communicationContract.ts` é uma lista de **targets de adapters**, não uma declaração de que determinada operadora já disponibiliza todas as capacidades listadas, nem de que existe contrato ativo.

## Contratos canônicos

### Provider connection

`CommunicationProviderConnection` representa uma conexão lógica com um fornecedor. Ele guarda somente metadados não secretos e uma referência `credentialSetRef` para credenciais armazenadas no backend/secret manager. API keys, senhas, tokens, client secrets, certificados e outros segredos nunca entram em `localStorage`, `sessionStorage`, bundle Vite ou GitHub Pages.

Estados previstos: `unconfigured`, `pending`, `connected`, `degraded`, `disconnected`, `error`.

### Endpoint

`CommunicationEndpoint` abstrai o identificador usado para originar/receber comunicações:

- linha telefônica física;
- número virtual;
- sender ID, quando o provedor/regulação permitir.

O domínio guarda o número/remetente exibível e uma referência opaca do provider. IDs internos do CRM não dependem do formato do identificador externo.

### Route

`CommunicationRoute` define qual conexão e endpoint serão usados por canal. A rota possui prioridade e pode ser ativada/desativada. Isso permite, futuramente, ter múltiplos fornecedores, números ou rotas de fallback sem alterar a lógica de CRM/VisaChat.

Regras de roteamento futuras podem considerar país, tipo de tráfego, unidade de negócio, horário, custo, saúde do provider, opt-in e restrições regulatórias. Essas regras devem ser implementadas no backend; o frontend apenas administra metadados autorizados.

### Message record

`CommunicationMessageRecord` normaliza o histórico de SMS e registra:

- provider e conexão utilizados;
- `providerMessageId` quando existir;
- rota e endpoint/número/remetente usados;
- direção `inbound` ou `outbound`;
- origem e destino;
- corpo da mensagem;
- status de entrega normalizado;
- timestamps do ciclo de vida;
- motivo de erro quando aplicável;
- vínculos opcionais com CRM, VisaChat, Contratos, Tarefas e Faturamento.

Status canônicos: `queued`, `submitted`, `sent`, `delivered`, `undelivered`, `failed`, `received`, `read`, `unknown`. O adapter converte estados específicos de cada fornecedor para esse conjunto sem vazar enums de SDK para o domínio.

## Adapter obrigatório

Cada fornecedor futuro implementa `CommunicationProviderAdapter` no backend. A interface canônica exige, no mínimo:

- `sendSms` para envio normalizado;
- `normalizeInboundEvent` para mensagens recebidas;
- `normalizeDeliveryEvent` para status/recibos de entrega;
- `listEndpoints`, quando o fornecedor permitir descoberta de números/linhas.

SDKs, URLs, headers, assinaturas, payloads e erros específicos ficam confinados ao adapter. O CRM e o VisaChat não chamam SDK de Vivo, TIM, Claro, Twilio, Dialpad, RingCentral ou qualquer outro fornecedor diretamente.

## Fluxo futuro de SMS de saída

1. O módulo de origem identifica o registro CRM/conversa e solicita envio canônico.
2. O backend valida autorização, opt-in/políticas e destinatário.
3. O roteador seleciona `CommunicationRoute` e `CommunicationEndpoint` ativos.
4. O adapter do provider recebe `SendSmsCommand` e executa o envio.
5. O backend persiste `CommunicationMessageRecord` com `providerMessageId` e status inicial.
6. Webhooks/polling autorizados atualizam o mesmo registro de forma idempotente.
7. VisaChat e demais módulos recebem o estado canônico, sem conhecer o payload original do fornecedor.

Nenhuma falha de provider pode ser transformada em sucesso local. Sem backend/provider ativo, o frontend deve indicar indisponibilidade.

## Fluxo futuro de SMS de entrada

1. O endpoint HTTPS do provider recebe o evento bruto.
2. A assinatura/token é validada antes do processamento quando exigido.
3. O adapter converte o payload em `CommunicationInboundEvent`.
4. O backend deduplica pelo identificador do provider.
5. O número/remetente receptor resolve o endpoint e a rota correspondentes.
6. O remetente é relacionado ao CRM por identidade telefônica somente quando houver correspondência inequívoca; casos ambíguos vão para revisão/triagem.
7. A mensagem é persistida e vinculada a uma conversa VisaChat existente ou a uma nova conversa canônica conforme as regras de atendimento.

## Telefonia/voz

O contrato já reserva o canal `voice`, endpoints físicos/virtuais e capacidades de voz de entrada/saída. Uma etapa futura poderá adicionar `CommunicationCallRecord`, estados de chamada, duração, gravação autorizada, transcrição e filas. Isso deve reutilizar `providerConnectionId`, `endpointId`, `routeId` e `CommunicationRecordLink`, sem alterar o modelo de SMS.

Gravação, retenção e transcrição de chamadas devem ser habilitadas somente após definição jurídica, consentimento aplicável e política de privacidade/retenção.

## Credenciais e configuração

A configuração de um provider deve ser composta por metadados no CRM e segredos no backend:

- provider/adapter escolhido;
- ambiente sandbox/produção quando existir;
- conta/tenant/contrato de referência;
- `credentialSetRef` apontando para secret manager;
- linhas, números virtuais ou sender IDs provisionados;
- canais habilitados;
- rotas e prioridades;
- URL/configuração de webhook quando aplicável;
- capacidades efetivamente verificadas pelo backend.

O frontend nunca solicita nem persiste secret values diretamente. Caso o backend ofereça onboarding de credenciais, ele deve usar um fluxo administrativo seguro e retornar apenas referências/estado sanitizado ao navegador.

## Integração com CRM e VisaChat

`CommunicationRecordLink` pode relacionar uma comunicação com:

- `crmRecordId`;
- `attendanceConversationId`;
- `contractId`;
- `taskId`;
- `invoiceId`.

Esses vínculos usam IDs canônicos. Nome do cliente, número exibido ou texto da conversa não substituem a referência estrutural. Mudanças de nome no CRM não podem quebrar o histórico de comunicação.

No VisaChat, SMS será mais um transporte externo. A conversa continua sendo a entidade de atendimento; provider, número e status de entrega pertencem aos registros de comunicação. Isso permite trocar Twilio por uma operadora/gateway, usar mais de um número ou migrar provider sem recriar o histórico do cliente.

## Segurança, compliance e operação

Antes de produção são obrigatórios:

- backend autenticado e RBAC server-side;
- secret manager/KMS;
- validação de assinatura de webhook;
- idempotência de entrada e de envio;
- rate limiting e controle de abuso;
- retries com backoff e DLQ para falhas transitórias;
- logs estruturados sem corpo sensível/segredos quando não necessários;
- política de retenção e acesso ao conteúdo das mensagens;
- regras de opt-in/opt-out e conformidade regulatória aplicável ao país/rota;
- observabilidade por provider, rota, status e latência;
- health checks antes de marcar conexão como `connected`.

## Extensão para um novo fornecedor

Para adicionar outro fornecedor no futuro:

1. cadastrar metadados do target no catálogo (opcional para exibição administrativa);
2. implementar `CommunicationProviderAdapter` no backend;
3. mapear credenciais por referência server-side;
4. mapear endpoints/números e capacidades;
5. mapear estados/eventos do fornecedor para os contratos canônicos;
6. registrar webhook/rotas quando aplicável;
7. executar a suíte de conformidade do adapter.

Nenhum módulo de CRM, VisaChat, Contratos, Financeiro ou Tarefas deve precisar de código específico da nova marca.
