# ECONERA — Construction Intelligence

An Albanian-language construction materials catalogue with private seller inventory and a moderated publication workflow. The application uses Next.js, TypeScript, Supabase Auth and PostgreSQL.

The homepage opens an immersive Three.js prototype. Activate the ECONERA mark, open the door, and select the brick wall to inspect approved inventory and request a quotation. The [world notes](docs/IMMERSIVE-WORLD.md) detail the routes, controls and art scope. The original five-category cutaway and pavilion builder are still available under `/tregimi`. See the [Explorer design and roadmap](docs/EXPLORER.md).

The masonry hotspot opens the interactive studio at `/materiale/murature`. Choose a wall type to compare published lots. A signed-in buyer can send a quotation request from a material detail page. The buyer and seller can review it at `/inventari/ofertat`.

After ordinary sign-in or email verification, ECONERA opens the private dashboard at `/paneli`. Create an organization under `/paneli/organizatat` or join with a code issued for your verified email. See the [Phase 1 audit](docs/FOUNDATION-AUDIT.md).

## Run locally

Use Node.js 24 LTS and npm.

```sh
npm ci
npm run dev
```

Open [ECONERA locally](http://127.0.0.1:3000). The homepage, category navigation and catalogue filters are available before database configuration. Account and catalogue actions show a clear unavailable state until the database is connected.

Open the project folder in VS Code and select **ECONERA Next.js** under Run and Debug. Stop an existing development server before starting a second one on port 3000.

The grant walkthrough is available at [Shqip](http://127.0.0.1:3000/sq/platform) and [English](http://127.0.0.1:3000/en/platform). The renderer and showcase are bilingual. Existing catalogue and account forms are Albanian.

On the original Windows workspace, a portable Node and npm were installed under ignored `.tooling/`. If Node is still absent from PATH, these PowerShell commands use that runtime from the project folder.

```powershell
$env:Path = "$(Resolve-Path '.tooling/node/package/bin');$env:Path"
node .tooling/npm/package/bin/npm-cli.js run dev
```

## Connect a local Supabase database

1. Install and start a Docker-compatible runtime and install the Supabase CLI 3.2 or newer. The project already includes configuration and migrations. [Supabase local setup](https://supabase.com/docs/guides/local-development)
2. Start Supabase from this directory with `supabase start`. Run `supabase status` to get the local URL and publishable key. If using an existing local stack, review pending migrations and apply them locally with `supabase migration up --local`.
3. Copy `.env.example` to `.env.local`. Fill in the local URL and publishable key. Keep `APP_ORIGIN=http://127.0.0.1:3000` and restart Next.js. Do not use a secret or service-role key.
4. Register and open the confirmation email in the same browser context using local Mailpit at `http://127.0.0.1:55324`. Repeat with a separate address for the pilot moderator. [Testing Supabase email flows](https://supabase.com/docs/guides/auth/testing-auth-flows)
5. From a privileged SQL connection, verify the moderator's Supabase Auth UUID. Use the statement below with that consciously selected UUID in the local or approved staging database. The moderator must sign in normally.

```sql
insert into public.platform_admins (user_id)
values ('<verified account UUID>'::uuid)
on conflict do nothing;
```

6. As seller, save a draft and submit it for review. As moderator, open `/administrim` and approve it. Check the public catalogue and material detail as a signed-out visitor. Withdraw and archive it through inventory. Check that it disappears from public discovery.

With local Supabase running and port 3000 available, run `npm run test:supabase` to exercise the same flow with fresh local test accounts, Mailpit, and an isolated anonymous browser session. It reads the local URL and publishable key from the CLI, starts its own Next.js server, and provisions the test moderator in the local database. Set `SUPABASE_CLI` to the absolute executable path if the CLI is outside PATH. The suite leaves its generated accounts and archived listing in the local database.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm audit --audit-level=high
```

The browser suite boots the production build and tests the public and disconnected account states on desktop and emulated mobile. Set `PLAYWRIGHT_BROWSER_CHANNEL=chrome` to reuse an installed Chrome. The SQL test runs the actual migration in embedded PostgreSQL with Supabase authentication roles and identity supplied by a test harness. A connected Supabase pilot requires separate Auth, PostgREST, email and browser checks.

## Release gates

Build and check a hosting-style deployment with `npm run build` and `npm run start`. The [deployment runbook](docs/DEPLOYMENT.md) covers separate hosting environments, migration commands, hosted Auth settings and release checks. Assign a real HTTPS origin before deploying. The included Vercel configuration assumes the Next.js framework preset.

See [implementation status](docs/IMPLEMENTATION_STATUS.md), [operations and privacy](docs/OPERATIONS.md), and [grant readiness](docs/grant-readiness/README.md). No public hosting or cloud database is needed to run the local checks. The architectural hero is generated editorial artwork. It depicts no actual listing or property.
