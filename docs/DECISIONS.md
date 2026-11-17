# Architecture decisions

- Use a modular monolith with server-rendered routes and Supabase Auth and PostgreSQL.
- Missing connection settings display an unavailable state. Initial catalogue data comes from users after review.
- Start with personal inventory and moderation before introducing tenant memberships and transactional reservations.
- Use structured location, quantity, currency and condition filters. Currency is explicit for price filtering and sorting.
- Use scoped database grants alongside RLS. The app uses a publishable key and authenticated user sessions. Admin identities are provisioned through a privileged database connection.
