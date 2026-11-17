# Implementation status

## Bilingual showcase milestone

| Module | Current implementation |
| --- | --- |
| Overview and tour | Albanian and English, ten steps, state-preserving language switch and read-only sample data |
| World and masonry | Operational portal, house and masonry with published inventory. These interfaces remain Albanian. Other interactive components remain open. |
| Accounts and organizations | Registration, recovery, private profiles, team creation and invitation acceptance. Business verification and full localization remain open. |
| Catalogue and inventory | Search and filters, drafts, moderation and anonymous discovery. Full localization remains open. |
| Quotations | Buyer requests and participant inbox. Supplier replies, comparison and reservation remain open. |
| Projects, logistics, orders, payments and documents | Planned. The showcase presents examples and workflow descriptions. |
| Passports, impact reporting and AI | Planned. No measured results or operational AI integration. |
| Launch | Environment separation and release procedures documented. Public deployment and operational preparations remain open. |

The showcase milestone passed the production build, 9 unit and PostgreSQL tests, 22 production Playwright checks across desktop and mobile Chrome, and 3 connected Playwright checks against local Supabase. The public browser suite verified that the tour can run with backend credentials unset, that language switching retains the selected stop, and that the final stop passes the configured axe rules.

Baseline on 17 November 2026. The supplied workspace contained no application files or Git metadata. Node.js, npm, Git, Docker, and psql were absent from the initial command path. There were no legacy commands or checks to run.

## M0 — Audit and architecture

Established a clean project with an npm lockfile, strict TypeScript, ESLint and CI. The existing workspace had no package, app, schema, README or Git history to preserve. A project-local Node.js and npm runtime provided the Windows build tools. The architecture, decisions, roadmap, operations and grant readiness documents are under `docs/`.

## M1 — Product foundation

`app/`, `components/` and `public/architecture.jpg` provide the Albanian homepage, catalogue, details, account routes, seller inventory and moderator screens. The generated editorial artwork is locally stored and served responsively. The design uses self-hosted fonts and includes empty, unavailable, loading and error states.

## M2 — Authentication and database foundation

`app/account-actions.ts`, `app/autentikim/`, `proxy.ts` and `lib/supabase.ts` implement Supabase registration, email callback, login, logout, password recovery and session-protected routes. Cookies are HTTP-only and Secure when the application origin uses HTTPS. `app/inventari/profili/` and migration `202611170002_profiles.sql` add private, owner-editable profiles. Organization membership and business verification remain planned.

## M3 — First inventory and discovery slice

`supabase/migrations/`, `app/inventari/`, `app/administrim/` and `lib/catalogue.ts` implement personal draft creation and editing, owner search, moderation requests, approval or rejection, audit records, withdrawal and archive. The public projection exposes approved, published stock with a positive quantity. Catalogue filters support title, category, county, condition, unit, minimum quantity, currency and price. Images, supporting documents, structured specifications, verified sellers and stock reservations remain planned.

## Construction Explorer milestone

The homepage now uses an original architectural cutaway with five keyboard- and touch-accessible material zones. Each zone opens a preview of published stock and a category-filtered catalogue. Signed-in users can save and revisit private availability requests. The catalogue heading follows the active category, and seller inventory can filter publication state. Existing listing ownership and category assignments were preserved.

Migration `202611170003_explorer.sql` was applied to local Supabase. Live PostgreSQL confirmed all five category IDs and RLS on availability requests. The browser flow verified published stock in the Explorer, private request creation and isolation, category preservation through sign-in, and inventory status filters. See [Explorer design and asset provenance](EXPLORER.md).

## Masonry visualization and quotation requests

The masonry zone opens a dedicated studio with four visual selections and live subtype-filtered stock. Migration `202611170004_masonry_quotes.sql` adds the subtype and optional public seller label to inventory moderation. The buyer can send a quotation request for a published listing and both parties can view it in their workspace. The database validates quantity, fulfillment and participation.

## M4–M6 — Later work

Seller offers, orders, messaging, logistics, business verification, reporting, AI and launch hardening remain planned. The moderation queue currently covers listing publication. Operational security work includes abuse controls, recovery drills, privacy and materials safety review. Performance measurement and manual accessibility review are pending. CI is configured locally and has not run in a GitHub repository.

## Verification and next action

| Command | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed, including generated Next.js route types |
| `npm test` | 7 passed, including PostgreSQL authorization, publication transitions, profile isolation, availability and quotation requests |
| `npm run build` | Passed |
| `npm run test:e2e` | 12 passed on desktop Chrome and emulated Pixel 7, including the construction story, pavilion rotation and share links, masonry visual changes, 320px layout and axe |
| `npm run test:supabase` | 2 passed against live local Supabase, including masonry classification and buyer-to-seller quotation delivery |
| `npm audit --audit-level=high` | 0 reported vulnerabilities |

The initial build exposed a password recovery type error and attempted to prerender protected routes while the backend was disconnected. Recovery error handling was corrected and protected routes now render on demand. The final browser run used an available loopback port and the installed Chrome channel.

Run the commands in the [README](../README.md). The SQL tests use the real migration in embedded PostgreSQL and provide test-only equivalents of the Supabase Auth roles and identity function. Browser tests use the production build with backend credentials intentionally unset. No fixtures populate the live catalogue.

Ubuntu runs under WSL 2 and Docker Desktop uses the Linux engine. Windows reserved the default Supabase ports, so the project uses the 55320 port block for local services. Supabase CLI 3.2.0 applied both migrations. Live PostgreSQL confirmed RLS is enabled on materials, profiles, platform admins and moderation events. The connected browser suite verified email confirmation via Mailpit, private profiles and drafts, moderator approval, anonymous catalogue discovery, withdrawal and archive. Password recovery still needs a separate connected check.
