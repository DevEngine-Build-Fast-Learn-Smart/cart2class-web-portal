# Cart2Class SQL reference

This directory mirrors the ordered migration files in `../migrations/` for review only. Migrations are the executable source of truth; apply them with the Supabase CLI or Management API in filename order. Keep each matching reference file byte-for-byte synchronized when a migration changes.

The browser-facing application uses the publishable/anon key and is constrained by Row Level Security. `scripts/create-demo-users.ts` is the sole development-only service-role operation; it must never run in production.
