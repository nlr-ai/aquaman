# Aquaman prototype

Mobile-first English water-point discovery and a local persistent reporting/moderation workflow, using fictional data only. Built with React, TypeScript, Vite and a lazily loaded Leaflet map with standard OpenStreetMap tiles. Fonts are served from the app through Fontsource packages.

## Run

```sh
npm install
npm run dev -- --port 5173
```

Open http://127.0.0.1:5173/. `npm run build` runs TypeScript checking and generates `dist/`. `npm run preview` serves that production build locally.

## Implemented

- Area choice and optional browser geolocation, with manual selection remaining available.
- Ajegunle demo list with four fixtures, filters, approximate straight-line distances and missing-coordinate handling.
- On-demand OSM map, accessible markers, selected-point sheet and point details.
- Dated availability, separate unknown water quality or explicitly fictional test information, source and history.
- Empty area and no-matching-filter states.

## Boundaries

The second burst provides a **localhost development backend** through Vite middleware and SQLite at `data/aquaman.sqlite`. It persists submissions, sessions and moderation audit events across restarts. The first start generates a local moderator password in `data/moderator-password.txt`; open that file locally to sign in through the Moderator tab. The entire `data/` directory is ignored by Git. Do not publish it or the password.

Use Add point or Report an update on a detail page, review and send, then keep the report reference. The moderator queue supports community approval, rejection and follow-up. Only published reports affect the public list and dated history. Drafts use sessionStorage in the current tab; this is not offline synchronization.

The Supabase adapter is now configured in `.env.local`, with moderator email/password authentication and scoped database RPCs. The remote schema is installed and anonymous report/status APIs have been verified. The two requested moderator accounts are authorized; see `supabase/SETUP.md`. The UI does not fall back to saving cloud reports in SQLite. For the previous complete local workflow, select `VITE_DATA_BACKEND=local` and restart Vite. `npm run preview` never provides the SQLite development API; after the migration, Supabase mode uses the browser SDK and can run from a static build. No production deployment is provided.

Coordinates and consent are now supported in reports; Supabase mode also supports compressed photos and thumbnails. A private JPEG-only bucket keeps unapproved photos restricted to moderators. The public detail loads a signed thumbnail/full image only on request. Duplicate merging, corrections/retractions, news editing, qualified test review, real water-point import, routing and offline maps remain open. Points without approved coordinates remain list-only. Search is an area-name demo, not a geocoder. Physical-device location has not been validated. The map has real geography but all points and test results are demonstration data.

The prototype uses the core Claude design colours, typography and card structures. Full navigation, other screens, extended-language fonts, complete accessibility validation and physical-device tests remain in TODO.md. Do not use it to locate drinking water.

## Verification performed

On 28 October 2026: production build and TypeScript passed; in-app browser confirmed area selection, four-point list, test filter, test-detail limitations, OSM tiles and markers, marker selection to detail, and the empty Makoko fixture area. The browser's narrow viewport was visually inspected. No claim is made about physical-device, offline or geolocation-permission testing.

Second burst: the browser created a report, recovered its draft after a reload, submitted it and displayed pending status. API moderation published that report and an availability update; the browser showed five Ajegunle points after a server restart. SQLite readback confirmed persisted review events. `npm test` (with the dev server running) exercises validation, unauthenticated access, pending privacy, idempotent retries, follow-up, approval, rejection, repeated-review conflict, public-field restrictions and logout. Tests create clearly fictional records. Staff login/review is API-tested; the full staff UI and physical-device flows still require further review.

## Coordinates and photos

Migration 002 adds validated coordinates and photo references; 003 limits the pilot photo bucket to 1000 objects (including thumbnails). The app re-encodes selected images, removing source metadata, and requests permission to publish point coordinates and photos. This is not a private-location submission feature: coordinates become public when approved. Draft text/coordinates survive a tab reload; a selected photo needs re-selection unless it already uploaded. Failed/abandoned uploads can remain private and require a future cleanup job. Signed photo links expire after 60 seconds; expiry is not instantaneous revocation.

`npm run migrate` lists pending migrations and checks installed hashes; `npm run migrate -- --apply` applies them using the local Management API token. Do not modify an already applied migration. `npm run test:media` uses a synthetic test image in `data/verification-photo.jpg`, creates a temporary Auth moderator, checks live upload/privacy/review/public image access and removes its fixtures. It never uses a human moderator password. `npm run test:supabase` also covers coordinate/consent and photo policies on local PostgreSQL; its Storage tables are test doubles, so live Storage checks remain necessary.

On 28 October 2026, live media checks and browser manual-coordinate projection checks passed. Physical camera/GPS and the browser file-picker/compression UI still need validation. The public tunnel serves the latest rebuilt static assets; cloud schema changes apply independently of that build.

The contribution position picker now uses an on-demand OSM map with a centre pin: move/tap the map, confirm, then grant publication permission. Coordinates remain available in a collapsed fallback. Migration 004 adds short grouped references and backfills existing reports while keeping stable internal IDs and legacy status lookups. The receipt and moderator queue display readable references; copy and case/hyphen-tolerant lookup are supported. Browser and live API verification passed on 28 October 2026.

## Editorial and duplicate management

Supabase migrations 005/006 add point-merge mappings and editorial events with moderator-only mutation RPCs. Public reports resolve canonical points without destroying source payloads. Moderator text correction is deliberately limited to name, landmark and description. Retraction/restoration controls publication without deleting evidence; the public point page displays dated explanations, while previous payloads remain moderator-only. Merge is reversible. No automatic merging is based on proximity.

Editorial updates preserve the original publication timestamp used to order observations. New editorial timestamps belong to the audit events. Advanced editorial actions are Supabase-only; SQLite still supports basic approve/reject/follow-up. Related-point relationships and full structured point edits remain open.

`npm run test:editorial` creates and removes isolated live Supabase test records and an Auth moderator, exercising merge/undo, correction/audit, root retraction, public notices and restoration. Requires the local Management API token. `--keep` is for deliberate browser verification and writes temporary credentials only under ignored `data/`; finish with `node scripts/verify-live-editorial.mjs --cleanup`.

On 28 October 2026, local SQL and live API checks passed. An isolated browser origin verified moderator login, duplicate matching and merge/undo confirmations, restored public cards and editorial notices. Synthetic account, records and audit data were removed after testing. No human account password was used.
