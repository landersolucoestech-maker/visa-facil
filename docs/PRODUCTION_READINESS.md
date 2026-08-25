# Production Readiness

## Situação geral

O frontend passou por consolidação arquitetural, mas o projeto ainda não é um sistema de produção completo porque este repositório não possui backend, banco de dados, autenticação real, secret management, workers ou adapters externos. Esses limites devem permanecer explícitos até as respectivas camadas existirem.

| Área | Estado | Bloqueio para produção real |
| --- | --- | --- |
| Site público e navegação | Implementados | Nenhum bloqueio estrutural conhecido no frontend |
| Formulário público | Frontend preparado | Exige `VITE_API_BASE_URL` apontando para API real e endpoint `POST /v1/public/leads` |
| CRM/Agenda/Tarefas/VisaChat | Funcionais em sessão | Persistência compartilhada/multiusuário exige backend e banco |
| Financeiro/Invoices/Contabilidade | Regras frontend consolidadas | Persistência, autorização, conciliação e fiscal real exigem backend |
| CMS | Funcional no navegador | Conteúdo compartilhado, versionamento multiusuário e publicação central exigem API/DB |
| Autenticação/RBAC | Desativados | Provedor de identidade, sessão e enforcement server-side |
| Integrações externas | Contratos frontend preparados | Backend, credenciais, OAuth, webhooks, workers e secret manager |
| Automações | Preferências modeladas | Worker/jobs/filas inexistentes |
| Relatórios | Templates/validação local | Importação/exportação operacional persistente exige fonte de dados compartilhada |
| Contratos | Shell arquitetural criado | Modelo funcional definitivo depende do arquivo de referência e backend documental |
| NFS-e | Apenas arquitetura de integração | Provedor fiscal, homologação, certificado/dados fiscais e backend |

## Pendências obrigatórias para operação real

### Backend e persistência

Criar API backend versionada, banco de dados persistente, migrations, constraints, índices, transações e estratégia de backup. Migrar os estados hoje limitados a `sessionStorage`/`localStorage` para fontes server-side quando os domínios correspondentes forem ativados para produção.

### Identidade e autorização

Conectar provedor real de autenticação. Implementar sessões server-side, revogação, recuperação de conta, MFA conforme necessidade e RBAC aplicado na API. A interface atual não deve ser tratada como fronteira de segurança.

### Integrações

Implementar os adapters descritos em `docs/INTEGRATIONS.md`, armazenamento seguro de credenciais/tokens, OAuth/callbacks, verificação de webhook, idempotência, filas, retries, DLQ/replay, logs e health checks. A UI nunca deve inferir `connected` sem confirmação do backend.

### Observabilidade

Adicionar logs estruturados server-side, métricas, tracing/request IDs, monitoramento de filas/webhooks e alertas operacionais. Logs do navegador não substituem observabilidade de backend.

### Testes

A suíte atual protege contratos, regras financeiras, stores e build/runtime do frontend. Ainda serão necessários:

- testes E2E em navegador dos fluxos críticos;
- testes de API e banco;
- testes de autorização/RBAC;
- testes de integração em sandboxes dos provedores;
- testes de webhook/idempotência/retry;
- testes de migração;
- testes de segurança e carga dos endpoints críticos.

### GitHub Pages

Pages hospeda frontend estático. Uma API real precisa ser publicada separadamente ou roteada por infraestrutura adequada. Segredos não podem existir no deployment estático.

## Funcionalidades deliberadamente indisponíveis enquanto não houver backend

- autenticação real e operações de segurança da conta;
- persistência multiusuário dos módulos operacionais;
- execução real das preferências de automação;
- conexão real com WhatsApp, Resend, Autentique, NFS-e, Meta, YouTube, TikTok, Google Ads e Google Calendar;
- emissão fiscal real;
- importação/exportação operacional persistente de relatórios;
- gestão definitiva de contratos/assinaturas;
- sincronização compartilhada do CMS.

A interface deve continuar comunicando essas limitações de forma explícita em vez de usar mocks, fallbacks ou mensagens de sucesso para operações que não ocorreram.
