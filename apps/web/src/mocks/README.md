# Mock data

This directory is the single storage location for mock/fixture datasets used by the current frontend prototype.

Rules:
- Mock datasets live only under this directory, grouped by domain.
- In the current prototype they are enabled by default, including the GitHub Pages build, so the interface opens with representative data.
- Set `VITE_CRM_MOCKS=false` to disable every centralized mock dataset from the runtime policy in `shared/runtimeFlags.ts`.
- Domain providers remain next to their modules and must runtime-validate every fixture before it can initialize browser-session state.
- Operational data created by the user continues to use the validated session stores; the mock files are only the initial fallback dataset.
- External integrations are never mocked as connected. Integration status must continue to come from the real backend contract; fixtures must not fabricate OAuth, tokens, webhooks, Autentique delivery or signatures.
- To remove demo data later, disable the flag first, remove this directory and then remove the corresponding mock-provider fallback imports.

Current centralized domains:
- `crm/`: contacts, leads and customer records used directly by CRM and indirectly by Dashboard/Reports.
- `agenda/`: calendar events used by Agenda and derived summaries.
- `tasks/`: operational tasks used by Tasks and derived summaries.
- `attendance/`: VisaChat conversations/messages.
- `contracts/`: operational contract records plus contract templates and variables. Signature mocks stay local-only with `signatureProvider: null` / `signatureState: not_sent`.
- `finance/`: transactions, invoices, finance categories and automatic categorization rules. Accounting/Reports derive from these canonical sources.
- `marketing/`: campaigns and marketing operational state.
- `settings/`: prototype company, automation, user and role reference data. These are UI fixtures only and do not represent real authentication/RBAC enforcement.

Derived views such as Dashboard, Accounting and Reports do not maintain a second parallel fixture set: they intentionally calculate their content from the seeded canonical domain stores above, preventing duplicated or contradictory mock data.
