# ECONERA Verify: setup, roles and limits

**Principle:** no listing becomes public without an explicit decision by an authorised human. This is enforced in PostgreSQL
(`supabase/migrations/202611250008_verify.sql`), not only in the interface. Tested end-to-end in `tests/verify-sql.test.ts`.

## 1. Apply the database changes (Supabase → SQL editor, in order)
1. `202611250007_tool_projects.sql` (AI tools, offcut columns)
2. `202611250008_verify.sql` (Verify: roles, documents, decisions, inspections, passports, disputes, audit, notifications, storage bucket `verify-docs`)

## 2. First Super Admin
After the migration, in the SQL editor (replace the email):
```sql
insert into public.staff_roles (user_id, role)
select id, 'super_admin' from auth.users where email = 'EMAILI-YT@example.com';
```
Then sign in at `/hyr`, open `/admin`, and set up MFA (authenticator app). **Every staff role requires MFA (aal2); PostgreSQL rejects staff actions without it.**
Enable MFA in Supabase → Authentication → Multi-Factor (TOTP).

Other staff: `/admin/stafi` (by user ID; by email when `SUPABASE_SECRET_KEY` is set on the server).

## 3. What is enforced by the database
- Listings reach `public_catalogue` (and the market, Smart Basket, SmartCut, AI Renovation, Voice, quotes) only when `approved` + `published` + quantity > 0.
- `verify_decide` is the only approval path. It rejects: missing reason, the seller's own listing, stale revisions, staff without the role or without MFA, prohibited materials, missing/expired/unreviewed mandatory documents (requirements matrix).
- High risk (structural, fire, electrical, pressure, or set by staff): verified seller **and** two approvals from different reviewers on the same revision.
- Any material change by the seller (description, condition, specs, origin, dimensions, documents fields, price) returns the listing to draft for a new review. Suspended listings cannot be edited back.
- Physical inspection counts only with a recorded inspection (inspector, qualifications, scope, lot) and an accepted report reviewed by another person. Seller photos never count.
- Nobody reviews their own document. Identity and business documents are never in any public view.
- `audit_log` is append-only (update, delete and truncate raise errors for every role). Document openings are logged.
- Suspension removes the listing from the catalogue, blocks new quote requests and notifies buyers who asked for quotes when the reason is safety or recall.
- `expire_listings()` takes listings with expired mandatory certificates out of the market and warns sellers 30 days before. Run it from `/admin` or schedule it (Supabase → Database → Cron: `select public.expire_listings();` daily).

## 4. Configuration
- Requirements matrix: `/admin/rregullat` (country, category, risk, intended use, document type). The Albania baseline is seeded. Before activating regulated categories in a new market (EU: Regulation (EU) 2024/3110 and its transitional provisions; UK; US), get qualified legal and technical review.
- Seller identifiers: Albania NIPT (`L12345678A`), Kosovo NUI (9 digits) validated in the database; others accepted as free text until rules are added.

## 5. Integrations not active (documented dependencies)
| Need | Status |
|---|---|
| Malware scanning of uploads | Not available. Uploads are limited to PDF/JPG/PNG/WEBP (checked by file signature), 15 MB, PDFs with JavaScript/auto-actions are refused, files are private. Add a scanner (e.g. ClamAV, Cloudmersive) before opening uploads to the public at scale. |
| Encrypted storage | Supabase Storage encrypts at rest (provider level). No application-level encryption. |
| Email notifications | In-app notifications work. Email needs a provider (Resend/Postmark) and a webhook on `notifications` inserts. |
| Registry checks (QKB, ARBK, CE/NANDO, certifiers) | Manual: reviewers tick "verified with issuer/registry" only after checking. No automatic API. |
| AI pre-screen | Rule-based checks always on. Claude summary needs `ANTHROPIC_API_KEY`; sends listing fields and document metadata only (no identity data or files). Always labelled preliminary. |
| Payments, escrow, refunds | Not active. ECONERA does not hold funds. Refund status is recorded; money moves through the seller or a future authorised payment provider. |
| Data retention | Policy to be set with legal advice; deletion of identity documents is manual (Storage + row) by a Super Admin. |

## 6. Wording rules in the product
Badges appear only from records: Verified Identity, Verified Business, Listing Reviewed, Documents Verified, Physically Inspected, Independent Certification Verified.
ECONERA is not presented as an accredited certification body, and the material passport is an internal traceability record, not an official Digital Product Passport.
