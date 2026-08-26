# Arquitetura técnica

## Escopo do repositório

O projeto Visa Fácil é atualmente uma aplicação **frontend-only** construída com React, TypeScript e Vite. Este repositório não contém backend, banco de dados, migrations, jobs, filas, workers, controllers, repositories ou APIs server-side.

Essa ausência é um limite arquitetural explícito: nenhuma tela deve representar autenticação, autorização, integração externa, persistência remota ou automação como funcional quando não existe uma implementação real para sustentá-la.

## Composição da aplicação

`RootApplication.tsx` é o ponto canônico de roteamento. O site público é carregado diretamente; workspaces internos usam `React.lazy` e `Suspense` para manter o bundle público separado dos módulos administrativos.

O CRM possui uma única navegação global em `components/CrmSidebar.tsx`. A ordem canônica é Dashboard → CRM → Agenda → Tarefas → VisaChat → Contratos → Financeiro → Marketing → Relatórios → Configurações.

### Chrome interno e carregamento global

`components/AccountMenu.tsx` é o único menu de conta dos ambientes internos. `RootApplication.tsx` o compõe sobre CRM, seletor de workspaces e CMS. O menu canônico contém Perfil, Configurações e Logout. Logout sempre limpa qualquer sessão residual; com autenticação desativada retorna ao seletor de workspaces e não simula uma autenticação funcional.

`components/GlobalRouteLoader.tsx` é o único fallback de `Suspense` para rotas e módulos internos lazy. O loader ocupa o viewport inteiro, centraliza a marca Visa Fácil e uma barra de progresso, mantém responsividade e respeita `prefers-reduced-motion`.

Principais domínios:

- `modules/public-site` — website institucional e captura pública de leads;
- `modules/site-cms` — edição e publicação local do conteúdo do site;
- `modules/crm` — relacionamento e dashboard;
- `modules/attendance` — VisaChat/atendimentos;
- `modules/tasks` — tarefas;
- `modules/agenda` — agenda;
- `modules/contracts` — shell do módulo Contratos; modelo funcional definitivo aguarda arquivo de referência;
- `modules/finance` — transações, invoices, categorias, regras e contabilidade;
- `modules/marketing` — marketing;
- `modules/integrations` — registro canônico e facade frontend das integrações;
- `modules/reports` — templates e validação CSV; importação/exportação persistente depende de backend;
- `modules/settings` — configurações e UI de estado real de integrações;
- `modules/auth` — contrato de autenticação, atualmente desativado.

## Fronteira frontend ↔ backend

`shared/apiClient.ts` é a única fronteira genérica para chamadas do navegador à futura API. O endereço público é configurado por `VITE_API_BASE_URL`. Variáveis `VITE_*` são públicas no bundle e não podem conter tokens, API keys, client secrets, senhas, certificados ou outros segredos.

`apiClient` exige respostas runtime-validáveis, usa sessão via cookie quando a futura API estiver disponível e converte falhas em `ApiClientError` estruturado. O frontend nunca acessa diretamente SDKs ou APIs privadas dos provedores.

O formulário público usa `modules/public-site/services/publicLeadService.ts` e `POST /v1/public/leads`. Sem backend configurado, o formulário permanece explicitamente indisponível; não existe fallback de sucesso demonstrativo.

## Integrações

`modules/integrations/integrationContract.ts` é o registro canônico dos provedores e capacidades. Ele inclui WhatsApp, Resend, Autentique, NFS-e, Instagram, Facebook, YouTube, TikTok, Google Ads e Google Calendar.

`modules/integrations/integrationApi.ts` define o contrato frontend:

- `GET /v1/integrations`;
- `POST /v1/integrations/:id/connect`;
- `POST /v1/integrations/:id/disconnect`;
- `POST /v1/integrations/:id/sync`.

A UI de Configurações consulta esses endpoints quando `VITE_API_BASE_URL` existe. Sem backend, todos os provedores ficam `unconfigured`. O navegador só mostra `connected` se o backend retornar esse estado após validar conta/credencial.

OAuth, armazenamento/renovação de tokens, callbacks, webhooks, idempotência, filas, retries, observabilidade e adapters externos são responsabilidades da futura camada backend. Consulte `docs/INTEGRATIONS.md`.

## Modelos e fontes de verdade

### Estado operacional da sessão

`shared/sessionRecords.ts` é a infraestrutura genérica de registros persistidos apenas durante a sessão atual do navegador. Toda leitura valida registros em runtime e exige IDs únicos. JSON corrompido, registros incompatíveis ou IDs duplicados são rejeitados como conjunto e substituídos pelo fallback validado.

`shared/operationalSessionStore.ts` centraliza os domínios que alimentam diretamente o Dashboard: Relacionamento, Tarefas, Agenda, Transações e VisaChat. Invoices utiliza `modules/finance/invoiceSessionStore.ts`. Marketing utiliza `modules/marketing/marketingSessionStore.ts`.

Providers `*.dev.json` são apenas seeds de desenvolvimento. Componentes mutáveis não devem lê-los diretamente.

Essa camada **não é persistência remota**. Uma nova sessão do navegador ou outro dispositivo não compartilha dados.

### Relacionamento

`modules/crm/types.ts` define o modelo canônico de registros de relacionamento. Providers dependem desse modelo; componentes não devem criar definição concorrente para a mesma entidade.

### Financeiro

`modules/finance/types.ts` define a transação canônica. Contabilidade é projeção das Transações e deriva números somente de transações com estados financeiros aplicáveis.

`modules/finance/financeConfigStore.ts` é a fonte canônica, limitada à sessão, para categorias e regras. Renomeações e exclusões mantêm integridade das referências.

Invoices representam documentos de faturamento locais, não uma segunda fonte de receita. Somente pagamentos `Liquidado` alteram `paid`; estados de pagamento são derivados do ledger/total/vencimento e o total não pode ficar abaixo do valor já liquidado.

NFS-e real não existe neste frontend. Emissão fiscal de produção depende do futuro `FiscalDocumentProvider` server-side.

### Marketing

Campanhas e conteúdos persistem durante a sessão por `marketingSessionStore.ts`. Os modelos ricos usados pela UI são validados em runtime. Fixtures são convertidos uma única vez pela fronteira de seed.

Finalizar uma campanha local não simula ativação em plataforma externa. Operações reais de mídia dependem dos adapters de integração.

### Contratos

`/crm/contratos` existe como módulo lazy e integrado ao sidebar, mas propositalmente não contém CRUD ou operações fictícias. Campos, estados, regras, documentos, signatários, timeline e experiência operacional serão definidos após análise do arquivo de referência que o usuário fornecerá.

A integração Autentique foi preparada no registro de integrações e deverá ser ligada ao modelo canônico de Contratos somente após esse contrato de domínio ser definido.

### Fixtures de desenvolvimento

Arquivos `*.dev.json` são dados de demonstração, não persistência. Só podem ser acessados por providers governados por `shared/runtimeFlags.ts` e quando:

```text
import.meta.env.DEV === true
AND
VITE_CRM_MOCKS === "true"
```

Builds publicados não devem habilitar fixtures.

## Autenticação, autorização e segurança

`AUTHENTICATION_ENABLED` permanece `false` até existir um provedor real. Validação de e-mail/senha no navegador não constitui autenticação.

Enquanto a autenticação estiver desativada, o ambiente interno é de desenvolvimento/demonstração e não deve ser usado como fronteira de segurança para dados reais.

Permissões/papéis do frontend não representam enforcement server-side. Não armazenar segredos, tokens, credenciais ou dados sensíveis reais em código, fixtures, localStorage, sessionStorage ou variáveis `VITE_*`.

Conteúdo CMS recuperado de armazenamento local passa por validação. `dangerouslySetInnerHTML`, iframes não autorizados e credenciais browser-exposed são protegidos por lint estrutural.

## OFX

`modules/finance/ofx.ts` é o parser canônico de OFX no frontend. Ele limita arquivo, valida extensão/conteúdo, extrai `STMTTRN`, normaliza datas/valores, rejeita duplicidades e aplica regras financeiras canônicas antes de incluir transações na sessão.

A importação não representa conciliação bancária persistente ou sincronização remota.

## CMS

O CMS mantém draft/publicação em armazenamento local enquanto não existe API de conteúdo. Documentos persistidos passam por validação de versão, páginas, status, SEO, seções, repeaters, mídia e IDs únicos.

## Relatórios

Templates CSV e validação estrutural são funções reais do frontend. Importação/exportação operacional persistente permanece indisponível até existir fonte de dados durável compartilhada.

## Qualidade e validação

O comando canônico é:

```bash
npm run check
```

Ele executa validação arquitetural, lint estrutural, testes automatizados, auditoria npm, TypeScript e build. CI acrescenta smoke runtime; Pages repete os gates antes da publicação.

`scripts/lint-source.mjs` protege, entre outros pontos: `any` explícito, fixtures fora de providers, sidebars concorrentes, bypass de stores canônicos, AccountMenu/loader globais, ordem do sidebar, ausência da rota Contratos, integração estática paralela, segredo em `VITE_*`, formulário público demonstrativo e regressão do contrato frontend de integrações.

`scripts/tests` cobre fixtures, financeiro, CMS, OFX, session stores e o registro canônico das integrações.

## Critérios para novas features

Uma feature só é integrada quando possui uma única fonte de verdade, contratos tipados/validados, estados de falha explícitos, nenhum sucesso simulado, nenhum mock de produção, teste para regra relevante, documentação correspondente e todos os gates verdes.

## Limites para futura camada backend

A implementação backend deverá definir explicitamente:

- autenticação/sessões e RBAC server-side;
- schemas persistentes, migrations, índices, constraints e backups;
- contratos de API versionáveis com validação de entrada/saída;
- idempotência, transações e integridade referencial;
- services/repositories somente quando houver responsabilidade real;
- observabilidade e tratamento de erros;
- secret management/KMS;
- OAuth/token lifecycle;
- webhooks, filas, retries e DLQ/replay;
- adapters reais para integrações externas;
- estratégia de migração dos estados locais existentes.

Consulte também `docs/INTEGRATIONS.md` e `docs/PRODUCTION_READINESS.md`.
