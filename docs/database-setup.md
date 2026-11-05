# Database setup

Apply the ordered files in `supabase/migrations` to the development project with the Supabase CLI. The matching `supabase/queries` files are readable mirrors, not a separate source. After migration, run `ALLOW_DEMO_USERS=true npm run create:demo-users` from a non-production environment.

Validate RLS with each demo login before shipping. In particular, confirm a store user cannot select `students`, `mission_attempts`, `mission_responses`, or `reading_recordings`.
