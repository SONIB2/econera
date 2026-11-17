# ECONERA | Startup Albania readiness

## 1–4. Product, problem, innovation and differentiation

ECONERA aims to match surplus and suitable reusable construction materials with local demand throughout Albania. Initial users include construction suppliers, contractors, renovation professionals and individual buyers. The working hypothesis is that stock descriptions, quantities, condition and location are currently fragmented across informal channels. Interviews and observed workflows are needed to validate that problem.

Structured inventory and approval before public discovery form the first technical differentiators. Future hypotheses include stronger buyer search through Albanian natural language and lower coordination costs through inventory-linked quotations. Compare seller entry time, information completeness and buyer search success against the channels pilot participants already use.

## 5–7. Architecture, MVP and roadmap

The current slice uses Next.js, Supabase Auth and PostgreSQL, with private profiles, protected inventory, owner-only record access, an administrative review queue and a public catalogue projection. SQL tests run locally. The seller, moderator and anonymous visitor workflows passed browser verification against local Supabase.

The next slice adds photographs and documents with restricted storage, business profiles, organization membership permissions and verification. After that, add quotes, quantity reservations and offline order coordination. Add AI and impact reporting after real transactional data and ground rules exist. See the [roadmap](../ROADMAP.md).

## 8–10. Cost and scale assumptions

Budgeting scenarios, dated 17 November 2026, are planning assumptions in EUR. Obtain current quotes before submitting a budget.

| Category | Planning assumption |
| --- | --- |
| Shared pilot hosting, database and backups | Reserve €50–150 per month pending tier and retention choices |
| Email and telemetry | Reserve €15–60 per month at low pilot volume |
| AI | €0 in the first slice. Cost a capped usage model separately |
| Engineering | Estimate 4–8 person-months for tenant, commerce, testing and pilot hardening. Price using documented vendor or staff rates |
| Design, legal, domain expertise | Obtain scoped quotes for usability evaluation, accessibility review, terms and materials safety |
| Budget contingency | Model 15–25% against scoped implementation costs |

Scale the modular monolith with connection pooling, indexes, query measurement and asset delivery before introducing services. Review stock reservation contention under concurrent order attempts.

## 11–14. Risks, security, accessibility and impact

| Risk | Validation or mitigation |
| --- | --- |
| Buyers fail to locate usable stock | Observe searches across multiple regions and measure task success |
| Unreliable stock or condition claims | Track stale listings and review samples with construction specialists |
| Tenant data disclosure | Add membership RLS and negative cross-organization tests before enabling business accounts |
| Double allocation | Reserve quantities atomically in PostgreSQL and test simultaneous acceptance |
| Environmental overclaim | Report observed transfers first, preserving unit, classification and evidence |
| Pilot friction | Compare mobile, assisted and keyboard workflows |
| Funding delay | Keep the first pilot independently operable |

See the [security, privacy and accessibility gates](../OPERATIONS.md). Track listed and confirmed transferred units separately, by unit, category and geography. Never sum dissimilar units. Require measured weights or disclosed conversion factors for aggregation. A future lifecycle estimate needs a credible displacement baseline, product-specific factors, provenance, system boundaries and logistics and processing adjustments. Label measured, estimated and unavailable values and record uncertainty.

## 15–17. Pilot, demo and measurable milestones

Recruit a small cohort of sellers and buyers from several counties. Treat numbers as targets. Aim for at least 10 observed seller sessions and 10 buyer searches, including mobile and keyboard journeys. Record completion rates, time, error reasons and qualitative feedback with participant consent.

Demonstrate with a local database and labeled demo records. Verify an account, save a draft, confirm another account cannot access it, approve it with a separately provisioned moderator, filter the public catalogue and inspect the detail, then withdraw the item and verify it disappears. The demonstration requires a connected Supabase stack.

Proposed exit measures are successful connected demo runs from a clean setup, passing tenant and reservation tests before commerce, no serious automated accessibility findings on critical paths, and recorded completion and recovery outcomes from pilot sessions. Market demand, available stock and environmental displacement require evidence from the pilot.

## Grant verification | 17 November 2026

The Ministry published the results of the 2026 round on 27 August 2026. [Ministry results announcement](https://ekonomia.gov.al/newsroom/programi-i-financimit-grant-2026-dyfishohet-fondi-dhe-startup-et-e-financuara-163-startup-e-mbeshteten-me-600-milione-leke/).

The 2026 municipal guidance describes registration in the startup register, a Startup Passport, e-Albania application, and phase-dependent financing and cofinancing. [Pogradec municipality Grant 2026 guidance](https://bashkiapogradec.gov.al/publikime/kendi-be-8/thirrja-per-grante-2026-apliko--934/) and [Council of Ministers decision](https://www.kryeministria.al/newsroom/vendime-te-miratuara-ne-mbledhjen-e-keshillit-te-ministrave-date-7-shkurt-2024/).

A subsequent call, current application deadline, eligible expenses, applicable cofinancing rates and ECONERA eligibility remain unverified. Confirm directly against the next published call and rulebook before filing. [Startup Albania portal](https://startupalbania.gov.al/).
