# Mock data

This directory is the single storage location for mock/fixture datasets used by the current frontend prototype.

Rules:
- Mock datasets live only under this directory, grouped by domain.
- In the current prototype they are enabled by default, including the GitHub Pages build, so the interface opens with representative data.
- Set `VITE_CRM_MOCKS=false` to disable every centralized mock dataset from the runtime policy in `shared/runtimeFlags.ts`.
- Domain providers remain next to their modules and must runtime-validate every fixture before it can initialize browser-session state.
- Operational data created by the user continues to use the validated session stores; the mock files are only the initial fallback dataset.
- To remove demo data later, disable the flag first, remove this directory and then remove the corresponding mock-provider fallback imports.

Current domains: agenda, attendance/VisaChat, contracts templates/variables, CRM, finance/invoices, marketing and tasks.
