# Deployment notes

Use separate Supabase projects and environment values for development and production. Do not set `ALLOW_DEMO_USERS=true` in production. Configure the production Auth site URL and callback URL before enabling password recovery. Review retention, consent, deletion, push delivery, barcode provider, and offline check-in policy with A.L.M.A. before launch.
