# Phase 1 foundation audit

The existing repository uses Next.js App Router, React, TypeScript, Three.js for the homepage, and Supabase Auth/PostgreSQL for operational data. The existing design system is in `app/globals.css` and `components/ui.tsx`. The homepage has its own WebGL scene and styles. This phase targets account and workspace routes.

Email confirmation, sign-in, sign-out, password recovery, private profiles, material CRUD, moderation, public inventory, availability requests and quotation request delivery already exist. The connected browser tests exercise email confirmation and inventory/quotation workflows. Recovery has a flow in code and needs a live browser check.

Phase 1 adds organization and membership tables with RLS, verified-email invitations, a protected workspace overview with real account metrics, and a dashboard landing after normal verification and sign-in. Quotation and availability sign-in return paths remain specific to their flows. Inventory and quotations continue to use their existing personal ownership until tenant-scoped operations are implemented.

Migration `202611170005_organizations.sql` was applied to the running local Supabase stack. Organization creation and initial ownership are transactional. Organization and membership reads use RLS, and the only membership writes are behind scoped database functions. The owner generates a code and shares it privately. The database stores its hash and binds redemption to the invited verified email. The code expires after seven days and redemption locks the invitation against replay. This phase supports owner and member roles.

Projects, inventory movements, orders, operational analytics and AI workflows are later phases. The overview can show planned modules without serving fabricated data or fake controls.

Lint, TypeScript, and the production build passed. Eight validation and PostgreSQL tests, 18 public browser tests, and three live Supabase workflows passed. The organization flow verifies email confirmation, organization creation, denied access before joining, verified-email invitation redemption, persistent membership, password recovery, and sign-in with the new password. The dashboard also passed the connected 390-pixel viewport and axe checks.
