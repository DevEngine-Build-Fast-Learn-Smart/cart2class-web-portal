# Authentication

Cart2Class authenticates through Supabase Auth. `src/features/authentication/actions.ts` uses server actions for password login and reset-link requests; session cookies are refreshed by `src/middleware.ts`. The server reads active profile and membership records before rendering a role route.

The publishable key is the only Supabase credential used by browser code. The service-role key is read solely by `scripts/create-demo-users.ts`, is never prefixed `NEXT_PUBLIC_`, and is required only to provision development accounts.
