# Arquitetura de Integrações

## Princípio de segurança

O frontend Visa Fácil não deve receber, armazenar nem enviar diretamente credenciais privadas de provedores. `VITE_*` é configuração pública incorporada ao bundle do navegador e serve apenas para valores públicos como `VITE_API_BASE_URL`.

A ativação real das integrações exige uma API backend separada com armazenamento seguro de credenciais/tokens, autorização server-side, callbacks OAuth, webhooks, workers de sincronização, observabilidade e persistência.

Meta, YouTube, TikTok e WhatsApp devem iniciar autenticação exclusivamente no fluxo oficial do respectivo provedor. Facebook e Instagram não possuem login próprio dentro do Visa Fácil: são produtos/canais conectados sob o provider técnico Meta. É proibido criar no Visa Fácil telas que imitem login, senha, seleção de conta ou consentimento desses serviços. O frontend pode exibir apenas estado, conta vinculada, produtos/ativos autorizados, permissões/capacidades autorizadas, sincronização, reconexão e desconexão.

## Contrato frontend ↔ backend

O frontend já está preparado para consumir:

- `GET /v1/integrations` — estados reais de conexão;
- `POST /v1/integrations/:provider/connect` — iniciar conexão/OAuth ou configuração server-side;
- `POST /v1/integrations/:provider/reconnect` — reiniciar autorização oficial quando o provedor exigir nova concessão;
- `POST /v1/integrations/:provider/disconnect` — revogar/desconectar;
- `POST /v1/integrations/:provider/sync` — solicitar sincronização manual idempotente;
- `POST /v1/public/leads` — entrada segura do formulário público.

Estados canônicos: `unconfigured`, `disconnected`, `connecting`, `connected`, `degraded`, `error`.

Para integrações OAuth, `connect` e `reconnect` retornam ao navegador somente uma URL HTTPS de autorização validável contra o provedor oficial e metadados não secretos. O backend é o único responsável por receber o callback, trocar authorization code por tokens e armazenar access/refresh tokens.

O backend deve responder erros estruturados com `code`, `message`, `requestId` e `retryable`, sem expor segredos ou respostas brutas sensíveis dos provedores.

## Endpoints server-side previstos

OAuth/callbacks:

- `/v1/integrations/meta/oauth/callback`
- `/v1/integrations/google/oauth/callback`
- `/v1/integrations/tiktok/oauth/callback`

Webhooks, somente onde aplicável:

- `/v1/webhooks/whatsapp`
- `/v1/webhooks/meta`
- `/v1/webhooks/resend`
- `/v1/webhooks/autentique`
- `/v1/webhooks/google-calendar`

A API pode adaptar essas URLs conforme o domínio final, mas deve manter uma única camada de adapters e contratos internos independentes do provedor.

## OAuth e tokens

O backend deve:

- gerar e validar `state` contra CSRF;
- usar PKCE quando suportado/apropriado;
- manter access/refresh tokens somente server-side;
- renovar tokens antes/ao expirar e persistir rotação quando o provedor devolver novo refresh token;
- usar cookie de sessão `HttpOnly`, `Secure` e `SameSite` adequado ou outro mecanismo server-side equivalente;
- guardar scopes concedidos e comparar com os scopes exigidos pela feature;
- guardar também as capacidades efetivamente autorizadas por conta, produto e ativo, sem inferir autorização apenas porque o provedor está conectado;
- revogar tokens na desconexão quando o provedor oferecer endpoint de revogação;
- nunca enviar tokens para logs, frontend, analytics ou mensagens de erro.

## Webhooks e idempotência

Cada webhook deve validar assinatura/segredo antes de desserializar ou processar o evento. Quando o provedor exigir assinatura do corpo bruto, a verificação deve acontecer antes de qualquer transformação do payload.

Persistir eventos recebidos com chave idempotente, preferencialmente `(provider, eventId)` ou o identificador composto exigido pelo provedor. Eventos duplicados devem retornar sucesso idempotente sem repetir efeitos. Eventos fora de ordem precisam usar versão/timestamp do provedor quando disponível.

## Retries e processamento assíncrono

Chamadas transitórias devem usar retry com backoff exponencial + jitter para timeouts, `429` e erros `5xx` classificados como recuperáveis. Erros de autenticação, escopo, validação ou permissão não devem entrar em retry infinito.

Sincronizações e webhooks que gerem trabalho significativo devem ser processados por worker/fila. Após o limite de tentativas, mover o evento para DLQ/estado de revisão manual com possibilidade de replay controlado.

## Logs e observabilidade

Logs estruturados mínimos: `requestId`, `provider`, `integrationId`, `action`, `eventId`, `accountId` quando não sensível, `result`, `errorCode`, `latencyMs`, tentativa e timestamp.

Segredos, tokens, cookies, certificado, senha de certificado e corpo sensível devem ser redigidos. Métricas recomendadas: taxa de sucesso, falhas por provedor, latência, backlog de sync, idade do último sync, webhooks rejeitados, retries e refresh de token.

## Interfaces de domínio recomendadas

O backend não deve espalhar SDKs dos provedores pela regra de negócio. Criar adapters por capacidade, por exemplo:

- `MessagingProvider` — WhatsApp e, sob o provider Meta, Messenger/Instagram quando permitidos;
- `TransactionalEmailProvider` — Resend;
- `DocumentSignatureProvider` — Autentique;
- `FiscalDocumentProvider` — NFS-e;
- `SocialContentProvider` — produtos Facebook/Instagram do provider Meta, YouTube e TikTok;
- `AdsProvider` — Meta Ads, Google Ads e TikTok Ads; inventário de YouTube pertence ao adapter Google Ads, não a um provedor paralelo chamado “YouTube Ads”;
- `CalendarProvider` — Google Calendar.

A camada de aplicação trabalha com interfaces canônicas; SDK/API específica fica confinada ao adapter.

## Provedores

### WhatsApp

Objetivo: trazer conversas, contatos e mensagens para VisaChat e permitir envio autorizado pelo backend.

Configuração externa prevista: Meta App, WhatsApp Business Account (WABA), Phone Number ID, OAuth/Embedded Signup oficial da Meta quando aplicável, webhook HTTPS e token de verificação. Permissões/scopes precisam ser confirmados conforme o modelo de onboarding da Meta e App Review vigente.

Regras: mapear mensagem externa para ID canônico, deduplicar por message ID, manter status de entrega/leitura e impedir duplicação ao receber echo/webhook.

### Resend

Objetivo: e-mail transacional e notificações.

Resend é infraestrutura interna/server-side. Não pertence ao registry configurável pelo frontend e não deve aparecer como integração que o operador conecta no navegador.

Configuração externa: conta Resend, domínio/remetente verificado, API key server-side e segredo de assinatura de webhook.

Regras: armazenar provider message ID; processar delivered/bounced/complained etc. de forma idempotente; separar templates/conteúdo da credencial.

### Autentique

Objetivo: criar, enviar, acompanhar e assinar contratos/documentos.

Configuração externa: conta, token de API, organization ID quando aplicável e configuração de webhook/assinatura disponível no provedor.

O adapter deve mapear documento, signatários, status e eventos para o modelo canônico já definido em `modules/contracts/contractTypes.ts`. O frontend atual não envia documentos ao provedor nem fabrica estados de assinatura; a ativação depende de persistência e autorização server-side, endpoint de envio e webhook verificado conforme `docs/CONTRACTS.md`.

### NFS-e / Nota Fiscal de Serviço

Objetivo: emissão, consulta, cancelamento e acompanhamento de NFS-e.

NFS-e varia por município/provedor e pelo padrão nacional. O backend deve usar `FiscalDocumentProvider`, nunca acoplar a UI a um município específico.

Configuração externa prevista: CNPJ, inscrição municipal, códigos de serviço/tributação, regime/dados fiscais, seleção do provedor/município, ambiente de homologação/produção e certificado digital quando exigido. Certificado e senha ficam em secret manager/KMS, nunca no browser.

### Meta

Objetivo: uma única integração técnica oficial para o ecossistema Meta utilizado pelo Visa Fácil. Facebook, Instagram, Messenger e Meta Ads são produtos/canais internos do provider `meta`; não são providers independentes e não possuem credenciais duplicadas.

A configuração compartilhada no nível do provider Meta inclui Meta App ID, Meta App Secret, fluxo OAuth oficial, tokens e renovação quando aplicável, configuração de webhook, Meta Graph API, status geral da conexão, validade/expiração, reconexão, desconexão e diagnóstico. App Secret, access tokens e refresh/long-lived tokens permanecem exclusivamente server-side.

Hierarquia canônica:

- **Provider:** `Meta`;
- **Connected Products / Channels:** `Facebook`, `Instagram`, `Messenger`, `Meta Ads`;
- **Accounts / Assets:** páginas do Facebook, contas profissionais do Instagram, Business Portfolio/Business Manager, contas de anúncios e demais ativos autorizados.

A autorização pode conceder scopes e capacidades diferentes por produto ou ativo. Essas diferenças devem ser persistidas no nível do produto/ativo correspondente, sem criar novamente providers `facebook` ou `instagram`.

#### Facebook

Produto funcional do provider Meta. Deve permitir futuramente páginas conectadas, informações da página, publicações, gestão de conteúdo, comentários, moderação, métricas e recursos publicitários autorizados. Mensageria relacionada a páginas é representada pelo produto Messenger, ainda sob o mesmo provider Meta.

#### Instagram

Produto funcional do provider Meta. Deve permitir futuramente contas profissionais conectadas, mensagens quando suportadas e autorizadas, atendimento, informações da conta, publicação, gestão de conteúdo, comentários, moderação, métricas e recursos publicitários autorizados.

#### Messenger

Canal de mensagens do provider Meta. Deve permitir futuramente mensagens e atendimento vinculados às páginas/ativos autorizados, com permissões e webhooks verificados pelo backend.

#### Meta Ads

Produto publicitário do provider Meta. Deve permitir futuramente contas de anúncios, campanhas, conjuntos de anúncios, anúncios, criativos, públicos, métricas, insights e acompanhamento de performance por meio da Meta Marketing API.

Configuração externa prevista: um Meta App, OAuth Redirect URI oficial, Business Portfolio/Business Manager quando aplicável, páginas, contas profissionais do Instagram e contas de anúncios autorizadas, webhook HTTPS e permissões/App Review exigidos pelos recursos habilitados. Não criar App ID, App Secret, OAuth, tokens ou webhook separados para Facebook e Instagram quando pertencem ao mesmo Meta App.

Enquanto não existir backend funcional, a interface deve permanecer em **Backend necessário** e não pode fabricar login, token, conta, produto conectado ou estado operacional.

### YouTube

Objetivo: leitura do canal, upload/gestão de conteúdo, comentários e métricas autorizadas. Publicidade usa o adapter de Google Ads.

Configuração externa: Google Cloud Project, YouTube Data API habilitada, YouTube Analytics API quando utilizada, OAuth client ID/secret server-side, redirect URI e canal autorizado. Scopes mínimos devem ser incrementais, por exemplo `youtube.readonly` para leitura e `youtube.upload` para envio quando necessário.

A YouTube Data API não deve ser tratada como API de operação de campanhas pagas. Posicionamentos como YouTube In-stream e YouTube Shorts permanecem disponíveis no planejamento de mídia, mas são executados pela integração Google Ads quando realmente autorizada.

### TikTok

Objetivo: conteúdo e, separadamente, publicidade quando a conta/API permitir.

Configuração externa: TikTok Developer App, client key/secret, redirect URI e scopes aprovados. Publicação direta requer permissões/auditoria do app conforme regras vigentes. Operações publicitárias dependem de acesso ao TikTok for Business/Marketing API e advertiser ID, não apenas do login de conteúdo.

### Google Ads

Objetivo: criar, configurar e consultar campanhas/métricas, incluindo inventário do YouTube quando suportado pela campanha e conta autorizada.

Configuração externa: Google Cloud OAuth client, client secret server-side, developer token, customer ID alvo e login customer ID quando a conta for acessada por um Manager Account. O scope é `https://www.googleapis.com/auth/adwords`. Refresh token/credenciais ficam server-side.

### Google Calendar

Objetivo: sincronização bidirecional de eventos quando tecnicamente apropriado.

Configuração externa: Google Cloud Project, Calendar API habilitada, OAuth client ID/secret, redirect URI e webhook HTTPS para notificações push. Scope inicial previsto: `https://www.googleapis.com/auth/calendar.events`.

O backend deve persistir IDs do evento local/remoto, ETag/updated timestamp, sync token quando disponível, channel/resource IDs de push e expiração dos canais para renovação automática.

## Variáveis e secret management

Frontend público:

- `VITE_API_BASE_URL` — único endereço público da API backend;
- `VITE_CRM_MOCKS` — flag pública do protótipo para datasets demonstrativos centralizados; `false` desabilita os seeds. Não contém credenciais e não representa estado real de integração.

Credenciais dos provedores devem existir somente no ambiente backend/secret manager. Nomes possíveis para organização interna incluem IDs/client IDs públicos e referências de secrets, mas nenhum valor privado deve entrar em `.env` versionado, frontend ou GitHub Pages.

## Critério para exibir “Conectado”

A UI só exibe `connected` quando `GET /v1/integrations` retornar esse estado após validação server-side da credencial/conta. Falta de API, resposta inválida, token expirado não renovável, permissão insuficiente ou health check falho não podem ser mascarados como conexão ativa.

No provider Meta, o estado principal pertence ao provider. Estados de Facebook, Instagram, Messenger e Meta Ads representam apenas produtos/ativos vinculados e não podem ser tratados como novas integrações. Mesmo com `connected`, cada funcionalidade deve verificar as permissões/scopes e capacidades efetivamente autorizadas no nível correto do provider, produto e ativo.