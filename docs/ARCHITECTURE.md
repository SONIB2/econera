# ECONERA architecture

The public showcase uses explicit language prefixes and a typed namespace dictionary. Its URL carries the current tour step. Tour fixtures live in the showcase module and operational links use existing authorization and publication gates. See [showcase boundaries](GRANT_SHOWCASE.md) and [environment settings](DEPLOYMENT.md).

Next.js renders the Albanian public website and private workspace. Server Actions validate mutations with Zod and use the signed-in user's Supabase session. PostgreSQL owns workflow constraints and row-level access. The public read model exposes a fixed list of fields for approved, published stock. Private inventory uses the base table through RLS.

The initial vertical slice goes from a verified identity to a private draft, a moderation request, administrative approval and public discovery. Inventory is owned by individual accounts in this slice. Profiles are private and writable only by their owners, with the signed-in account determining ownership at insertion. The catalogue reads from a separate projection. Organization isolation must be implemented and tested before business workspaces are offered.
