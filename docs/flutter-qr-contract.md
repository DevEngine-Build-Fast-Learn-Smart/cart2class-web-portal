# Cart2Class student QR contract

The Flutter app uses the Supabase publishable/anon key only. It must never contain a service-role key.

1. Scan a student card QR (`cart2class://student/<credential-id>?token=<opaque-token>`), extract `token`, and call `start_student_device_session(p_student_qr_token := token)`.
2. Store the returned opaque `session_token` in platform-secure storage with its expiry. It represents one student device session and contains no child name, password, or learning content.
3. Scan a mission QR (`cart2class://mission/<code-id>?token=<opaque-token>`), extract `token`, and call `resolve_mission_qr(p_mission_qr_token := token, p_student_session_token := sessionToken)`.
4. Cache the returned mission version, ordered stage summaries, and any authorized assets required for offline work. The returned `mission_version_id` is immutable for the attempt.

`resolve_mission_qr` rejects a revoked or expired code/session, a draft/unapproved/unpublished mission, an unavailable assignment, and a student outside the assignment’s class. It returns no unrelated student data.

The existing `mission_attempts`, `mission_responses`, `sync_events`, and `reading_recordings` structures retain client event IDs for idempotent offline synchronization. A local completion is not a server completion until sync succeeds.
