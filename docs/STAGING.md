# Staging

| | Production | Staging |
| --- | --- | --- |
| Code branch | `v1-grant` (auto-deploys to www.econera.al) | any other branch, e.g. `phase-2` (Vercel preview URL) |
| Vercel environment | Production variables | Preview variables |
| Supabase project | `econera-preview` (current, real) | a second project, e.g. `econera-staging` (to create) |
| Data | real customers only | test accounts and invented listings only |
| AI keys | production keys with daily caps | separate keys with lower caps |

Rules:

1. Every change goes to a branch first. Vercel builds a preview link for it; GitHub Actions runs the tests (`.github/workflows/ci.yml`) on Chromium, Firefox and WebKit.
2. Preview deployments must use the **staging** Supabase project. In Vercel → Settings → Environment Variables, give `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` separate values for **Preview** and **Production**.
3. Migrations are applied to staging, tested, and only then to production.
4. A branch is merged into `v1-grant` only after the owner approves the preview.
5. Previews are never indexed (`robots.txt` disallows everything when `VERCEL_ENV=preview`).

Test accounts for staging (create them in the staging project only): buyer, individual seller, business seller, unverified seller, verified seller, super admin, product officer, seller officer. Use `@example.com`-style addresses you control, never real customer emails.
