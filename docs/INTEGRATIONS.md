# Arquitetura de Integrações

## Princípio de segurança

O frontend Visa Fácil não deve receber, armazenar nem enviar diretamente credenciais privadas de provedores. `VITE_*` é configuração pública incorporada ao bundle do navegador e serve apenas para valores públicos como `VITE_API_BASE_URL`.

A ativação real das integrações exige uma API backend separada com armazenamento seguro de credenciais/tokens, autorização server-side, callbacks OAuth, webhooks, workers de sincronização, observabilidade e persistência.

## Contrato frontend ↔ backend

O frontend já está preparado para consumir:

- `GET /v1/integrations` — estados reais de conexão;
- `POST /v1/integrations/:provider/connect` — iniciar conexão/OAuth ou configuração server-side;
- `POST /v1/integrations/:provider/disconnect` — revogar/desconectar;
- `POST /v1/integrations/:provider/sync` — solicitar sincronização manual idempotente;
- `POST /v1/public/leads` — entrada segura do formulário público.

Estados canônicos: `unconfigured`, `disconnected`, `connecting`, `connected`, `degraded`, `error`.

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

- `MessagingProvider` — WhatsApp, Messenger/Instagram quando permitido;
- `TransactionalEmailProvider` — Resend;
- `DocumentSignatureProvider` — Autentique;
- `FiscalDocumentProvider` — NFS-e;
- `SocialContentProvider` — Instagram, Facebook, YouTube, TikTok;
- `AdsProvider` — Meta Ads, Google Ads, TikTok Ads/YouTube Ads conforme APIs habilitadas;
- `CalendarProvider` — Google Calendar.

A camada de aplicação trabalha com interfaces canônicas; SDK/API específica fica confinada ao adapter.

## Provedores

### WhatsApp

Objetivo: trazer conversas, contatos e mensagens para VisaChat e permitir envio autorizado pelo backend.

Configuração externa prevista: Meta App, WhatsApp Business Account (WABA), Phone Number ID, credencial server-side aprovada, webhook HTTPS e token de verificação. Permissões/scopes precisam ser confirmados conforme o modelo de onboarding da Meta e App Review vigente.

Regras: mapear mensagem externa para ID canônico, deduplicar por message ID, manter status de entrega/leitura e impedir duplicação ao receber echo/webhook.

### Resend

Objetivo: e-mail transacional e notificações.

Configuração externa: conta Resend, domínio/remetente verificado, API key server-side e segredo de assinatura de webhook.

Regras: armazenar provider message ID; processar delivered/bounced/complained etc. de forma idempotente; separar templates/conteúdo da credencial.

### Autentique

Objetivo: criar, enviar, acompanhar e assinar contratos/documentos.

Configuração externa: conta, token de API, organization ID quando aplicável e configuração de webhook/assinatura disponível no provedor.

O adapter deve mapear documento, signatários, status e eventos para o modelo canônico do futuro módulo Contratos. A definição desse modelo aguarda o arquivo de referência do módulo.

### NFS-e / Nota Fiscal de Serviço

Objetivo: emissão, consulta, cancelamento e acompanhamento de NFS-e.

NFS-e varia por município/provedor e pelo padrão nacional. O backend deve usar `FiscalDocumentProvider`, nunca acoplar a UI a um município específico.

Configuração externa prevista: CNPJ, inscrição municipal, códigos de serviço/tributação, regime/dados fiscais, seleção do provedor/município, ambiente de homologação/produção e certificado digital quando exigido. Certificado e senha ficam em secret manager/KMS, nunca no browser.

### Instagram

Objetivo: conteúdo, métricas, mensagens quando a API/conta/permissão suportar e integração publicitária via ecossistema Meta.

Configuração externa: Meta App, conta profissional do Instagram, assets empresariais exigidos, redirect URI, webhook e aprovação das permissões necessárias. Conta de anúncios é exigida para operações publicitárias. Scopes exatos devem ser validados contra a API/versão e App Review no momento do onboarding.

### Facebook

Objetivo: Messenger, conteúdo de páginas e publicidade quando permitido.

Configuração externa: Meta App, Facebook Page, Business assets/Ad Account quando aplicável, redirect URI, webhook e permissões aprovadas no App Review. O adapter Meta deve ser compartilhado com Instagram quando fizer sentido sem fundir contratos de domínio distintos.

### YouTube

Objetivo: leitura do canal, upload/gestão de conteúdo e métricas autorizadas. Publicidade deve usar o adapter de Google Ads quando a operação for de anúncios.

Configuração externa: Google Cloud Project, YouTube Data API habilitada, OAuth client ID/secret server-side, redirect URI e canal autorizado. Scopes mínimos devem ser incrementais, por exemplo `youtube.readonly` para leitura e `youtube.upload` para envio quando necessário.

### TikTok

Objetivo: conteúdo e, separadamente, publicidade quando a conta/API permitir.

Configuração externa: TikTok Developer App, client key/secret, redirect URI e scopes aprovados. Publicação direta requer permissões/auditoria do app conforme regras vigentes. Operações publicitárias dependem de acesso ao TikTok for Business/Marketing API e advertiser ID, não apenas do login de conteúdo.

### Google Ads

Objetivo: criar, configurar e consultar campanhas/métricas.

Configuração externa: Google Cloud OAuth client, client secret server-side, developer token, customer ID alvo e login customer ID quando a conta for acessada por um Manager Account. O scope é `https://www.googleapis.com/auth/adwords`. Refresh token/credenciais ficam server-side.

### Google Calendar

Objetivo: sincronização bidirecional de eventos quando tecnicamente apropriado.

Configuração externa: Google Cloud Project, Calendar API habilitada, OAuth client ID/secret, redirect URI e webhook HTTPS para notificações push. Scope inicial previsto: `https://www.googleapis.com/auth/calendar.events`.

O backend deve persistir IDs do evento local/remoto, ETag/updated timestamp, sync token quando disponível, channel/resource IDs de push e expiração dos canais para renovação automática.

## Variáveis e secret management

Frontend público:

- `VITE_API_BASE_URL` — único endereço público da API backend;
- `VITE_CRM_MOCKS` — apenas desenvolvimento local, já protegido pelos gates.

Credenciais dos provedores devem existir somente no ambiente backend/secret manager. Nomes possíveis para organização interna incluem IDs/client IDs públicos e referências de secrets, mas nenhum valor privado deve entrar em `.env` versionado, frontend ou GitHub Pages.

## Critério para exibir “Conectado”

A UI só exibe `connected` quando `GET /v1/integrations` retornar esse estado após validação server-side da credencial/conta. Falta de API, resposta inválida, token expirado não renovável, permissão insuficiente ou health check falho não podem ser mascarados como conexão ativa.
