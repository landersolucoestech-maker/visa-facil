# Production Readiness

## Situação geral

O frontend passou por consolidação arquitetural. Dentro do escopo deste repositório estático, não há bloqueio estrutural conhecido nas rotas e fluxos locais do CRM cobertos pelos gates atuais. Isso **não** significa que o produto esteja pronto para operação real: este repositório não possui backend, banco de dados, autenticação real, secret management, workers ou adapters externos. Esses limites devem permanecer explícitos até as respectivas camadas existirem.

| Área | Estado | Bloqueio para produção real |
| --- | --- | --- |
| Site público e navegação | Implementados | Nenhum bloqueio estrutural conhecido no frontend |
| Formulário público | Frontend preparado | Exige `VITE_API_BASE_URL` apontando para API real e endpoint `POST /v1/public/leads` |
| CRM/Agenda/Tarefas/VisaChat | Frontend consolidado em sessão | Persistência compartilhada/multiusuário exige backend e banco |
| Marketing | Briefings, campanhas, conteúdo/calendário, tarefas e métricas consolidados em sessão; conteúdo pode vincular campanha por ID canônico | Publicação, mensagens, métricas e mídia paga reais exigem providers autorizados e backend |
| Financeiro/Invoices/Contabilidade | Regras frontend consolidadas | Persistência, autorização, conciliação e fiscal real exigem backend |
| CMS | Funcional no navegador | Conteúdo compartilhado, versionamento multiusuário e publicação central exigem API/DB |
| Autenticação/RBAC | Desativados | Provedor de identidade, sessão e enforcement server-side |
| Integrações externas | Contratos frontend preparados | Backend, credenciais, OAuth, webhooks, workers e secret manager |
| Telefonia e SMS | Contrato agnóstico de provider preparado | Provider adapter, conta/contrato, credenciais server-side, linhas/números, roteamento e webhooks/gateway reais |
| Automações | Preferências de E-mail, SMS e Push/In-App modeladas em sessão | Worker/jobs/filas inexistentes; preferências não executam disparos |
| Relatórios | XLSX operacional/configuração no navegador | Persistência compartilhada e multiusuário exige fonte de dados server-side |
| Contratos | Frontend funcional em sessão | Persistência server-side, anexos duráveis, auditoria imutável, RBAC e assinatura Autentique real exigem backend |
| NFS-e | Apenas arquitetura de integração | Provedor fiscal, homologação, certificado/dados fiscais e backend |

## Fechamento do frontend do CRM

Os gates atuais validam o frontend local do CRM em quatro níveis: contrato arquitetural/lint, testes de domínio, TypeScript/build e execução em navegador headless com montagem e interações selecionadas. Entre os fluxos cobertos estão Relacionamento, Agenda, Tarefas, VisaChat, Contratos, Financeiro, Faturamento, Marketing, Relatórios e Configurações.

As relações internas que possuem entidade canônica não devem depender apenas de nomes digitados. O frontend já preserva IDs onde aplicável, incluindo responsáveis (`ownerUserId`/`assigneeUserId`), registros relacionados do CRM (`relatedRecordId`/`crmRecordId`), cliente de cobrança (`customerRecordId`) e campanha vinculada ao conteúdo de Marketing (`campaignId`). Nomes permanecem como representação legível e compatibilidade de registros legados, não como chave primária do relacionamento.

No Marketing, Briefings e Tarefas são superfícies reais do frontend. Tarefas de Marketing reutilizam o mesmo domínio canônico de Tarefas com `Área = Marketing`; não existe um segundo store de tarefas paralelo. Conteúdos podem ser associados às campanhas existentes da sessão por `campaignId`; ao excluir uma campanha, o vínculo local é removido dos conteúdos sem apagar os conteúdos. A conta externa usada para publicação continua indisponível sem conexão real de provider.

Em Configurações, SMS é uma preferência futura de canal assim como E-mail e Push/In-App. Ativar essa preferência apenas preserva a escolha na sessão; não envia mensagens. A execução depende da futura camada de Telefonia/SMS, backend, worker e provider real.

Assim, qualquer item que ainda exija autenticação, persistência compartilhada, comunicação externa, fiscal, assinatura, publicação social, mídia paga, webhooks ou execução de automações não deve ser “completado” no frontend por simulação. Esses itens pertencem às pendências de infraestrutura descritas abaixo.

## Pendências obrigatórias para operação real

### Backend e persistência

Criar API backend versionada, banco de dados persistente, migrations, constraints, índices, transações e estratégia de backup. Migrar os estados hoje limitados a `sessionStorage`/`localStorage` para fontes server-side quando os domínios correspondentes forem ativados para produção.

Contratos deverá migrar sua fonte de sessão para tabelas/entidades persistentes de contratos, versões, templates, variáveis, partes, signatários, anexos e eventos de auditoria. O Template deve continuar sendo a classificação estrutural canônica do contrato; não deve ser reintroduzida uma entidade paralela de Categoria sem uma nova decisão explícita de domínio. O snapshot documental e o relacionamento entre versões precisam ser preservados no servidor, não apenas no navegador.

Comunicações de telefonia/SMS deverão persistir conexões, endpoints, rotas, mensagens/eventos, IDs externos e vínculos canônicos com CRM/VisaChat no backend. Histórico de SMS não pode depender de estado do navegador nem do nome textual do cliente.

### Identidade e autorização

Conectar provedor real de autenticação. Implementar sessões server-side, revogação, recuperação de conta, MFA conforme necessidade e RBAC aplicado na API. A interface atual não deve ser tratada como fronteira de segurança.

No domínio de Contratos, permissões server-side deverão controlar ao menos leitura, criação, alteração, exclusão, revisão, envio para assinatura, cancelamento e acesso a documentos/anexos.

Telefonia/SMS deverá ter permissões próprias para configuração de provider, números/remetentes, rotas, leitura de histórico e envio de mensagens. Credenciais e secret values não podem ser autorizados apenas por controles do frontend.

### Integrações

Implementar os adapters descritos em `docs/INTEGRATIONS.md` e `docs/COMMUNICATIONS.md`, armazenamento seguro de credenciais/tokens, OAuth/callbacks, verificação de webhook, idempotência, filas, retries, DLQ/replay, logs e health checks. A UI nunca deve inferir `connected` sem confirmação do backend.

A hierarquia frontend já está consolidada para evitar providers duplicados:

- **Meta** é o provider técnico único de Facebook, Instagram, Messenger e Meta Ads;
- **Google** é o provider técnico único de YouTube, Google Ads e Google Calendar;
- **WhatsApp**, **TikTok**, **Autentique**, **NFS-e** e **Telefonia/SMS** permanecem providers/domínios próprios conforme seus contratos;
- **Resend** permanece infraestrutura interna exclusivamente server-side e não aparece como integração conectável pelo navegador.

Para Contratos, Autentique permanece o único provedor de assinatura eletrônica previsto. O frontend não envia documentos nem fabrica estados de assinatura. O backend deverá criar/enviar o documento, persistir o identificador externo e processar webhooks verificados para atualizar signatários, documento e trilha de auditoria. Resend poderá ser utilizado para notificações operacionais, também exclusivamente server-side.

Para Telefonia/SMS, Vivo, TIM, Claro, Twilio, Dialpad, RingCentral e fornecedores equivalentes são apenas targets de adapters. A disponibilidade efetiva de SMS, voz, números, sender IDs, delivery receipts ou webhooks depende do contrato/plano/API de cada fornecedor. A implementação real deve usar `CommunicationProviderAdapter` e o modelo canônico, sem inserir SDKs específicos dentro do CRM/VisaChat.

### Observabilidade

Adicionar logs estruturados server-side, métricas, tracing/request IDs, monitoramento de filas/webhooks e alertas operacionais. Logs do navegador não substituem observabilidade de backend.

A trilha histórica local do módulo Contratos não possui valor de auditoria legal. Produção exige eventos imutáveis com identidade do ator, timestamps server-side, origem da ação e correlação por request/event ID.

Telefonia/SMS deverá medir pelo menos provider, rota, latência, tentativas, taxa de aceite, enviado/entregue/falha, webhooks rejeitados, backlog e saúde da conexão, sem registrar segredos ou conteúdo sensível indevidamente.

### Testes

A suíte atual protege contratos, regras financeiras, stores, contratos de integrações, arquitetura de telefonia/SMS, Relatórios XLSX, build/runtime e renderização/interações selecionadas das rotas críticas do frontend em navegador headless. O smoke de interação verifica, entre outros pontos, relacionamentos canônicos, wizard de Contratos, importação XLSX, preferências de SMS, unificação Meta/Google e o vínculo Conteúdo → Campanha no Marketing.

Ainda serão necessários para operação real:

- testes E2E completos de fluxos críticos ponta a ponta, além do smoke de interação já existente;
- testes de API e banco;
- testes de autorização/RBAC;
- testes de integração em sandboxes dos provedores;
- testes de webhook/idempotência/retry;
- suíte de conformidade para cada `CommunicationProviderAdapter`;
- testes de roteamento/fallback e normalização de status de SMS;
- testes de migração;
- testes de segurança e carga dos endpoints críticos;
- testes E2E do ciclo contratual completo, incluindo criação, versionamento, anexos, envio Autentique, assinaturas parciais, rejeição, expiração e cancelamento.

### GitHub Pages

Pages hospeda frontend estático. Uma API real precisa ser publicada separadamente ou roteada por infraestrutura adequada. Segredos não podem existir no deployment estático.

O build publicado atualmente mantém os datasets demonstrativos centralizados habilitados por padrão para suportar a validação do protótipo. Esses dados não constituem persistência nem estado real de produção e não podem representar integrações conectadas, autenticação, autorização, emissão fiscal, telefonia/SMS ou assinatura concluída. Quando o ambiente deixar de ser demonstrativo, `VITE_CRM_MOCKS=false` deve ser aplicado antes da exposição a dados reais.

## Funcionalidades deliberadamente indisponíveis enquanto não houver backend

- autenticação real e operações de segurança da conta;
- persistência multiusuário dos módulos operacionais;
- execução real das preferências de automação, inclusive SMS;
- conexão real com WhatsApp, Meta, Google, TikTok, Autentique e NFS-e;
- habilitação real dos produtos Facebook, Instagram, Messenger e Meta Ads dentro do provider Meta;
- habilitação real dos serviços YouTube, Google Ads e Google Calendar dentro do provider Google;
- conexão real com Vivo, TIM, Claro, Twilio, Dialpad, RingCentral ou qualquer outro provedor de telefonia/SMS;
- envio/recebimento real de SMS, chamadas, provisionamento de linhas/números e atualização real de delivery receipts;
- publicação real de conteúdos, sincronização de métricas e execução de campanhas de Marketing;
- emissão fiscal real;
- importação/exportação operacional persistente e compartilhada de relatórios;
- persistência multiusuário de contratos, anexos duráveis e auditoria legal/imutável;
- envio real de contratos para assinatura, callbacks/webhooks e sincronização de estado do Autentique;
- sincronização compartilhada do CMS.

A interface deve continuar comunicando essas limitações de forma explícita em vez de usar mocks, fallbacks ou mensagens de sucesso para operações que não ocorreram.

Consulte `docs/CONTRACTS.md` para o contrato funcional do módulo e `docs/COMMUNICATIONS.md` para a arquitetura de telefonia/SMS, incluindo providers, endpoints, rotas, histórico, status e extensão por adapter.
