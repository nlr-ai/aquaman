# Supabase connection and installation

Project: `ffrtgkzllqwlkbnzisdh`. The supplied publishable key and URL are configured in ignored `.env.local`. This key is intended for frontend use and does not grant administrator access.

## Current state

The migration was applied to the live project on 28 October 2026 using the authorized Management API token stored locally. Live API checks passed for anonymous submission, idempotent retry, pending status, exclusion of pending content from public results and denial of anonymous moderation. The temporary test record was removed. The browser loads Supabase mode without a missing-schema warning. The two requested human moderator accounts are authorized. A separate temporary Auth moderator verified live login, queue, photo access and approval/publication; human account password setup and their own login remain user-driven. Existing SQLite demo contributions are not automatically uploaded. The installed migration hash is tracked in aquaman_private.schema_migrations.

## Install the database

1. Already completed for this project. For a new project, in the Supabase SQL Editor run the complete file `supabase/migrations/202610280001_aquaman.sql` once as the project owner. It creates only Aquaman objects in `aquaman_private` and six public RPC wrappers. It does not change unrelated tables or policies. The transaction fails rather than partially installing if objects already conflict.
2. Keep `aquaman_private` out of the API's exposed schemas. Raw tables have RLS enabled and no client grants; scoped functions provide public submissions/status and moderator-only queue/review. Public RPC wrappers run as invoker; privileged implementations have fixed search paths and explicit grants.
3. Create or identify a moderator account in Supabase Authentication. Use the account's existing email/password; do not put its password in application source or chat. The app does not register users or give ordinary users moderation rights.
4. In SQL Editor, explicitly add that user's UUID:

```sql
insert into aquaman_private.moderators(user_id)
values ('REPLACE_WITH_AUTH_USER_UUID'::uuid);
```

5. Restart `npm run dev` if needed. Header should say Supabase. Verify an anonymous report is pending and absent from public results, then sign in via Moderator, approve it and confirm publication in a fresh session.

## Verification

`npm run test:supabase` runs the exact SQL on an isolated local PostgreSQL engine with simulated Supabase roles and auth.uid(). It is not proof of live installation, real Auth sessions or Supabase API exposure. `npm run check:supabase` probes the configured live project without modifying data, reports missing RPCs and fails if setup is incomplete.

## Limits and deployment

This migration ports the current **fictional demo reporting workflow**. It is not yet the full production PostGIS water-point catalogue. Seed points 1–4 still live in frontend fixtures. New point IDs follow the prototype's deterministic derivation. Real-data import, PostGIS coordinates, photos, consent and point access controls require subsequent work.

Public submission is unauthenticated. A database-wide cap of 100 new reports/minute limits bursts but is not per-user/IP spam protection; add a protected submission gateway or another suitable anti-abuse mechanism before public launch. Public status references are unguessable; anyone possessing a reference can see only its minimal status. No private contacts are collected.

To return to local SQLite demonstration mode, set `VITE_DATA_BACKEND=local` in `.env.local` and restart Vite. This is an explicit operator choice, never an automatic fallback. `npm test` tests the separate local API, not Supabase.

Supabase mode uses the browser SDK directly and can run in a static frontend build after the database is installed. No service-role or secret key belongs in a `VITE_` variable. Moderator sessions use Supabase Auth rather than the old shared local password.

Migrations 002 and 003 are installed: moderated coordinates and private photo access, plus a pilot photo budget cap. The private aquaman-photos bucket was created through the Storage API (JPEG only, 350000 bytes per object). Review TODO.md for remaining cleanup, abuse prevention and physical-device checks.
