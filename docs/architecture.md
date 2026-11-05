# Architecture

Cart2Class uses one Next.js portal with role-scoped routes. Browser requests use the Supabase publishable key; sensitive provisioning uses only `scripts/create-demo-users.ts` with a server-only service-role key. Server route checks improve navigation and UX, while PostgreSQL Row Level Security remains the authorization boundary.

Mission content is immutable per `mission_versions`; attempts reference a version. Offline clients submit stable `client_event_id` values to make event receipt idempotent. Store-facing queries must use aggregate data only and never join student identities into returned results.
