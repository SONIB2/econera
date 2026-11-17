# Operations and release requirements

## Staging and deployment

Use a Node.js host, HTTPS, separate staging and production Supabase projects, and explicitly approved database migration and deployment steps. Build and run `next build` and `next start`; the default npm scripts bind to the loopback interface, suitable for a local reverse proxy. Set `APP_ORIGIN` to the actual HTTPS origin at runtime and build time. Next.js server actions expect the reverse proxy to preserve the public host and origin relationship. Configure Supabase email confirmation, exact callback redirect URLs and transactional SMTP. Require a reviewed moderator onboarding and offboarding procedure.

Keep the app on a publishable Supabase key. Confirm effective authorization on the API, email verification and recovery, database roles and moderator audit records in staging. Add monitoring and alerting for authentication errors, query errors, mail failures and increased rejection counts. Configure and measure auth and API abuse limits. Perform indexed catalogue query checks at pilot volume before widening access.

Plan Postgres backups and point-in-time recovery according to approved service capabilities and volume. Record recovery time and data loss objectives, restore to an isolated staging database, and verify role and workflow consistency. Archive retains inventory for currently undefined retention periods.

## Privacy and safety review

Seek Albanian legal review for individual and business data, purposes and lawful bases, disclosures, rights requests, deletion and retention procedures, processor contracts and cross-border hosting. Before commerce, confirm seller disclosures, material provenance, liability, consumer terms, waste classification, transport requirements, and invoicing. Review the obligations for regulated or safety-critical materials. The moderation record speaks to publication permission only. Restrict the pilot to materials with an agreed risk review and require evidence for any safety claims.

No file uploads, card payments, AI calls, or environmental estimates are enabled in this slice. Review these separately as they are introduced.

## Performance and accessibility targets

Measure production pages on representative Albanian mobile connections. Target p75 LCP at most 2.5 s, INP at most 200 ms and CLS at most 0.1. Record sample size, device and conditions. Verify keyboard-only use, focus order, screen reader announcements and error recovery on Windows and a physical mobile device. Browser axe is one input to the WCAG 2.2 AA evaluation.
