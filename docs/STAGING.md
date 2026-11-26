# ECONERA — Staging, configuration and UAT runbook

Production (www.econera.al, branch `v1-grant`) stays unchanged until every critical workflow below has passed on staging and the owner approves the release.

| | Production | Staging |
| --- | --- | --- |
| Code branch | `v1-grant` (auto-deploys to www.econera.al) | `phase-2` (and any other branch) |
| Address | https://www.econera.al | https://econera-git-phase-2-tema-diplomece.vercel.app (always the latest `phase-2` build) |
| Vercel environment | Production variables | Preview variables |
| Supabase project | `econera-preview` (ref `vnyohwrrfqumixnmcwqp`) — real | `econera-staging` — to create; test data only |
| AI keys | production keys, normal caps | separate keys, low caps |

A preview for one exact commit also exists, e.g. `https://econera-h0zer67tb-tema-diplomece.vercel.app` (commit 09db564). Previews are protected by Vercel Authentication: open them while signed in to the `tema-diplomece` Vercel team. Previews are never indexed.

## 1. Create the staging Supabase project

1. supabase.com → the **ECONERA Free Preview** organisation → **New project**.
   - Name: `econera-staging`. Region: the same as production (Central EU / Frankfurt). Generate a strong database password and keep it in your password manager.
   - Plan: Free is enough for staging (2 free projects per organisation).
2. Wait until the project shows **Healthy**.
3. **SQL Editor → New query**: open `supabase/staging/all-migrations.sql` from the repository, paste it all and press **Run**. It creates the whole database (migrations 0001–0030) in one transaction; on any error nothing is applied. The file refuses nothing by itself, so check the project name in the top bar first: it must say `econera-staging`, never `econera-preview`.
4. **Authentication → Sign In / Providers → Email**: keep email sign-in on; "Confirm email" on.
5. **Authentication → Multi-Factor**: enable **TOTP (App Authenticator)**. Staff actions require it.
6. **Authentication → URL Configuration**:
   - Site URL: `https://econera-git-phase-2-tema-diplomece.vercel.app`
   - Redirect URLs: `https://econera-git-phase-2-tema-diplomece.vercel.app/**` and `https://econera-*-tema-diplomece.vercel.app/**`
7. **Project Settings → API Keys**: copy the **Publishable key** and create/copy a **Secret key** for the next step. Never paste them in a chat, email or the repository.

## 2. Vercel environment variables

Vercel → project **econera** → Settings → Environment Variables. Today all five existing variables are set for **Production only**, so the Preview has no database (its `/api/health` answers `"database":"not-configured"`).

Add the **Preview** values below (scope: Preview, branch `phase-2` or all preview branches). Do not change the Production values except where the table says so. Mark keys and tokens **Sensitive**.

| Name | Purpose | Production | Preview (staging) |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project address | exists — keep | **add**: staging project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public key used by the browser (RLS applies) | exists — keep | **add**: staging publishable key |
| `SUPABASE_SECRET_KEY` | server-only key (exports, admin tasks) — Sensitive | exists — keep | **add**: staging secret key |
| `APP_ORIGIN` | site address for e-mail links | exists — optional now (production always uses https://www.econera.al) | leave empty (the preview uses its own address) |
| `ADMIN_PASSWORD` | temporary pilot-page password — Sensitive | exists — remove once a staff account with MFA exists | do not add |
| `PILOT_CONTACT_EMAIL` | contact address shown on the terms page | add when the address is decided | optional |
| `ANTHROPIC_API_KEY` | Claude: SmartCut prescreen, voice understanding — Sensitive | add when approved | **add** a separate staging key |
| `ANTHROPIC_MODEL` | main Claude model | optional (default `claude-sonnet-5-5`) | optional |
| `ANTHROPIC_VOICE_MODEL` | cheap model for voice commands | optional (default `claude-haiku-5-5`) | optional |
| `OPENAI_API_KEY` | image editing for the AI Room Designer — Sensitive | add when approved | **add** a separate staging key |
| `OPENAI_IMAGE_MODEL` | image model | optional (default `gpt-image-2.5-flare`) | optional |
| `UPSTASH_REDIS_REST_URL` | shared rate limits and AI budgets | add | **add** (staging database) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash token — Sensitive | add | **add** |
| `SENTRY_DSN` | error reporting | add | **add** (same project, environment is tagged automatically) |
| `AI_DAILY_LIMIT_ROOM` / `_DESIGN` / `_VOICE` / `_PRESCREEN` | requests per day per AI tool | optional (defaults 300 / 60 / 3000 / 500) | suggested 30 / 10 / 300 / 50 |
| `AI_MONTHLY_LIMIT_ROOM` / `_DESIGN` / `_VOICE` / `_PRESCREEN` | requests per calendar month (UTC) | optional (defaults 3000 / 600 / 30000 / 5000) | suggested 300 / 100 / 3000 / 500 |
| `AI_DISABLED` | `1` switches every paid AI call off at once (emergency stop) | not set | not set |
| `VERCEL_PROTECTION_BYPASS` | not a Vercel variable — used only by the test runner (GitHub secret, see §7) | — | — |

After saving, redeploy the preview: Vercel → Deployments → the latest `phase-2` deployment → ⋯ → **Redeploy**. Then open `/api/health` on the preview: it must show `"database":"ok"` and `"environment":"preview"`.

## 3. AI usage controls (cost protection)

Every paid AI request passes `aiBudgetExceeded(feature)` before calling a provider:

1. `AI_DISABLED=1` → all AI tools answer "temporarily unavailable"; nothing is billed.
2. **Daily cap** per tool (rolling 24 h) — `AI_DAILY_LIMIT_<TOOL>`.
3. **Monthly cap** per tool (UTC calendar month) — `AI_MONTHLY_LIMIT_<TOOL>`.
4. **Per-visitor limits** (per IP per minute/hour) on each AI route.

Counters live in Upstash, so they are shared by every server instance. Without Upstash they fall back to per-instance memory (weaker; acceptable only for staging). The current caps are visible at `/api/health` → `ai.caps`.

Provider-side limits are the second line of defence — set them as well (§4).

Worst-case monthly cost at the default caps (estimates; check current prices before enabling):

| Tool | Model | Monthly cap | ≈ cost per call | ≈ maximum per month |
| --- | --- | --- | --- | --- |
| Room Designer (image edit) | gpt-image-2.5-flare, 1024 px, medium | 600 | $0.013 | ≈ $8 |
| Room Designer (room analysis) | Claude Sonnet 5.5 | 3000 | ≈ $0.01 | ≈ $30 |
| SmartCut prescreen | Claude Sonnet 5.5 | 5000 | ≈ $0.01 | ≈ $50 |
| Voice understanding | Claude Haiku 5.5 | 30000 | ≈ $0.0003 | ≈ $9 |

## 4. External services

### Upstash (Redis for limits)

1. console.upstash.com → sign up → **Create Database** → type Redis, name `econera-prod` (and a second one, `econera-staging`), region **eu-central-1 (Frankfurt)**, plan **Free** (500K commands/month).
2. Open the database → **REST API** section → copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` into Vercel (production database → Production, staging database → Preview).
3. Verify: `/api/health` → `sharedRateLimits: true`.

### Anthropic (Claude)

1. console.anthropic.com → sign in → **Settings → Billing**: add a payment method and buy a small prepaid credit (e.g. $20). Turn off auto-reload, or set a low reload amount.
2. **Settings → Limits**: set a **monthly spend limit** (e.g. $50 production, $10 staging).
3. **Settings → Workspaces**: create workspaces `econera-production` and `econera-staging` (each can have its own spend limit).
4. **API Keys → Create Key** inside each workspace. Paste each into Vercel as `ANTHROPIC_API_KEY` (Production / Preview). The key is shown only once.
5. Verify: `/api/health` → `ai.analysis: true`; try SmartCut and the voice assistant.

### OpenAI (images)

1. platform.openai.com → **Settings → Organization → Verification**: image models require a verified organisation; complete it first.
2. **Billing**: add credit (e.g. $10), auto-recharge off.
3. **Projects → Create project** `econera-production` and `econera-staging`. In each project → **Limits**: set a monthly budget and allow only the image model.
4. **API keys → Create new secret key** (project-scoped). Paste into Vercel as `OPENAI_API_KEY`.
5. Verify: `/api/health` → `ai.design: true`; generate one design in the AI Room Designer.

### Sentry (errors)

1. sentry.io → sign up (Developer plan, free, 5K errors/month) → **Create project** → platform **Next.js**, name `econera`.
2. **Project Settings → Client Keys (DSN)** → copy the DSN → Vercel `SENTRY_DSN` (Production and Preview).
3. **Settings → Security & Privacy**: turn on **Data Scrubber** and **Prevent Storing of IP Addresses**. (ECONERA also removes e-mails, tokens and keys before sending.)
4. **Alerts → Create alert**: "a new issue is created" → e-mail to the owner.
5. Verify: `/api/health` → `errorMonitoring: true`. Errors are tagged with `environment` (production / preview).

## 5. Test accounts

Run on your own computer, in the project folder, after §1–§2:

1. Create a file `.env.staging` (it is git-ignored) with:
   ```
   STAGING_SUPABASE_URL=…staging project URL…
   STAGING_SUPABASE_PUBLISHABLE_KEY=…
   STAGING_SUPABASE_SECRET_KEY=…
   STAGING_INBOX=your-mailbox@gmail.com
   STAGING_CONFIRM=econera-staging
   ```
2. `npm run staging:seed`

The script refuses to run against the production project or without `STAGING_CONFIRM`. It creates (or updates) these confirmed accounts, all as `+econera-<role>` aliases of your mailbox:

| Role key | Who | Verification / staff role |
| --- | --- | --- |
| `buyer` | individual buyer | — |
| `seller-unverified` | seller who has not been verified | none (must be blocked from submitting) |
| `seller-individual` | verified individual seller | approved, individual |
| `seller-business` | verified business seller | approved, business (TEST company, TEST NIPT) |
| `reviewer-product` | product officer — first approval | `product_officer` + MFA |
| `reviewer-technical` | technical reviewer — second approval, inspections | `technical_reviewer` + MFA |
| `reviewer-seller` | seller officer — seller verification | `seller_officer` + MFA |
| `admin` | super administrator — partners, staff, everything | `super_admin` + MFA |

Passwords and authenticator secrets are written to `.staging-accounts.json` (git-ignored, readable only by you). For manual tests, add a staff account to Google Authenticator / 1Password by scanning or pasting its `totp_uri`.

## 6. Automated business journey (staging)

`npm run staging:journey` signs in as each account (with MFA for staff) and checks, against the real staging database rules:

1. an unverified seller can save a draft but cannot submit or publish it;
2. a verified seller lists a material, uploads a photo and submits it; it stays hidden;
3. other users cannot see the seller's documents, verification or files;
4. the seller cannot approve their own listing; staff cannot approve without a reviewed photo; the product officer reviews the photo and approves;
5. the listing appears in the public marketplace with an `EC-AL-` material passport and the seller is notified;
6. a buyer requests a quote; the seller sees it, another seller does not; invalid quantities are refused;
7. a business seller imports several drafts; they stay private;
8. partner management: application → private → approved by an admin → confirmed partner profile → hidden until published → public → unpublished;
9. every sensitive step is in the audit log.

Then the browser tests against the preview:

```
PLAYWRIGHT_BASE_URL=https://econera-git-phase-2-tema-diplomece.vercel.app VERCEL_PROTECTION_BYPASS=… ALL_BROWSERS=1 npm run test:e2e
```

## 7. GitHub Actions (Chromium, Firefox, WebKit)

The workflow is ready at `docs/ci/ci.yml` (it could not be written to `.github/` from here). To enable it:

1. github.com/SONIB2/econera → switch branch to `phase-2` → **Add file → Create new file**.
2. Name: `.github/workflows/ci.yml`. Paste the contents of `docs/ci/ci.yml`. **Commit changes** to `phase-2`.
3. Repository → **Actions**: if asked, click **I understand my workflows, go ahead and enable them**.
4. Every push and pull request now runs: type check, lint, unit and database tests, dependency audit, build, and the browser tests on Chromium, Firefox and WebKit (plus a phone viewport). Failed runs upload screenshots and traces.
5. Optional (to test the protected preview from GitHub): Vercel → Settings → Deployment Protection → **Protection Bypass for Automation** → create a secret; add it to GitHub → Settings → Secrets and variables → Actions as `VERCEL_PROTECTION_BYPASS`.
6. Optional: GitHub → Settings → Branches → add a rule for `v1-grant`: require the CI check to pass before merging.

## 8. Manual UAT checklist (authenticated workflows)

Use the staging preview, a desktop browser and a phone. Record pass/fail, date, tester and a screenshot for each line.

**Accounts and security**
- [ ] Sign up as buyer and as seller with a new +alias; confirmation e-mail arrives and the link signs you in on the preview address.
- [ ] Wrong password shows a clear error; five quick wrong attempts are slowed down.
- [ ] Password reset e-mail arrives and works; old password no longer works.
- [ ] Sign out on one device; protected pages redirect to sign-in.
- [ ] Buyer lands on the marketplace, seller on the dashboard.
- [ ] Staff account: admin pages ask for the authenticator code; without it no staff action is possible.
- [ ] Account → download my data: the JSON contains only your own data.

**Seller verification**
- [ ] Unverified seller: the dashboard explains that verification is required before listing; "Submit for review" is refused.
- [ ] Seller fills individual details, uploads ID; status becomes Submitted.
- [ ] Business seller fills company, NIPT (format L12345678A), representative, uploads business extract.
- [ ] Seller officer (with MFA) sees the request, opens the documents (signed links expire), requests more information with a reason → seller is notified and can resubmit.
- [ ] Seller officer approves → seller is notified; rejection without a reason is refused.

**Product listing and approval**
- [ ] Verified seller creates a listing with all fields in Albanian and in English; validation messages are clear.
- [ ] Upload photo (JPG/PNG/WebP ≤ 15 MB); a PDF disguised as an image is refused.
- [ ] Submit → listing shows "Pending review" and is not in the marketplace.
- [ ] Product officer: approval without an accepted photo is refused; reviews the photo, approves with a reason.
- [ ] High-risk listing (e.g. structural): needs a second approver and an inspection; the same person cannot approve twice.
- [ ] Reject with a reason → seller sees the reason and can edit and resubmit.
- [ ] Editing an approved listing sends it back to review.
- [ ] Seller unpublishes and archives a listing; it disappears from the marketplace.
- [ ] Bulk import (business seller): CSV with good and bad rows → good rows become drafts, bad rows are reported.

**Marketplace and quote requests**
- [ ] The approved listing appears in the marketplace (search, category and region filters, grid/list).
- [ ] The material passport page opens from the listing and from `/verify` with its `EC-AL-` code.
- [ ] Signed-out visitor: "Request a quote" asks to sign in.
- [ ] Buyer requests a quote (quantity, pickup/delivery, message); the seller is notified and sees it; another seller does not.
- [ ] Quantity above stock or below zero is refused.
- [ ] Buyer sees the request status on their account page.

**Partner management**
- [ ] Public "Our Partners" form: submit an application; validation and consent work; success message is shown.
- [ ] Admin → Partners: the application appears; request info / approve / reject with a note.
- [ ] Create a partner profile with confirmation reference and date; upload a logo only with "logo authorised" ticked.
- [ ] Hidden until published; publish → visible on `/partneret` in both languages; unpublish → gone.
- [ ] A non-staff account cannot open admin pages or change partners.

**AI tools (with keys and low caps)**
- [ ] AI Room Designer: upload a room photo, get a design; the result is labelled as AI-generated.
- [ ] SmartCut prescreen gives a result; voice assistant understands "parket lisi në Tiranë nën 15 euro".
- [ ] Set a daily cap to 1 → the second request shows "limit reached" and nothing is billed.
- [ ] `AI_DISABLED=1` → every AI tool shows "temporarily unavailable".

**Cross-cutting**
- [ ] Every page in Albanian and English; the language choice persists.
- [ ] Phone (iOS Safari, Android Chrome), zoom 200 %, keyboard only, screen reader on the main flows.
- [ ] Error page and 404 in both languages; a forced error appears in Sentry with no personal data.
- [ ] `/api/health` reports database ok, shared rate limits, Sentry and the AI caps.

## 9. Before production

1. Every line in §6 and §8 passed, with evidence.
2. Supabase production upgraded to Pro (daily backups) — see `docs/RECOVERY.md`.
3. Migration 0030 applied to production (SQL Editor, `supabase/migrations/202611270030_partners.sql`), after a backup.
4. Production variables from §2 added.
5. The owner approves; then `phase-2` is merged into `v1-grant`. Rollback: Vercel → Deployments → previous production deployment → **Promote to Production**.
