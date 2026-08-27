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
- `/crm/contratos` — gestão contratual frontend com contratos, templates, variáveis, versões e histórico da sessão;
- `/crm/contratos/templates` — templates, que também são a classificação canônica dos contratos;
- `/crm/contratos/variaveis` — registro canônico de placeholders;
- `/crm/financeiro/*` — transações, invoices e contabilidade;
- `/crm/categorias-financeiras` — categorias financeiras da sessão;
- `/crm/regras-financeiras` — regras de classificação financeira da sessão;
- `/crm/marketing/*` — marketing;
- `/crm/relatorios` — importação/exportação exclusivamente XLSX, com schemas completos equivalentes aos campos visíveis dos respectivos modais e persistência restrita à sessão atual do navegador;
- `/crm/perfil` — perfil/identidade do ambiente atual;
- `/crm/configuracoes` — configurações e estado real das integrações.

A navegação lateral do CRM é compartilhada por todos os módulos internos. Rotas e módulos internos são carregados sob demanda para não aumentar desnecessariamente o bundle inicial do site público.

## Backend e integrações

O frontend possui uma fronteira única em `shared/apiClient.ts`. A configuração pública opcional `VITE_API_BASE_URL` aponta para a futura API backend. Nenhuma credencial de provedor deve ser colocada em variável `VITE_*`, pois esse conteúdo é público no bundle.

`modules/integrations/integrationContract.ts` é o registro canônico das integrações configuráveis pelo frontend: WhatsApp, Autentique, NFS-e, Instagram, Facebook, YouTube, TikTok, Google Ads e Google Calendar. `modules/integrations/integrationApi.ts` define o contrato frontend para consultar estado, conectar, reconectar, desconectar e sincronizar. A interface só pode mostrar `connected` quando a API backend confirmar esse estado. Resend é um provedor interno/server-side e não pertence ao registry nem à interface de configuração do navegador.

Instagram, Facebook, YouTube, TikTok e WhatsApp exigem autorização pela interface oficial do respectivo provedor. O frontend não deve solicitar, reproduzir ou armazenar senha, access token, refresh token ou client secret dessas contas. A futura API backend deverá iniciar o fluxo oficial, trocar o código de autorização por tokens, armazená-los com segurança e retornar ao navegador apenas metadados não secretos sobre a conexão, conta, permissões e capacidades autorizadas.

O formulário público usa `POST /v1/public/leads` quando `VITE_API_BASE_URL` está configurado. Sem backend, o envio fica explicitamente indisponível e não simula sucesso.

Contratos possui fluxo funcional de frontend, templates e versionamento local, mas **não simula assinatura eletrônica**. Autentique é o único provedor de assinatura previsto; o envio real só poderá ser habilitado quando o contrato estiver persistido no backend e a integração estiver realmente conectada.

A implementação server-side, OAuth, tokens, webhooks, workers e credenciais ainda não existe neste repositório. Consulte `docs/INTEGRATIONS.md`, `docs/CONTRACTS.md` e `docs/PRODUCTION_READINESS.md`.

## Autenticação e dados

A autenticação está explicitamente desativada (`AUTHENTICATION_ENABLED = false`) enquanto não existir um provedor real. Não deve ser substituída por validação de credenciais apenas no navegador.

Fixtures `*.dev.json` são dados demonstrativos centralizados, acessados somente por providers de domínio e validados antes de inicializar o estado local. No protótipo atual, os mocks ficam habilitados por padrão — inclusive no build do GitHub Pages — para que a interface abra com dados representativos. Defina `VITE_CRM_MOCKS=false` para desabilitar todos os datasets centralizados. Esse mecanismo não pode fabricar autenticação, autorização, conexão de integração, assinatura eletrônica, persistência remota ou qualquer sucesso externo inexistente.

Relacionamento, Tarefas, Agenda, Transações e VisaChat compartilham a fonte operacional validada em `shared/operationalSessionStore.ts`. Tarefas e Agenda preservam vínculos com registros do CRM por IDs canônicos (`relatedRecordId`) e responsáveis por IDs de usuários ativos (`ownerUserId`), mantendo nomes apenas como representação legível/compatibilidade de registros legados. Transações financeiras também preservam o vínculo com contato/cliente por `relatedRecordId`. Invoices usa `modules/finance/invoiceSessionStore.ts` para validar também ledger, total e estados de liquidação. Marketing usa `modules/marketing/marketingSessionStore.ts` para campanhas e conteúdos. Contratos usa `modules/contracts/contractSessionStore.ts` com validadores próprios para contratos, templates e variáveis. Todas essas fontes operacionais permanecem locais ao navegador; não constituem banco de dados ou sincronização multiusuário.

O CMS utiliza armazenamento local para draft/publicação enquanto não existe persistência remota. Os dados recuperados são validados antes do uso.

A importação OFX funciona no frontend e adiciona transações à sessão atual. Movimentações válidas passam pelas regras financeiras configuradas na sessão; regras incompatíveis ou categorias órfãs não são aplicadas.

Relatórios opera exclusivamente com arquivos `.xlsx`. Os datasets operacionais e de configuração usam exatamente os campos visíveis dos modais correspondentes; IDs técnicos não são expostos como colunas artificiais. Quando um campo visível representa um relacionamento — por exemplo responsável, contato, lead ou cliente — a importação resolve o valor para o ID canônico antes de persistir e rejeita correspondências ausentes ou ambíguas em vez de criar vínculos soltos por texto.

## Fonte canônica dos domínios

- relacionamento: `modules/crm/types.ts`;
- infraestrutura de registros da sessão: `shared/sessionRecords.ts`;
- estado operacional de CRM/Tarefas/Agenda/Transações/VisaChat: `shared/operationalSessionStore.ts`;
- invoices da sessão: `modules/finance/invoiceSessionStore.ts`;
- campanhas e conteúdos de Marketing: `modules/marketing/marketingSessionStore.ts`;
- contratos: `modules/contracts/contractTypes.ts`;
- estado contratual da sessão: `modules/contracts/contractSessionStore.ts`;
- templates/variáveis de Contratos: `modules/contracts/contractTemplateEngine.ts`;
- transações financeiras: `modules/finance/types.ts`;
- categorias e regras financeiras da sessão: `modules/finance/financeConfigStore.ts`;
- integrações: `modules/integrations/integrationContract.ts`;
- chamadas ao backend: `shared/apiClient.ts`;
- contabilidade: derivada exclusivamente das transações canônicas recebidas/pagas;
- fixtures: providers em `mocks/*Provider.ts`, usados apenas como seeds validados e nunca importados diretamente pela UI mutável.

Invoices mantêm um modelo próprio do documento fiscal/faturamento e não são somadas novamente na Contabilidade, evitando dupla contagem com Transações. Somente pagamentos `Liquidado` entram em `paid`; `Pago` e `Parcialmente pago` são derivados do ledger, e o total não pode ser reduzido abaixo do valor já liquidado.

Contratos possuem registros operacionais demonstrativos centralizados e validados para exercitar o fluxo do protótipo, além de templates e variáveis de configuração. Esses registros são apenas seeds locais e não representam contratos reais nem conclusão de assinatura externa: os fixtures permanecem com `signatureProvider = null` e `signatureState = not_sent`. O **Template é simultaneamente o modelo documental e a classificação canônica do contrato**; não existe uma entidade paralela de Categoria. O wizard segue `Template → Partes → Variáveis → Documento → Signatários → Revisão`; contratos vinculados ao CRM preservam um snapshot dos dados usados no documento, e alterações no template não reescrevem silenciosamente versões existentes.

## Desenvolvimento

```bash
npm ci
npm run dev
```

O protótipo abre com os datasets centralizados habilitados por padrão. Para iniciar os módulos sem esses seeds demonstrativos, use `VITE_CRM_MOCKS=false npm run dev`.

Para testar o frontend contra uma API backend local/configurada, defina também `VITE_API_BASE_URL` com uma URL pública apropriada ao navegador. Não coloque segredos em variáveis `VITE_*`.

Registros criados durante o uso continuam restritos à sessão atual do navegador, independentemente de os seeds demonstrativos estarem habilitados ou não.

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

Consulte `docs/ARCHITECTURE.md`, `docs/INTEGRATIONS.md`, `docs/CONTRACTS.md` e `docs/PRODUCTION_READINESS.md` para limites de responsabilidade, contratos e critérios de evolução.