# Aquaman — Implementation TODO

Updated: 28 October 2026. The detailed checklist tracks the full product; see the first-burst record below for implemented partial scope.

## First burst — delivered prototype

- [x] React/TypeScript/Vite app and core Claude design styles, with locally served English fonts.
- [x] S1 area choice, S2 filtered list/map and S3 point details using four clearly fictional fixtures.
- [x] Lazy-loaded Leaflet/OSM map, marker selection and detail navigation; list-only record without coordinates.
- [x] Explicit demo labels, dated availability, unknown quality and fictional historical test details; empty area.
- [x] TypeScript/production build; browser checks of list, test filter, details, map markers and empty area.
- [ ] Physical-device tests, geolocation permission/denial tests, full accessibility and 320–430 px/200% zoom validation.
- [ ] Remaining public/moderator screens, backend and real-data import. Full checklist below remains pending except where explicitly covered by this limited burst.

## Second burst — local persistent contribution workflow

- [x] Add/update form, review, server receipt and private status reference; tab-scoped draft recovery and clear send failures.
- [x] Persistent local SQLite API with validation, idempotent submission, rate limits and separate pending/public projections.
- [x] Local moderator sign-in/session/logout, queue and review decisions: approve community report, reject or request follow-up, with dated audit events.
- [x] Approved new points and availability updates reflected in the public list/details, with original fixture observations retained.
- [x] Browser-created report → pending receipt → API moderation → public browser readback; persistence verified after server restart. API permission, retry, review and rejection checks passed.
- [ ] Supabase deployment/authentication/PostGIS migration: no Supabase project was configured for this burst. The SQLite middleware is a localhost development implementation, not a production backend.
- [ ] Photos, coordinate entry, duplicate merging, corrections/retractions and local-news editing remain open. The moderator uses one local identity; qualified quality-test review is not implemented.

## Supabase adapter — remote schema installed

- [x] Configure supplied project URL/publishable key in ignored local environment; add explicit local/Supabase backend selection.
- [x] Add Supabase Auth email/password moderator login and scoped RPC adapter for submissions, public reports, status and review.
- [x] Write transactional migration with private tables, RLS, restricted grants, moderator membership checks and dated review events. Keep privileged implementations outside exposed schemas.
- [x] Execute exact migration and permission/workflow tests on an isolated local PostgreSQL engine (`npm run test:supabase`).
- [x] Verify live publishable key, Auth endpoint and installed Aquaman RPCs (`npm run check:supabase`).
- [x] Apply `supabase/migrations/202610280001_aquaman.sql` to the authorized remote Aquaman project and record its hash/version.
- [x] Authorize the two requested Auth accounts as moderators. Password setup remains user-driven.
- [x] Verify live anonymous submission, idempotency, pending-status lookup, public isolation and denial of anonymous review; remove temporary test fixture. Confirm the browser no longer shows missing-schema errors.
- [x] Verify real Auth moderator sessions, queue/review and publication against the live project using an isolated temporary test account; remove test data afterward. The two human accounts’ own sign-in is not claimed as tested.
- [ ] Add per-client anti-abuse protection before public release; the migration's global submission cap is only a pilot circuit breaker.

## Third burst — coordinates and moderated photos

- [x] Optional latitude/longitude entry and on-demand device geolocation; explicit publication consent and bounds validation.
- [x] Coordinate pairs pass through report review and only approved positions update the public map. New areas are discoverable from published records; map bounds fit visible points.
- [x] Photo selection, browser-side JPEG re-encoding (max 1280 px / 350 KB), thumbnail (max 240 px / 30 KB), preview and publication consent. Photo bytes stay out of sessionStorage.
- [x] Private Supabase Storage bucket and restricted policies: moderators can inspect pending photos; anonymous users can read only published photos through short-lived signed URLs. Preview and full image load on demand.
- [x] Apply tracked migrations 002/003; add migration runner with hash checking and dry-run by default. Bucket restricts JPEG/350 KB, with a pilot-wide 1000-object circuit breaker.
- [x] Verify SQL consent/coordinate checks, pending photo isolation, real Auth moderator review and public signed-image download on live Supabase. Delete synthetic test account, images and reports afterward.
- [x] Browser-test manual coordinates, missing consent, recap, receipt, stored coordinates and public map projection; compile and rebuild the tunnel’s static site.
- [ ] Physical camera/GPS tests, browser upload/compression UI tests, per-client upload anti-abuse and scheduled cleanup of abandoned/rejected uploads remain open. API storage tests do not replace those device/UI tests.
- [ ] Full PostGIS catalogue remains pending; the first real historical import (WPdx Lagos) is now connected through per-area RPCs.

## Position picker and readable references

- [x] Lazy-loaded OSM position picker: pan/tap or use keyboard arrows, centre pin, explicit confirmation and publication consent. GPS remains optional; manual coordinates are an accessible fallback.
- [x] Human-readable references such as `AQ-7K3P-29DR-F6MX`, with copy action and grouped unambiguous characters. Internal IDs remain unchanged; legacy IDs and case-insensitive references without hyphens still resolve.
- [x] Backfill existing references in migration 004; retain compatibility in local SQLite mode.
- [x] Browser-test map movement, confirmation, recap and Supabase receipt. Verify saved coordinates and both reference formats through the live API; remove temporary test. Local API tests, PostgreSQL tests and production build pass.

## Editorial corrections and duplicate management

- [x] M4 comparison: suggest nearby/name-matching records, choose an existing target and explicitly confirm a merge with a public explanation. No automatic merge.
- [x] Merge projection preserves original records, provenance and observations; canonical points display combined histories without duplicate cards. Undo merge is available to moderators.
- [x] M5 text corrections retain previous payloads in the moderator audit. Corrections are limited to name, landmark and description; availability, quality and observation date are not rewritten by that editor.
- [x] Retract/restore published reports with public dated notices. Retracting an original point record also hides dependent updates; photo access follows the public projection, subject to previously issued signed-link expiry.
- [x] Preserve initial observation publication order during editorial edits, retraction/restoration and merges, so text edits do not reorder availability observations.
- [x] Apply migrations 005/006 and verify permissions, merge/undo, correction audit, retraction and restoration locally and against live Supabase with a temporary Auth moderator.
- [x] Browser-test moderator login, duplicate suggestion/comparison, merge confirmation, undo merge, public restored points and dated editorial history. Remove the test account and all fixtures afterward.
- [ ] These advanced editorial actions require Supabase mode; SQLite mode retains the basic review workflow. Related-point links, geographic duplicate queries in PostGIS and full canonical point metadata editing remain open.

Sources: `SPEC.md` and the [Claude design reference](https://claude.ai/artifact/CqtLLXUc6wtuAsogNrg6xU), including its “Design tokens, composants et règles” section, read on 28 October 2026. The design's Ajegunle locations, counts, reports and laboratory results are fictional examples, not a confirmed pilot dataset.

Release order: **V1 web map/list and community reporting → V1.5 Android and iPhone → V2 radio**. Read the design alongside this checklist for visual composition; this file records implementation work, not evidence of completed development.

## 1. Pilot decisions and implementation setup

- [ ] Confirm the pilot area, local reviewers and the initial field-verification process with Ike. Keep development fixtures separate from real data.
- [ ] Confirm what the prospective Clean Nigeria Initiative partnership can provide; record confirmed commitments separately from proposals.
- [ ] Establish a development and operating budget: hosting, map usage, storage, moderation, field visits, translation and water testing.
- [ ] Initialize React + TypeScript, routing, styling, development scripts and environment-variable documentation. Keep secrets out of the frontend and repository.
- [ ] Set up Supabase development configuration, versioned SQL migrations, PostgreSQL/PostGIS, moderator authentication and photo storage.
- [ ] Choose the pilot tile service: assess standard OSM tiles under their usage policy first; retain Google Maps or another provider as alternatives. Configure the provider without hard-coding it throughout the UI.
- [ ] Keep map attribution visible and provider conditions documented. Do not prefetch standard OSM tiles or use them for offline downloads. Monitor quotas if using a metered service.
- [x] Remove demo mode, fictional fixtures and fictional test results; display WPdx and moderated community data only.

## 2. Design system

- [ ] Implement reusable CSS tokens from the design reference:
  - Background `#FBF7F1`, white surface, muted surface `#F1EBE3`.
  - Main text/staff header `#2B2420`, secondary text `#6E625A`; tertiary `#8A7D73` only where contrast and text size permit.
  - Borders `#E6DDD1`, strong `#D9CEC0`, light `#EDE5D9`; disabled/dashed `#C9BBAA`.
  - Primary `#22659E`, hover `#174A75`; staff fields `#3A312C`, staff accent `#7FB2DE`.
  - Working `#2F7A52` / tint `#E5F1E8`; intermittent/pending `#9A6A12` / tint `#F6EDD6`, long text `#6B4A0C`; not working/urgent `#B5532E` / tint `#F7E6DD`.
- [ ] Self-host appropriately licensed Young Serif 400, Figtree 400/500/600/700 and IBM Plex Mono 400/500; verify extended Latin and Yoruba characters. Supply fallbacks that render immediately.
- [ ] Implement typography: welcome title 34/1.12; screen title 28/1.15; report receipt title 30; smaller serif titles 24–26; card titles 17/700; body 16–17/1.5; labels 15/600; metadata 14; tab labels 12/600; report ID mono 22 or 12 in queue. Express sizes in rem.
- [ ] Implement spacing scale `4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32`; screen margins 24 (28 on S1/S7), list gap 12, card padding 18 (16 staff), form-block gaps 20–22.
- [ ] Implement radii: pills 999, cards 20, groups/photo 18, search 16, controls 14, segmented control 12 (inner 9), tags 8, top of bottom sheet 28.
- [ ] Build buttons and inputs at 54 px high, focus ring 3 px with 2 px offset, secondary/approval/destructive/disabled states; textarea minimum 72 px. Use at least 16 px input text.
- [ ] Build availability chips, secondary quality indicators, dated metadata, imported dashed cards, single-choice chips, two-column availability options, radio rows, toggles and inline error messages.
- [ ] Use border-only list cards; reserve shadows for floating map controls, pins and bottom sheet, matching the reference.
- [ ] Build bottom navigation with Nearby / Updates / Add / Settings, List/Map switch and staff header. Hide public bottom navigation in S4–S7. Respect actual safe-area insets without duplicating browser/system bars.
- [ ] Replace placeholder geometric icons with consistent 24 px outline icons (2 px stroke), keeping text labels.

## 3. Data, provenance and display rules

- [ ] Model areas, water points, source records, observations, reports, media, test results, moderation events and local updates. Store observation, submission, import and review dates separately.
- [ ] Keep availability, access, price and quality distinct. Unknown is a real value, not an assumed negative or positive.
- [ ] Derive availability from the latest approved observation; pending reports never overwrite it. Retain contradictory and superseded observations in history.
- [ ] Default quality to unknown. Show “Test on file” only for a reviewed result, with sample date, parameter, units, sample location, tester, evidence and limitations. Never turn functioning status or a photo into a safety assurance.
- [ ] Use textual verification labels: Unconfirmed, Verified operational, Verified quality test. Quality indicators use blue/neutral styling, never a green safety badge.
- [ ] Display imported/unverified records with dashed borders, source and collection year, without implying a current availability observation.
- [ ] Implement approximate straight-line distance with `~`, rounded to 50 m below 1 km and 0.1 km above. Only calculate when both point coordinates and a reference position are known. Explain area-centre distances if supported; do not imply walking distance.
- [ ] Put records without calculable distances after known-distance records; keep points without coordinates in the list only.
- [ ] Agree the age threshold for switching relative dates to absolute dates; do not invent a universal freshness or test-validity threshold.
- [ ] Create public read models excluding private contacts, sensitive locations, unreviewed media and internal moderation notes; enforce access in the database/API, not only the interface.

## 4. V1 public screens and flows

- [ ] **S1 — Welcome/area:** manual area or landmark search first, optional geolocation second, available pilot areas and add-point entry. Denied location still permits the full manual flow.
- [ ] **S2 — Nearby/list:** implement card hierarchy (name/distance; type/access/price; availability/date and secondary quality), filters for reported working, test on file and public access. Handle loading, request failure and no matches.
- [ ] **S2 — Map:** load Leaflet and tiles only on demand; show eligible coordinates, availability pins, accessible labels and a selected-point bottom sheet leading to S3. Preserve filters and selection between list and map.
- [ ] **S2 — Empty area:** explain that no points are known, offer add-point and change-area actions, and avoid invented alternatives.
- [ ] **S3 — Details:** separate availability and quality blocks, access/hours/price with sources, optional tap-to-load photo, report history and last review. Link to update/correction flows.
- [ ] **S3 — Test detail:** show reviewed sample details and the explicit limitation that a historical test does not establish safety today.
- [ ] **S4 — Add point:** landmark/location, type, observed availability and observation date, with “Don't know” options. Provide optional photo, access, price, hours and private follow-up contact in the next step.
- [ ] **S5 — Update:** preselect the existing point; offer stopped working, working again, access/hours/price, appearance/taste change and other. Capture date and optional description/photo/contact without diagnosing contamination.
- [ ] **S6 — Review:** editable summary, public anonymity by default and explanation of moderation. Submit via a validated, rate-limited endpoint; prevent accidental duplicate reports on retries.
- [ ] **S6 — Failure:** distinguish sending, received and not sent. Preserve the draft to the extent actually implemented and test the exact lifecycle; match the wording to that behavior.
- [ ] **S7 — Receipt/status:** issue a non-guessable reference only after durable server receipt; copy/status lookup, received time and current review status. Show publication only when approved, and support rejection/follow-up honestly.
- [ ] **S8 — Updates:** area-based text feed with dates, source, explicit verification type, dated corrections and links to related points.
- [ ] **S9 — Settings:** English, optional available translations, permission explanations, report-status lookup and privacy information. Do not present unreviewed translations as usable options.
- [ ] Verify linked flows: S1 → S2 → S3; S2 → S4 → S6 → S7; S3 → S5 → S6 → S7; S8 → S3; S9 → status lookup. Preserve user input on back/edit actions.

## 5. V1 moderation

- [ ] **M1:** authorized sign-in/sign-out and session handling; residents can browse and submit without creating an account.
- [ ] **M2:** pending, follow-up and duplicate queues, area/date filters, urgency followed by oldest-first ordering; use actual counts.
- [ ] **M3:** review observation versus submission dates, media, source, conflicts and authorized private contact; approve community report, verify operational evidence, request follow-up or reject. Record reviewer, time and reason/evidence.
- [x] **M4 (merge scope):** compare and merge duplicates or keep them separate; preserve original observations and audit; support undo. Related-point links remain open.
- [ ] **M5:** publish corrections/retractions and reviewed tests with qualified-partner evidence. Keep operational verification separate from test review.
- [ ] **M6:** draft/publish/correct/retract local updates with area, date, source, verification type and related point. A label selector alone must not confer quality verification.
- [ ] Verify an end-to-end report: submit → persist pending → review → approve → update public point; separately check rejection, follow-up, conflicts and corrections.

## 6. Bootstrap real data and run the pilot

- [x] Download and inspect Nigeria WPdx data: imported 1,829 Lagos records in 20 LGAs, survey dates 2010–2019; provenance/licence retained; current availability and quality unknown.
- [ ] Build a repeatable import preserving source IDs and original observations. Flag suspect coordinates and possible duplicates; do not import GRID3 records twice or show predictions as observations.
- [ ] Agree public/restricted access handling and which sensitive point locations must be withheld or generalized.
- [ ] Locally check an initial sample; 20–30 points is a proposed starting target, subject to team capacity.
- [ ] Confirm how qualified test evidence can be reviewed and published, if available. Absence of tests must remain visible.
- [ ] Identify a moderation owner, follow-up process, correction channel and realistic response expectations.
- [ ] Define personal-data retention/deletion, photo handling and operational access before public launch.

## 7. V1 verification and release

- [ ] Compare implemented screens with the design in a real browser at 390 × 844 and widths 320–430, plus desktop. Test 200% text zoom, keyboard, screen reader labels and touch targets of at least 44 × 44.
- [ ] Measure text contrast (at least 4.5:1 for normal text), including amber and tertiary text; adjust failing pairs while preserving the design intent. Never convey status by colour alone.
- [ ] Confirm the list renders before fonts/images/maps; map and photos load only when requested. Compress photos to at most 1280 px, roughly 80% WebP/JPEG quality, and thumbnails to at most 30 KB.
- [ ] Test a representative low-cost Android phone, slow/intermittent connections, denied permissions, backend errors, retries and unknown/missing data.
- [ ] Test actual database permissions: public users cannot read contacts, moderation notes or pending evidence, or approve/edit published records.
- [ ] Add focused automated checks for status derivation, provenance preservation, moderation permissions, duplicate/retry handling and distance edge cases; complement them with browser and persisted-state evidence.
- [ ] Configure production hosting, backups and restore verification, error monitoring, quotas and costs; document rollback and maintenance ownership.
- [ ] Replace or clearly isolate all fictional examples before launching with real users. Run observed pilot sessions and fix problems finding a point or submitting an update.

## 8. Design clarifications to resolve during implementation

- [ ] Imported records: the overview suggests no precise distance for imports, but detailed rules say unknown distance when coordinates are absent. Calculate approximate distance from valid coordinates regardless of origin; retain an unverified-source label. Confirm with the design owner.
- [ ] Pending-review text: the design promises review before others see a submission but shows a public pending indicator. Decide whether the indicator is contributor-only or a permitted aggregate; never reveal pending report content publicly by accident.
- [ ] Privacy copy: distinguish a contributor's private location from a water point's public coordinates; a public map cannot simultaneously promise that all exact point locations are moderator-only.
- [ ] Language settings: show active languages only after review; any “in review” entries must be clearly non-selectable or omitted.
- [ ] Missing user location: do not claim “nearest” or display numeric distance without a defined reference position.

## 9. V1.5 — Android and iPhone

- [ ] Validate Capacitor reuse of React/TypeScript on real Android/iOS devices; assess map performance and accessibility before committing.
- [ ] Add and test optional camera/photo/location integration, permission denial and device safe areas; retain manual selection and text-only reporting.
- [ ] Define, implement and test any draft recovery or offline feature explicitly. Keep tile caching within provider terms.
- [ ] Prepare signing, developer accounts, privacy disclosures, store assets, testing and release ownership; budget devices/build access and fees.
- [ ] Verify Google Play and App Store releases independently, including backend workflows after installation; record limitations and update procedures.

## 10. V2 — Radio

- [ ] Agree the radio audience, geographic scope, languages, editorial staffing and access channels with Ike.
- [ ] Choose streaming/audio hosting and scheduling within an explicit operating budget; establish rights for voices, music and jingles.
- [ ] Build R1 player/station selection, R2 bulletin/text detail and R3 editorial scheduling using reviewed, dated information from V1.
- [ ] Support corrections and withdrawal of obsolete bulletins; preserve sources and verification labels in both text and audio.
- [ ] Validate playback and data use in practice; distinguish internet radio from any separately agreed FM or telephone distribution.

- [ ] Verify a small set of imported WPdx points on the ground with partners; gather current availability, recognisable local names and documented quality evidence.
- [ ] Add reviewed snapshot reconciliation and scheduled refresh after validating the first Lagos import.

- [x] Cross-check the original GRID3 source against WPdx by exact identifiers and expose original details without automatic merging.
- [ ] Review 771 unresolved original GRID3 records and 402 coordinate discrepancies over 100 m; resolve boundaries and duplicates before importing additional points.
- [x] Obtain a bounded 84-object OSM Lagos extract, preserve separate provenance/ODbL terms and expose on-demand proximity comparisons.
- [ ] Review the 68 OSM objects farther than 150 m from both inventories before treating them as additional water points.

- [x] Add labelled icons for water-point type, availability, access, price, quality, dates and navigation; use type icons and status indicators on map markers.

- [x] Add contextual “i” explanations in plain English for availability, quality, types, price/access, dates, distances, sources, comparisons and reporting; verify keyboard focus, Escape/outside dismissal and form safety.

- [x] Replace technical point IDs in primary labels with persistent, unique two-word nature nicknames; preserve source IDs and existing local names.
