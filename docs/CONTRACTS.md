# Módulo Contratos

## Origem da implementação

O módulo foi materializado a partir do arquivo de referência fornecido para análise. A referência foi tratada como fonte de ideias de produto e experiência, não como código canônico a ser copiado.

Foram preservados os conceitos úteis ao Visa Fácil: gestão de contratos, templates reutilizáveis, registro de variáveis no formato `{{GRUPO.CAMPO}}`, criação guiada em seis etapas, vínculo com partes, prévia documental, signatários, versões e histórico.

Foram deliberadamente removidos conceitos incompatíveis com o domínio atual, incluindo estruturas específicas de música/licenciamento, entidades de artista/obra/lançamento, provedores de assinatura concorrentes como Clicksign/DocuSign, persistências locais paralelas e qualquer operação que simulasse backend, geração inteligente ou assinatura real.

## Rotas

As superfícies funcionais do módulo são:

- `/crm/contratos` — contratos;
- `/crm/contratos/templates` — templates;
- `/crm/contratos/variaveis` — registro de variáveis.

Não existe uma barra de abas interna para alternar entre essas superfícies. A navegação contextual é feita pelos botões do cabeçalho: em Contratos, `Templates` aparece ao lado de `+ Novo Contrato`; em Templates, `Variáveis` aparece ao lado de `+ Novo Template`.

A antiga URL `/crm/contratos/categorias` é apenas um alias de compatibilidade e redireciona para Templates. **Categorias não constituem mais entidade, store, filtro ou workspace do domínio contratual.**

Todas as rotas permanecem sob o shell compartilhado do CRM e utilizam o mesmo sidebar, Account Menu e loader global dos demais módulos internos.

## Domínio canônico

`modules/contracts/contractTypes.ts` é o contrato de domínio. Ele define contratos, partes, signatários, templates, variáveis, versões e eventos de histórico.

O **Template é a única classificação estrutural do contrato**. Não existe uma segunda entidade de Categoria concorrendo com ele. Cada contrato referencia um `templateId`, e essa relação é utilizada na criação, listagem, filtros e visualização.

Estados do contrato:

- `draft` — Rascunho;
- `review` — Em revisão;
- `awaiting_signature` — Aguardando assinatura;
- `signed` — Assinado;
- `active` — Vigente;
- `expired` — Expirado;
- `terminated` — Rescindido;
- `cancelled` — Cancelado.

O único provedor de assinatura admitido pelo contrato atual é `autentique`. Um contrato local que ainda não foi enviado mantém `signatureProvider = null` e `signatureState = not_sent`.

## Persistência atual

`modules/contracts/contractSessionStore.ts` é a fonte canônica de sessão para:

- contratos;
- templates;
- variáveis.

Todas as leituras e gravações reutilizam `shared/sessionRecords.ts`, com validação runtime e unicidade de IDs. Contratos operacionais começam vazios: não há registros fictícios de contratos para produção.

Templates e variáveis possuem apenas dados-base de configuração para tornar a experiência utilizável. Esses registros não representam contratos reais de clientes.

A persistência atual usa `sessionStorage`. Portanto, ela serve ao frontend atual e à validação de UX, mas não é banco de dados, não é multiusuário e não deve ser usada para contratos reais em produção.

A remoção da antiga classificação por categorias introduziu uma nova versão do contrato de sessão para contratos/templates, evitando que estruturas obsoletas continuem sendo tratadas como canônicas. Como a persistência atual é deliberadamente limitada à sessão do navegador, ela não constitui migração de dados de produção.

## Integração com CRM

O wizard consulta a fonte canônica de relacionamento através de `getCrmSessionRecords()`.

Na etapa de partes, o usuário pode vincular um contato/lead existente ou preencher os dados manualmente. Quando existe vínculo com CRM, o contrato preserva um snapshot dos campos necessários para o documento, evitando que uma alteração posterior no cadastro modifique silenciosamente uma versão contratual já criada.

O CRM permanece person-only. O módulo Contratos não introduz uma entidade paralela de pessoa jurídica nem altera o modelo canônico de relacionamento.

## Wizard de criação

O fluxo canônico possui seis etapas:

1. **Template** — seleção do modelo documental e da classificação estrutural do contrato;
2. **Partes** — seleção do cliente/contratante no CRM ou preenchimento manual;
3. **Variáveis** — dados estruturados do contrato e variáveis adicionais;
4. **Documento** — prévia do texto resultante e identificação de placeholders pendentes;
5. **Signatários** — definição de nomes, e-mails, papéis e obrigatoriedade;
6. **Revisão** — conferência final antes de salvar como rascunho ou enviar para revisão interna.

Salvar para revisão **não** envia o documento ao Autentique. O status local `review` representa somente prontidão interna para uma futura etapa server-side.

## Templates e variáveis

`modules/contracts/contractTemplateEngine.ts` implementa placeholders estritamente textuais no padrão:

```text
{{GRUPO.CAMPO}}
```

Exemplos de variáveis de sistema:

```text
{{CLIENTE.NOME}}
{{CLIENTE.CPF}}
{{CLIENTE.PASSAPORTE}}
{{PROCESSO.DESTINO}}
{{PROCESSO.TIPO_VISTO}}
{{PROCESSO.SERVICO}}
{{CONTRATO.TITULO}}
{{CONTRATO.VALOR}}
{{CONTRATO.DATA_INICIO}}
{{CONTRATO.DATA_FIM}}
```

O engine não interpreta HTML e não usa `dangerouslySetInnerHTML`. A prévia documental renderiza texto e destaca placeholders ainda não resolvidos. Variáveis personalizadas podem ser registradas e reutilizadas em templates, mantendo um único catálogo canônico.

Templates preservam nome, descrição, conteúdo e estado ativo/inativo. Eles cumprem simultaneamente a função de **modelo documental e classificação do contrato**, evitando uma camada adicional de Categorias. Ao salvar um contrato, o conteúdo utilizado é preservado em `templateSnapshot`, para que uma alteração futura no template não reescreva silenciosamente documentos existentes.

## Versões e histórico

A versão inicial do documento é registrada como `1.0`. Quando uma edição altera o documento, uma nova versão local é adicionada. O histórico local registra eventos de criação, atualização e mudanças de status suportadas pelo frontend.

Essa timeline é útil para a experiência atual, mas **não é uma trilha de auditoria legal**. A versão de produção deverá usar eventos imutáveis gravados no backend, com identidade do ator, request ID, origem, timestamps server-side e retenção adequada.

## Assinatura eletrônica

Autentique é o único adapter de assinatura previsto para Contratos.

A tela de assinatura pode consultar o estado real da integração pelo contrato já existente de Integrações. O botão de envio permanece desabilitado enquanto não houver:

1. contrato persistido em backend;
2. identidade/autorização server-side;
3. integração Autentique conectada;
4. endpoint server-side para criação/envio do documento;
5. webhook verificado para atualização do estado de assinatura.

Não existe fallback que marque um contrato como enviado, assinado ou conectado apenas no navegador.

## Backend necessário para produção

A camada server-side futura deve persistir, no mínimo:

- contratos e versões;
- templates compartilhados;
- variáveis configuráveis;
- partes e signatários;
- anexos e documentos gerados;
- vínculo com registros do CRM;
- estado da assinatura;
- IDs externos do Autentique;
- eventos imutáveis de auditoria;
- identidade do usuário que executou cada operação.

Endpoints recomendados para evolução do contrato de API:

```text
GET    /v1/contracts
POST   /v1/contracts
GET    /v1/contracts/{id}
PATCH  /v1/contracts/{id}
DELETE /v1/contracts/{id}
GET    /v1/contracts/{id}/versions
POST   /v1/contracts/{id}/versions
GET    /v1/contracts/{id}/events
POST   /v1/contracts/{id}/attachments
POST   /v1/contracts/{id}/signature/send
POST   /v1/webhooks/autentique
GET    /v1/contract-templates
POST   /v1/contract-templates
PATCH  /v1/contract-templates/{id}
```

Operações de criação/alteração devem aplicar autorização, idempotência quando apropriado, validação de payload, integridade referencial e logs estruturados. Webhooks do Autentique devem validar assinatura/HMAC conforme a documentação do provedor, evitar duplicidades e aceitar eventos fora de ordem sem corromper o estado.

## Pendências deliberadas

O frontend contratual está implementado, mas ainda dependem do backend: persistência multiusuário, anexos duráveis, geração/armazenamento de arquivos assináveis, auditoria imutável, permissões/RBAC, envio Autentique, callbacks/webhooks, notificações Resend e sincronização de estados externos.

Até essas camadas existirem, o módulo deve continuar diferenciando claramente operações locais de sessão de operações legais/externas reais.
