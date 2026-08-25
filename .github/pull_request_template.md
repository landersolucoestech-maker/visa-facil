## Objetivo

Descreva o problema concreto resolvido e o comportamento esperado após a alteração.

## Escopo

Liste os módulos/camadas realmente modificados e confirme qualquer área deliberadamente não alterada.

## Contratos e arquitetura

- [ ] A alteração preserva uma única fonte de verdade para cada domínio afetado.
- [ ] Tipos, fixtures, UI e regras de negócio continuam compatíveis entre si.
- [ ] Não foi criada implementação paralela, fallback enganoso ou código legado concorrente.
- [ ] Rotas e imports apontam para os módulos canônicos.
- [ ] Nenhuma funcionalidade frontend é apresentada como persistência, autenticação, autorização ou integração real sem implementação correspondente.
- [ ] Mudanças financeiras preservam Transações como fonte canônica da Contabilidade.
- [ ] Fixtures `*.dev.json` continuam acessíveis apenas por providers governados pela política de mocks.

## Segurança e dados

- [ ] Nenhum segredo, token, credencial ou dado sensível real foi adicionado ao bundle cliente, fixtures ou variáveis `VITE_*`.
- [ ] Entradas/arquivos novos possuem validação adequada.
- [ ] Não foi introduzido `dangerouslySetInnerHTML`, iframe não autorizado ou `any` para esconder incompatibilidades.
- [ ] Dependências novas ou alteradas foram justificadas e auditadas.

## Qualidade

- [ ] `npm run validate`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run audit`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] Smoke runtime aplicável validado.
- [ ] Testes foram adicionados/atualizados quando houve nova regra, parser, transformação ou contrato de dados.

## UI/UX

- [ ] Componentes reutilizam o shell/design system existente em vez de criar variantes concorrentes.
- [ ] Estados vazio, loading, erro e disabled continuam coerentes.
- [ ] Responsividade e interação por teclado não regrediram nas áreas alteradas.

## Documentação

- [ ] README/`docs/ARCHITECTURE.md` foram atualizados se houve mudança de arquitetura, contrato, rota, configuração ou limite do sistema.
- [ ] O texto da interface descreve somente capacidades que realmente existem.

## Evidências

Informe comandos executados, resultado do CI e, quando aplicável, screenshots ou passos reproduzíveis para validar a mudança.
