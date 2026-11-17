# Deployment

| Setting | Development | Evaluator environment | Production |
| --- | --- | --- | --- |
| `APP_ORIGIN` | `http://127.0.0.1:3000` | Dedicated HTTPS hostname | Canonical HTTPS hostname |
| `NEXT_PUBLIC_SUPABASE_URL` | Local API | Unset for read-only tour or dedicated demo project | Dedicated production project |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Local publishable key | Unset with no backend or matching demo key | Matching production publishable key |
| `PILOT_CONTACT_EMAIL` | Optional | Approved public address | Approved public address |
| `ECONERA_PREVIEW` | Optional | `1` to suppress indexing and sitemap entries | `0` |

Set environment variables before building and align build and run settings. The pilot address appears as a direct mail link when configured.

## Hosting configuration

The included `vercel.json` selects the native Next.js runtime. Vercel Hobby is for personal, non-commercial use. Confirm the appropriate plan and approve any charges before creating an ECONERA launch project. Use a user-owned repository, hosting project and Supabase organization. [Vercel plans](https://vercel.com/pricing) · [Supabase plans](https://supabase.com/pricing)

For a read-only grant preview, set `ECONERA_PREVIEW=1` and omit both Supabase settings. The tour uses isolated code fixtures. An authenticated preview needs its own Supabase project and synthetic accounts. Apply hosting access protection if the preview is private. An indexing directive gives crawlers instructions and leaves the URL accessible.

After repository and hosting access are configured, run `npx vercel` from the project folder to create a preview. Check the resulting HTTPS URL using a signed-out browser and separate staging test accounts if authentication is enabled. Run `npx vercel --prod` only for the approved production project after reviewing the preview and release gates.

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
