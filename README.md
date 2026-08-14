# Visa Fácil

Fundação React do website oficial Visa Fácil.

## Regras desta fase

- desenvolvimento exclusivamente no branch `dev`;
- `/` representa o website público oficial migrado para React;
- `/app/*` está reservado para o sistema interno;
- `apps/api` está apenas reservado e não contém backend fictício;
- o HTML oficial permanece como contrato visual e funcional da migração.

## Validação

```bash
npm run validate
npm run typecheck
npm run build
```

O workflow `Frontend CI` executa essas verificações automaticamente em pushes e pull requests do branch `dev`.
