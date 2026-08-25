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
- `/crm/atendimentos` — VisaChat;
- `/crm/tarefas` — tarefas;
- `/crm/agenda` — agenda;
- `/crm/financeiro/*` — transações, invoices e contabilidade;
- `/crm/categorias-financeiras` — categorias financeiras da sessão;
- `/crm/regras-financeiras` — regras de classificação financeira da sessão;
- `/crm/marketing/*` — marketing;
- `/crm/relatorios` — templates e validação CSV; importação persistente/exportação de dados permanecem indisponíveis sem uma fonte compartilhada persistente;
- `/crm/configuracoes` — configurações.

A navegação lateral do CRM é compartilhada por todos os módulos internos. Rotas e módulos internos são carregados sob demanda para não aumentar desnecessariamente o bundle inicial do site público.

## Autenticação e dados

A autenticação está explicitamente desativada (`AUTHENTICATION_ENABLED = false`) enquanto não existir um provedor real. Não deve ser substituída por validação de credenciais apenas no navegador.

Fixtures `*.dev.json` são permitidos somente por providers de desenvolvimento, passam por validação runtime e só são carregados quando `import.meta.env.DEV` e `VITE_CRM_MOCKS=true`. Builds publicados não devem habilitar mocks.

O CMS utiliza armazenamento local para draft/publicação enquanto não existe persistência remota. Os dados recuperados são validados antes do uso.

A importação OFX funciona no frontend e adiciona transações à sessão atual. Movimentações válidas passam pelas regras financeiras configuradas na sessão; regras incompatíveis ou categorias órfãs não são aplicadas.

## Fonte canônica dos domínios

- relacionamento: `modules/crm/types.ts`;
- transações financeiras: `modules/finance/types.ts`;
- categorias e regras financeiras da sessão: `modules/finance/financeConfigStore.ts`;
- contabilidade: derivada exclusivamente das transações canônicas recebidas/pagas;
- fixtures: providers em `mocks/*Provider.ts`, nunca importados diretamente pela UI.

Invoices mantêm um modelo próprio do documento fiscal/faturamento e não são somadas novamente na Contabilidade, evitando dupla contagem com Transações. Somente pagamentos liquidados entram em `paid` e alteram o status financeiro da invoice.

## Desenvolvimento

```bash
npm ci
VITE_CRM_MOCKS=true npm run dev
```

Sem `VITE_CRM_MOCKS=true`, os módulos que dependem de fixtures iniciam sem dados demonstrativos.

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

Consulte `docs/ARCHITECTURE.md` para limites de responsabilidade, contratos e critérios de evolução.
