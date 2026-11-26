# Backup, recovery and rollback

Checked 26 Nov 2026 in the Supabase dashboard (project `econera-preview`, organisation "ECONERA Free Preview").

## Current state

| Item | Status |
| --- | --- |
| Plan | Free |
| Scheduled backups | None. The dashboard states: "Free Plan does not include project backups." |
| Point-in-time recovery | Not available on Free (paid add-on on Pro and above) |
| Data at risk today | None: 0 users, 0 leads, 0 listings, 0 seller verifications (queried 26 Nov 2026) |
| Storage buckets | `verify-docs` (private). `partner-logos` (public) arrives with migration 0030 |

## Before real customers sign up

1. Upgrade the production project to Pro: daily backups, kept 7 days.
2. Add point-in-time recovery if losing up to a day of changes is not acceptable.
3. Storage files are not inside database backups. Copy the `verify-docs` bucket on a schedule, for example a weekly job using the Supabase CLI or S3-compatible API, into storage that only the owner can open.

## Restoring

- **Whole database (Pro):** Database → Backups → choose a day → Restore. This replaces the live data, so first use **Restore to new project** and check the copy before touching production.
- **One table or rows:** restore to a new project, export the rows, then import only those into production.
- **Test restores only in the staging project**, never in production.

## Migration rollback

Migrations live in `supabase/migrations` and run in name order. Each has a matching rollback below. Run a rollback in staging first.

**0030 partners** (removes partner management; applications stay in `leads`):

```sql
drop trigger if exists leads_review_audit on public.leads;
drop function if exists public.leads_reviewed();
drop table if exists public.partners;           -- also drops its trigger and policies
drop function if exists public.partners_audited();
drop policy if exists leads_staff_read on public.leads;
drop policy if exists leads_staff_review on public.leads;
revoke select, update on public.leads from authenticated;
alter table public.leads drop column if exists status, drop column if exists review_note,
  drop column if exists reviewed_at, drop column if exists reviewed_by;
drop policy if exists partner_logos_write on storage.objects;
drop policy if exists partner_logos_delete on storage.objects;
-- Empty the bucket in the dashboard, then: delete from storage.buckets where id = 'partner-logos';
```

**0020 leads partner source:**

```sql
alter table public.leads drop constraint if exists leads_source_check;
alter table public.leads add constraint leads_source_check check (source in ('kontakt', 'furnitore'));
```

## Application rollback

Production follows the `v1-grant` branch on Vercel. To undo a release, open Vercel → Deployments, find the previous production deployment, and choose **Promote to Production** (or **Instant Rollback**). This takes seconds and does not touch the database.
