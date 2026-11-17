# Deployment

| Setting | Development | Evaluator environment | Production |
| --- | --- | --- | --- |
| `APP_ORIGIN` | `http://127.0.0.1:3000` | Dedicated HTTPS hostname | Canonical HTTPS hostname |
| `NEXT_PUBLIC_SUPABASE_URL` | Local API | Unset for read-only tour or dedicated demo project | Dedicated production project |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Local publishable key | Unset with no backend or matching demo key | Matching production publishable key |
| `PILOT_CONTACT_EMAIL` | Optional | Approved public address | Approved public address |
| `ECONERA_PREVIEW` | Optional | `1` to suppress indexing and sitemap entries | `0` |

Set environment variables before building and align build and run settings. The pilot address appears as a direct mail link when configured.

Vercel previews use `VERCEL_URL` over HTTPS when `APP_ORIGIN` is unset. For authenticated previews, choose a stable preview origin, use it for `APP_ORIGIN` and allow the exact callback URLs in the separate Supabase project. Vercel Preview deployments suppress search indexing by default. The app rejects local HTTP database URLs and privileged database keys on hosted builds. Keep local environment files out of uploads. The CLI ignore file excludes them.

## Netlify Free

Import `SONIB2/econera` into an ECONERA site on a Netlify Free team. Select the repository root, Node.js 24 and `sonib2` as the eventual production branch. `netlify.toml` runs the normal Next.js build. Netlify's maintained OpenNext adapter packages the dynamic app, and GitHub Actions continues to run independently. Use a Deploy Preview or draft deployment for verification before publishing to the production branch.

Set site-level values by deploy context in Netlify. For a preview, set `ECONERA_HOSTED=1`, `ECONERA_PREVIEW=1`, and `APP_ORIGIN` to its stable HTTPS preview origin. On production, set `ECONERA_HOSTED=1`, `ECONERA_PREVIEW=0`, and `APP_ORIGIN=https://econera.al` after the domain is ready. Netlify's build-only context variables provide a preview origin at build time. Explicit site-level values cover the running server and Auth redirects. Use only the hosted project URL and publishable key in the two Supabase variables. Keep the database password, management token, SMTP password, and privileged API keys outside Netlify.

The application uses Next.js server rendering and Server Actions for auth, listings, moderation, quotes and organizations. Its HTTP route handler exchanges Auth confirmation and recovery codes. The Next.js proxy refreshes session cookies and sets locale headers. Supabase supplies Auth and RLS-backed PostgREST. Three.js runs in the browser and requests static assets from the CDN. There are no application storage buckets or upload flows. Next.js image optimization and dynamic page requests draw on hosted resources.

Netlify Free includes 300 monthly credits with a hard cap and no auto recharge. At current rates, 300 credits cover at most 15 GB of web transfer if there is no other usage. Production deploys, requests and server compute also consume credits. Run the grant demo as a low-traffic pilot and check usage before sending invitations. Cloudflare Workers Free is an alternative to evaluate separately because its OpenNext adapter currently lacks Node.js middleware support. [Netlify Free terms and limits](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/) · [Netlify Next.js adapter](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/) · [Cloudflare OpenNext support](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/)

With a reachable read-only preview and a browser installed, set `PLAYWRIGHT_PREVIEW_URL` to the HTTPS address and run `npm run test:e2e`. The read-only suite assumes the Supabase variables are absent. Validate database-backed login and quotations separately using approved test identities and isolated inventory.

After Host.al activates the domain and the preview is approved, assign both `econera.al` and `www.econera.al` in the Netlify site. Set the apex as primary and copy the site's exact assigned DNS records into Host.al. Preserve mail and unrelated records. Verify both HTTPS variants and the `www` redirect.

## Previous Vercel configuration

The included `vercel.json` selects the native Next.js runtime. Vercel Hobby is for personal, non-commercial use. Confirm the appropriate plan and approve any charges before creating an ECONERA launch project. Use a user-owned repository, hosting project and Supabase organization. [Vercel plans](https://vercel.com/pricing) · [Supabase plans](https://supabase.com/pricing)

For a read-only grant preview, set `ECONERA_PREVIEW=1` and omit both Supabase settings. The tour uses isolated code fixtures. An authenticated preview needs its own Supabase project and synthetic accounts. Apply hosting access protection if the preview is private. An indexing directive gives crawlers instructions and leaves the URL accessible.

After repository and hosting access are configured, run `npx vercel` from the project folder to create a preview. Check the resulting HTTPS URL using a signed-out browser and separate staging test accounts if authentication is enabled. Run `npx vercel --prod` only for the approved production project after reviewing the preview and release gates.

Before connecting Git, review which branch Vercel will treat as production and whether importing the repository triggers an initial deployment. The GitHub default branch is `sonib2`. Keep the first evaluator deployment in Preview and review its protection setting before sharing a URL.

For a provisioned cloud database, run the following in the approved project context with the project's migration credentials. Use the migration files and avoid importing local snapshots.

```sh
supabase login
supabase link --project-ref <approved-project-ref>
supabase migration list --linked
supabase db push --dry-run
supabase db push
```

Set the hosted Supabase Auth Site URL to the deployed application origin. Allow the exact `/autentikim` and `/autentikim?flow=recovery` callbacks for that environment. Install the branded confirmation and recovery templates from `supabase/templates/` in the hosted Auth dashboard and verify them with the chosen SMTP service. Keep recovery and confirmation links on the correct origin. Configure Auth limits and CAPTCHA where appropriate before opening writes. The application currently has no user file uploads. Review private bucket policies and signed access before introducing them.

1. Use Node.js 22 or newer with the npm lockfile. Run `npm ci`, `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`. Run the production browser and connected suites as described in the README. Use a native Next.js adapter or a reverse proxy in front of the self-hosted loopback listener.
2. Rehearse pending migrations against isolated staging. Back up populated data. Confirm the intended Supabase project, inspect its migration list and dry-run the push before applying it. Verify RLS and the publication and membership workflows on staging.
3. Configure Supabase Site URL and allowed callbacks for each environment. Verify email confirmation and password recovery with the intended SMTP provider. Store private automation credentials in the host secret manager. Keep service-role credentials and local mail capture out of the application configuration.
4. Attach the approved domain, set the DNS records requested by the host and provision managed TLS. Check HTTPS redirects, canonical URLs and language alternates. Enable HSTS at the production edge after the relevant hosts support HTTPS.
5. Complete the anonymous tour and staging account checks with separate identities. Keep local PostgreSQL, Supabase and Docker endpoints private.

Before launch, review the existing CSP and response headers, tune auth and operational rate limits, configure uptime and 5xx alerts with personal data redaction, and assign responsibility for security logs. Document backup retention and rehearse recovery into an isolated database. Review privacy and service terms, cookie disclosures where applicable, support, and data deletion procedures.

Public hosting, DNS, monitoring, rate-limit tuning and a recovery rehearsal remain open.

## Production release checklist

- [ ] Confirm domain ownership, DNS records, TLS and canonical origin.
- [ ] Verify hosted migrations, Auth redirects, SMTP, rate limits and public and protected routes with separate staging identities.
- [ ] Recheck anonymous catalogue exposure and seller, buyer and moderator RLS against hosted data.
- [ ] Confirm demo credentials and records live in an isolated environment.
- [ ] Configure error monitoring, log redaction and alerts. Verify backup retention and rehearse a restore.
- [ ] Review privacy and support information. If uploads are added, verify storage authorization before enabling them.
- [ ] Run the browser checks against the preview and verify the final domain after production approval.
