# Visa Fácil

Aplicação web da Visa Fácil em React + Vite. O repositório contém o site institucional, o CMS frontend e os workspaces internos do CRM.

## Arquitetura atual

Este repositório é **frontend-only**. Não há backend, banco de dados, migrations, controllers, repositories, filas, workers ou APIs server-side implementados aqui. Funcionalidades que dependem dessas camadas não devem simular persistência, autenticação, autorização ou integrações reais.

Principais áreas:

- `/` — site público;
- `/preview` — prévia do conteúdo do site;
- `/workspaces` — seletor dos workspaces internos;
- `/site-admin` — CMS frontend;
- `/crm` — dashboard do CRM;
- `/crm/relacionamento` — contatos/leads;
- `/crm/agenda` — agenda;
- `/crm/tarefas` — tarefas;
- `/crm/atendimentos` — VisaChat;
- `/crm/contratos` — shell arquitetural do futuro módulo Contratos; lógica definitiva aguarda arquivo de referência;
- `/crm/financeiro/*` — transações, invoices e contabilidade;
- `/crm/categorias-financeiras` — categorias financeiras da sessão;
- `/crm/regras-financeiras` — regras de classificação financeira da sessão;
- `/crm/marketing/*` — marketing;
- `/crm/relatorios` — templates e validação CSV; importação persistente/exportação de dados permanecem indisponíveis sem uma fonte durável compartilhada;
- `/crm/perfil` — perfil/identidade do ambiente atual;
- `/crm/configuracoes` — configurações e estado real das integrações.

A navegação lateral do CRM é compartilhada por todos os módulos internos. Rotas e módulos internos são carregados sob demanda para não aumentar desnecessariamente o bundle inicial do site público.

## Backend e integrações

O frontend possui uma fronteira única em `shared/apiClient.ts`. A configuração pública opcional `VITE_API_BASE_URL` aponta para a futura API backend. Nenhuma credencial de provedor deve ser colocada em variável `VITE_*`, pois esse conteúdo é público no bundle.

`modules/integrations/integrationContract.ts` é o registro canônico das integrações previstas: WhatsApp, Resend, Autentique, NFS-e, Instagram, Facebook, YouTube, TikTok, Google Ads e Google Calendar. `modules/integrations/integrationApi.ts` define o contrato frontend para consultar estado, conectar, desconectar e sincronizar. A interface só pode mostrar `connected` quando a API backend confirmar esse estado.

O formulário público usa `POST /v1/public/leads` quando `VITE_API_BASE_URL` está configurado. Sem backend, o envio fica explicitamente indisponível e não simula sucesso.

A implementação server-side, OAuth, tokens, webhooks, workers e credenciais ainda não existe neste repositório. Consulte `docs/INTEGRATIONS.md` e `docs/PRODUCTION_READINESS.md`.

## Autenticação e dados

A autenticação está explicitamente desativada (`AUTHENTICATION_ENABLED = false`) enquanto não existir um provedor real. Não deve ser substituída por validação de credenciais apenas no navegador.

Fixtures `*.dev.json` são permitidos somente por providers de desenvolvimento, passam por validação runtime e só são carregados quando `import.meta.env.DEV` e `VITE_CRM_MOCKS=true`. Builds publicados não devem habilitar mocks.

Relacionamento, Tarefas, Agenda, Transações e VisaChat compartilham a fonte operacional validada em `shared/operationalSessionStore.ts`. Invoices usa `modules/finance/invoiceSessionStore.ts` para validar também ledger, total e estados de liquidação. Marketing usa `modules/marketing/marketingSessionStore.ts` para campanhas e conteúdos. Todas essas fontes usam `sessionStorage`: preservam alterações entre rotas na sessão atual, mas não constituem banco de dados ou sincronização remota.

O CMS utiliza armazenamento local para draft/publicação enquanto não existe persistência remota. Os dados recuperados são validados antes do uso.

A importação OFX funciona no frontend e adiciona transações à sessão atual. Movimentações válidas passam pelas regras financeiras configuradas na sessão; regras incompatíveis ou categorias órfãs não são aplicadas.

## Fonte canônica dos domínios

- relacionamento: `modules/crm/types.ts`;
- infraestrutura de registros da sessão: `shared/sessionRecords.ts`;
- estado operacional de CRM/Tarefas/Agenda/Transações/VisaChat: `shared/operationalSessionStore.ts`;
- invoices da sessão: `modules/finance/invoiceSessionStore.ts`;
- campanhas e conteúdos de Marketing: `modules/marketing/marketingSessionStore.ts`;
- transações financeiras: `modules/finance/types.ts`;
- categorias e regras financeiras da sessão: `modules/finance/financeConfigStore.ts`;
- integrações: `modules/integrations/integrationContract.ts`;
- chamadas ao backend: `shared/apiClient.ts`;
- contabilidade: derivada exclusivamente das transações canônicas recebidas/pagas;
- fixtures: providers em `mocks/*Provider.ts`, usados apenas como seeds validados e nunca importados diretamente pela UI mutável.

Invoices mantêm um modelo próprio do documento fiscal/faturamento e não são somadas novamente na Contabilidade, evitando dupla contagem com Transações. Somente pagamentos `Liquidado` entram em `paid`; `Pago` e `Parcialmente pago` são derivados do ledger, e o total não pode ser reduzido abaixo do valor já liquidado.

## Desenvolvimento

```bash
npm ci
VITE_CRM_MOCKS=true npm run dev
```

Para testar o frontend contra uma API backend local/configurada, defina também `VITE_API_BASE_URL` com uma URL pública apropriada ao navegador. Não coloque segredos em variáveis `VITE_*`.

Sem `VITE_CRM_MOCKS=true`, os módulos que dependem de fixtures iniciam sem dados demonstrativos; registros criados durante o uso continuam restritos à sessão atual do navegador.

## Validação obrigatória

```bash
npm run validate
npm run lint
npm test
npm run audit
npm run typecheck
npm run build
```

Ou execute tudo de uma vez:

```bash
npm run check
```

O CI executa contrato arquitetural, lint estrutural, testes, auditoria de dependências, TypeScript, build de produção e smoke runtime. O deploy do GitHub Pages repete os gates relevantes antes de publicar.

Consulte `docs/ARCHITECTURE.md`, `docs/INTEGRATIONS.md` e `docs/PRODUCTION_READINESS.md` para limites de responsabilidade, contratos e critérios de evolução.
