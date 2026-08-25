# Arquitetura técnica

## Escopo do repositório

O projeto Visa Fácil é atualmente uma aplicação **frontend-only** construída com React, TypeScript e Vite. Este repositório não contém backend, banco de dados, migrations, jobs, filas, workers, controllers, repositories ou APIs server-side.

Essa ausência é um limite arquitetural explícito: nenhuma tela deve representar autenticação, autorização, integração externa, persistência remota ou automação como funcional quando não existe uma implementação real para sustentá-la.

## Composição da aplicação

`RootApplication.tsx` é o ponto canônico de roteamento. O site público é carregado diretamente; workspaces internos usam `React.lazy` e `Suspense` para manter o bundle público separado dos módulos administrativos.

O CRM possui uma única navegação global em `components/CrmSidebar.tsx`. Módulos internos não devem implementar sidebars concorrentes.

### Chrome interno e carregamento global

`components/AccountMenu.tsx` é o único menu de conta visível dos ambientes internos. `RootApplication.tsx` o compõe sobre CRM, seletor de workspaces e CMS usando a mesma estrutura, dimensões, tipografia, ícones, opções e comportamento. Implementações locais antigas de identidade/conta não podem competir visualmente com esse contrato. A ação **Sair** somente é exposta quando `AUTHENTICATION_ENABLED` estiver realmente habilitado; com autenticação desativada, o menu informa esse estado sem simular logout.

`components/GlobalRouteLoader.tsx` é o único fallback de `Suspense` para rotas e módulos internos lazy. O loader ocupa o viewport inteiro, centraliza a marca oficial do Visa Fácil e uma barra de progresso indeterminada, mantém responsividade e respeita `prefers-reduced-motion`. Loaders posicionados dentro de conteúdo, sidebars ou módulos não devem substituir esse contrato global.

Principais domínios:

- `modules/public-site` — website institucional;
- `modules/site-cms` — edição e publicação local do conteúdo do site;
- `modules/crm` — relacionamento e dashboard;
- `modules/attendance` — VisaChat/atendimentos;
- `modules/tasks` — tarefas;
- `modules/agenda` — agenda;
- `modules/finance` — transações, invoices, categorias, regras e contabilidade;
- `modules/marketing` — marketing;
- `modules/reports` — templates e validação de contratos CSV; importação persistente e exportação de dados permanecem indisponíveis sem uma fonte compartilhada persistente;
- `modules/settings` — configurações compatíveis com o escopo frontend atual;
- `modules/auth` — contrato de autenticação, atualmente desativado.

## Modelos e fontes de verdade

### Estado operacional da sessão

`shared/sessionRecords.ts` é a infraestrutura genérica de registros persistidos apenas durante a sessão atual do navegador. Toda leitura valida os registros em runtime e exige IDs únicos. JSON corrompido, registros incompatíveis ou IDs duplicados são rejeitados como conjunto e substituídos pelo fallback validado do domínio. Toda gravação passa pela mesma validação antes de atingir `sessionStorage`.

`shared/operationalSessionStore.ts` centraliza os domínios que alimentam diretamente o Dashboard: Relacionamento, Tarefas, Agenda, Transações e VisaChat. Invoices utiliza `modules/finance/invoiceSessionStore.ts`, pois precisa validar também total, ledger de pagamentos e estados de liquidação. Marketing utiliza `modules/marketing/marketingSessionStore.ts`, que valida os modelos ricos de campanhas e conteúdos e converte fixtures apenas na fronteira de seed.

Os providers `*.dev.json` continuam sendo apenas fontes de seed para desenvolvimento. Componentes mutáveis não devem lê-los diretamente: eles consomem a fonte canônica de sessão do respectivo domínio. Isso evita que alterações desapareçam ao trocar de rota e evita que Dashboard, Invoices ou subrotas de Marketing trabalhem sobre snapshots independentes.

Essa camada **não é persistência remota**. Uma nova sessão do navegador ou outro dispositivo não compartilha dados.

### Relacionamento

`modules/crm/types.ts` define o modelo canônico de registros de relacionamento. Providers de fixtures dependem desse modelo; componentes não devem criar uma definição concorrente para a mesma entidade.

### Financeiro

`modules/finance/types.ts` define a transação canônica. A Contabilidade é uma projeção das Transações e deve derivar seus números somente de transações com estados financeiros aplicáveis.

`modules/finance/financeConfigStore.ts` é a fonte canônica, limitada à sessão do navegador, para categorias e regras financeiras. Renomeações e exclusões de categorias mantêm integridade das referências das regras; regras incompatíveis ou órfãs não são aceitas.

Transações são mantidas na fonte operacional compartilhada da sessão. A tela consulta categorias ativas no momento do uso, em vez de congelar uma lista no carregamento do módulo.

Invoices representam documentos de faturamento/fiscais. Elas podem referenciar valores e pagamentos, mas não constituem uma segunda fonte de receita para Contabilidade; isso evita dupla contagem. Somente pagamentos com liquidação `Liquidado` alteram `paid`. `Pago` e `Parcialmente pago` são derivados do total e do ledger; `Vencida` é derivado do vencimento. O formulário não pode reduzir o total para abaixo do valor já liquidado. O store de sessão rejeita pagamentos duplicados, ledger incompatível, `paid` superior ao total e estados financeiros incoerentes.

### Marketing

Campanhas e conteúdos persistem durante a sessão por `marketingSessionStore.ts`. Os modelos ricos usados pela UI são validados em runtime antes da gravação e após a leitura. Fixtures são convertidos uma única vez por funções tipadas; a UI não recria contratos `Raw*`, não fabrica IDs para seeds inválidos e não depende de casts permissivos.

Rascunhos de campanha podem permanecer incompletos no nível comercial, mas precisam preservar integridade estrutural de datas e valores. Uma campanha finalizada exige nome, orçamento positivo e ao menos uma plataforma de mídia paga. Finalizar uma campanha local não simula ativação em plataforma externa: um novo rascunho finalizado passa a `Agendada`, não a `Ativa`.

### Fixtures de desenvolvimento

Arquivos `*.dev.json` são dados de demonstração, não persistência. Eles devem ser acessados somente por providers governados por `shared/runtimeFlags.ts` e validados em runtime antes de serem entregues à fonte de sessão.

Regra obrigatória:

```text
import.meta.env.DEV === true
AND
VITE_CRM_MOCKS === "true"
```

Builds publicados não devem habilitar fixtures.

## Autenticação, autorização e segurança

`AUTHENTICATION_ENABLED` permanece `false` até existir um provedor de autenticação real. Validação de e-mail/senha executada apenas no navegador não constitui autenticação.

Enquanto a autenticação estiver desativada, o ambiente interno é acessível para desenvolvimento/demonstração e não deve ser tratado como fronteira de segurança para dados reais.

Permissões e papéis exibidos no frontend não representam enforcement server-side. Não armazenar segredos, tokens privados, credenciais ou dados sensíveis reais em código, fixtures, localStorage ou variáveis `VITE_*`, pois estas são incorporadas ao bundle cliente.

Conteúdo do CMS recuperado de armazenamento local deve passar por validação antes de ser aceito. Renderização com `dangerouslySetInnerHTML` e iframes não autorizados é bloqueada pelo lint estrutural.

Uploads e arquivos importados devem validar formato/tamanho e nunca ser interpretados como HTML executável.

## OFX

`modules/finance/ofx.ts` é o parser canônico de OFX no frontend. Ele:

- limita o arquivo a 5 MB;
- exige extensão `.ofx` na interface de importação;
- extrai movimentações `STMTTRN`;
- valida datas e valores;
- rejeita movimentações inválidas e IDs duplicados;
- normaliza entradas para `Receita/Recebido`;
- normaliza saídas para `Despesa/Pago`;
- grava pagamento `OFX`;
- passa cada movimentação válida pelo motor de regras financeiras da sessão;
- mantém somente categorias ativas e compatíveis com o tipo da movimentação, usando fallback canônico quando nenhuma regra compatível se aplica.

A importação modifica o estado financeiro da sessão atual. Não há conciliação bancária persistente, sincronização remota ou banco de dados neste repositório.

## CMS

O CMS mantém draft e publicação no armazenamento local enquanto não existe uma API de conteúdo. Essa persistência é válida apenas para o navegador atual e não deve ser descrita como banco de dados ou sincronização multiusuário.

Documentos recuperados do armazenamento são validados em profundidade: versão, páginas, status, SEO, seções, valores, repeaters, mídia, tipos de mídia e unicidade de identificadores. Documento inválido não deve ser aceito silenciosamente.

## Integrações externas

WhatsApp, e-mail, assinatura eletrônica, nota fiscal, plataformas de anúncios e calendários somente podem ser marcados como conectados quando houver adapter/API e credenciais reais fora do bundle cliente.

Não implementar fallbacks que simulem sucesso de integração.

## Relatórios

Templates CSV e validação estrutural de CSV são funcionalidades reais do frontend. A validação verifica formato, tamanho, cabeçalho e campos esperados.

Importação persistente e exportação dos dados operacionais permanecem desabilitadas enquanto os domínios não possuírem uma fonte compartilhada persistente adequada para integração de arquivos. A continuidade em `sessionStorage` resolve navegação durante a sessão, mas não é banco de dados nem contrato de importação/exportação durável.

Uma ação chamada XLSX não pode gerar TXT/CSV. Importações devem validar e realmente processar os dados ou permanecer indisponíveis com explicação clara.

## Qualidade e validação

O comando canônico é:

```bash
npm run check
```

Ele executa:

1. validação do contrato arquitetural;
2. lint estrutural;
3. testes automatizados;
4. auditoria de vulnerabilidades npm de severidade alta ou crítica;
5. TypeScript;
6. build de produção.

O workflow CI acrescenta smoke runtime após o build. O deploy do Pages repete os gates antes da publicação.

### Lint estrutural

`scripts/lint-source.mjs` protege decisões arquiteturais que não são cobertas pelo compilador, incluindo `any` explícito, imports diretos de fixtures, casts não validados de fixtures, sidebars concorrentes, mocks de produção, regressão do gate de dependências, controles de cabeçalho inertes, estilos corretivos obsoletos, bypass das fontes canônicas de sessão de Relacionamento, Tarefas, Agenda, Transações, VisaChat, Invoices e Marketing, além da propriedade global do Account Menu e do loader de lazy routes.

### Testes

`scripts/tests` valida contratos dos fixtures, integridade financeira, configuração de categorias/regras, armazenamento CMS, armazenamento operacional de sessão e comportamentos que possuem lógica isolável, como o parser OFX. Testes não devem cristalizar implementações legadas apenas porque elas existiam anteriormente; devem proteger o contrato canônico atual.

## Critérios para novas features

Uma feature só deve ser considerada integrada quando:

- existe uma única fonte de verdade para seu domínio;
- tipos, fixtures, UI e regras usam o mesmo contrato;
- estados vazios e falhas são explícitos;
- não depende de mocks para funcionar em produção;
- não declara sucesso de operação que não ocorreu;
- não cria uma segunda navegação, modelo ou regra concorrente;
- possui teste quando introduz transformação de dados ou regra de negócio relevante;
- passa `npm run check` e smoke runtime;
- documentação é atualizada quando a arquitetura/contrato muda.

## Limites para futura camada backend

Quando backend e banco forem introduzidos, eles devem ser adicionados como arquitetura explícita, não inferidos a partir das telas atuais. A implementação deverá definir, no mínimo:

- autenticação e sessões server-side;
- autorização e RBAC aplicados no servidor;
- schemas persistentes e migrations;
- validação de entrada e saída;
- contratos de API versionáveis;
- services/repositories quando houver responsabilidade real para essas camadas;
- integridade referencial e constraints;
- observabilidade e tratamento de erros;
- adapters reais para integrações externas;
- estratégia de migração dos estados locais existentes.

Até que isso exista, o frontend deve continuar deixando seus limites explícitos.
