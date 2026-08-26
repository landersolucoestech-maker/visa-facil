# Mock data

This directory is the single storage location for development-only mock/fixture datasets used by the CRM frontend.

Rules:
- Runtime mock data must live under this directory, grouped by domain.
- Mock datasets are only consumed when the centralized runtime mock flag is enabled (`VITE_CRM_MOCKS=true` in Vite development mode).
- Production/Pages must never enable the mock flag.
- Domain validators/providers remain responsible for runtime validation before a fixture can initialize browser-session state.
- Removing mock datasets later should start by deleting this directory and then removing the corresponding mock-provider initialization paths.

Current domains: agenda, attendance, CRM, finance/invoices, marketing and tasks.
