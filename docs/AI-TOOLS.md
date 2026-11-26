# ECONERA AI Tools: configuration and status

Four modules live under `/ai`: **AI Renovation** (`/ai/renovim`), **Smart Basket** (`/ai/shporta`), **SmartCut** (`/ai/smartcut`) and **ECONERA Voice** (floating assistant on every page). Saved work is under `/projektet`.

## What works without any key
- Smart Basket: text, voice (browser speech), Excel `.xlsx`, CSV/TXT input; three plans (budget, balanced, eco) from real listings, transport estimate, budget, missing quantities, replace/remove offers, CSV export, save project.
- SmartCut: deterministic MaxRects packing with kerf, rotation, grain, defects, edge trim; chooses the cheapest offcut combination; zoomable SVG layouts; PDF cutting plan; sends offcuts to Smart Basket.
- AI Renovation: room, style, budget, preferences → material estimate with editable assumptions → market match → cost, savings, CO₂, PDF report, send to Smart Basket.
- Voice: search, follow-ups (cheapest/closest/compare), add to basket with confirmation, voice listing with read-back and confirmation (opens the listing form pre-filled), navigation, text size and high-contrast mode.

## Needs configuration (Vercel → Settings → Environment Variables, type **Secret**)
| Variable | Enables | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | Photo analysis in AI Renovation | Optional `ANTHROPIC_MODEL` (default `claude-sonnet-5-5`). |
| `OPENAI_API_KEY` | AI design images (before/after) | Optional `OPENAI_IMAGE_MODEL` (default `gpt-image-2.5-flare`; `gpt-image-1` was shut down on 23 Oct 2026). Paid per image. |
| `NEXT_PUBLIC_EUR_TO_LEK` | EUR → lekë conversion | Default 100. |

Photos are resized in the browser and sent only after the user ticks the consent box. The server does not store them. Limits: 6 analyses per hour and 4 images per day per IP (in-memory).

## Database (Supabase → SQL editor)
Apply `supabase/migrations/202611250007_tool_projects.sql`. It adds:
- `tool_projects` (per-account projects, RLS owner-only) for account sync (UI still saves in the browser until sync is wired).
- Offcut columns on `materials` (`length_mm`, `width_mm`, `thickness_mm`, `sheet_material`, `color`) and exposes them in `public_catalogue`. The listing form already has the fields; before the migration they are ignored safely.

## Data honesty
- Tools read approved, published listings from `public_catalogue`. Demo listings are added only to make the tools usable before the pilot, always tagged **demo** and never orderable.
- Transport, savings and CO₂ are labelled estimates. Material quantities are planning estimates, not certified calculations. AI images are labelled design concepts.

## Not done yet (next phases)
PDF material-list reading, floor-plan measurement extraction, real checkout/payments (kept off on purpose), project sync to `tool_projects`, server-side reservation of stock, logistics integrations, more languages/currencies.
