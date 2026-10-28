# Aquaman — Product specification

**Status:** Working proposal for discussion with Ike Okuzu  
**Updated:** 28 October 2026  
**Pilot:** Nigeria; specific community and launch scope to be agreed

## 1. Purpose

Aquaman helps communities share local information about water. Ike's existing product brief describes an internet radio with country stations, water news, community reports and editorial moderation. The first version prioritizes a searchable map and list of water points, supported by community reporting and moderation. The radio described in Ike’s original brief moves to version 2 and can build on the same verified information and reporting workflow.

The first practical question is: **Where can I find a nearby water point, and what is actually known about it?** The service must distinguish location, availability and water quality. It must not represent a water point as safe simply because it is mapped, working or positively reviewed.

## 2. Users and situations

- **Resident:** finds nearby points and sees access, recent reports and known quality information.
- **Community contributor:** adds a point or reports an update with minimal effort.
- **Local collector or partner:** gathers reports in person or by phone and enters them on someone's behalf.
- **Moderator/editor:** checks submissions, resolves duplicates, publishes updates and prepares radio bulletins.
- **Listener:** hears relevant local water information and learns how to contribute.

Internet radio still requires connectivity and continuous listening consumes data. It is not, by itself, an access channel for people unable to afford internet. Local radio partnerships, phone, SMS or other channels are proposals to investigate, not confirmed features or partnerships.

## 3. Pilot and scope

Propose a single Nigerian city or community first; Ike and potential local partners choose it. A starting target of 20–30 locally checked points is a planning hypothesis, not a commitment or an estimate of available points. Confirm local access and moderator capacity before launch. English is suitable for the initial prototype; agree local languages and translation support with the community before deployment.

### Proposed MVP

1. A lightweight web experience with a list of nearby water points, and a map where connectivity and device allow. A user can manually select an area; device location is optional.
2. Individual point pages showing provenance, dates, availability reports, access details and any documented test results.
3. A short form to add a point or report a change, including optional photo and location; contributors can choose not to identify themselves publicly.
4. A moderation queue and a simple way for editors to approve, reject, merge or request verification.
5. A text feed of approved local updates where useful for the pilot. Radio streaming, audio bulletins and station scheduling are version 2.
6. Import and inspect existing open data where useful; clearly mark imported records and their age. Do not publish an unverified import as current fact.

### Later / subject to resources

Version 1.5: port the validated web MVP to Android and iPhone, with the same water-point and reporting workflows. Version 2: radio stations and streaming, audio bulletins, jingles and editorial scheduling. Also later or subject to resources: multiple countries, audio uploads, partner integrations, SMS, WhatsApp, telephone reporting, automated clustering and multilingual production. These are proposals, not commitments.

## 4. Water point information

Each point should keep individual observations and their provenance, rather than overwrite history with a single confidence score.

| Field | Meaning and handling |
| --- | --- |
| Identifier and name | Stable internal ID; optional local name or landmark. |
| Location | Coordinates and precision when available, community / locality and state; record who supplied it and when. |
| Type | Borehole, well, public tap, other or unknown. |
| Access | Public, restricted, private with permission, or unknown; hours and cost if reported, with dates. Never assume public access. |
| Availability | Working, not working, intermittent or unknown, based on a dated observation; record source and verification status. |
| Quality | Unknown by default. Store specific test details separately, including parameter, result and units, sample date, location, tester or lab, source and evidence, where available. |
| Reports | Date, description, category, source type and moderation status; retain conflicting reports. |
| Imported source | Dataset, record identifier, link, collection date, import date, licence and attribution. |
| Review | Moderator actions, verification evidence and last review date. |

A historical positive test is a dated result for the sampled parameters, not a promise that water is safe now. Do not turn a photo, clear appearance, source type, functioning status, AI estimate, or user votes into a safety claim. A credible test result needs review by an appropriate qualified partner and must be displayed with context and limitations. No fixed expiry period or universal safety badge is defined here; agree a policy with local water-quality professionals.

## 5. Core user flows

### Find a water point

1. Choose a location manually or grant optional location access.
2. See nearby points in a list sorted by distance, with a map as an additional view. Distance is approximate; unknown coordinates do not receive a precise distance.
3. Open a point and see type, access, price, recent dated availability observations, quality information, source and last review.
4. Filter by reported functioning or availability of a documented test, without treating either as a safety guarantee.
5. Submit a correction or problem report. If no points are known, show an honest empty state and invite a contribution; never invent a nearby alternative.

### Add a point or update one

1. Select **Add a water point** or **Report an update** on an existing point.
2. Enter location or a landmark, type, availability, description and observation date. Photo, price, hours and contact are optional; allow unknown for any detail not known.
3. Review and submit. Explain that the submission is pending moderation and is not proof of quality.
4. Assign a report ID; give a way to check status without requiring a public identity. A contact method is optional if follow-up is wanted.
5. On low connectivity, preserve a draft locally where supported and show clearly whether it was submitted; offline synchronization is a future enhancement unless implemented and tested.

### Moderate and publish

1. Review source, timestamp, location, media and possible duplicates; avoid relying on photos as proof of water safety.
2. Mark pending, approved as a community report, verified with named evidence, rejected, or needs follow-up. A verified operational observation is not a verified water-quality result.
3. Merge duplicates without losing provenance or contradictory observations. Record who reviewed and when.
4. Prioritize urgent reports for quick review; if an urgent unconfirmed report is aired, clearly say what is unconfirmed and link or direct listeners to relevant official emergency sources where available.
5. Correct or retract published reports when evidence changes, retaining a dated editorial history. Do not promise emergency coverage or imply that Aquaman replaces official alerts.

### Version 2: radio and editorial flow

Editors can turn a reviewed report into a short, dated bulletin with location, source, what is known, uncertainty and correction/update status. Radio messages invite residents to report or verify local points. Text versions and short on-demand audio may complement a continuous stream. Scheduling, staffing and the exact radio format must be agreed with Ike; audio does not imply an FM broadcast.

## 6. Data sourcing and bootstrap

- **WPdx:** explore [WPdx country downloads](https://www.waterpointdata.org/access-data/) and inspect the Nigeria dataset for the selected pilot area, report dates, coverage, fields and licence. [GRID3 Nigeria 2018–2020](https://catalog.waterpointdata.org/datasets/grid3-nigeria-water-points-61ae7cd9/) is one historic contributor already represented in WPdx and must not automatically be imported twice. WPdx entries may be old, incomplete or non-public.
- **Community:** solicit additions and corrections through the app and local collectors. Record an observation's date separately from submission time.
- **Partners:** Ike is discussing a possible partnership with Clean Nigeria Initiative and its director. It is not confirmed. Ask whether partners can identify a pilot area, supply or verify records, contribute staff and connect the project to qualified water-testing services.
- **Other open mapping data:** investigate OpenStreetMap as a possible supplementary source; review coverage, attribution, licence and duplicate handling before use.
- **Water-quality tests:** seek verifiable point-level test information from competent authorities, operators or laboratories; no existing test feed is assumed.

Import process: preserve original source and licence; validate coordinates and dates; distinguish missing values from negative values; identify duplicates for human review; retain provenance and mark records as unverified until reviewed. Measure coverage and freshness in the pilot before showing the data to the public. Predictions, if present in a dataset, must not be displayed as observed functionality.

## 7. Accessibility, safety and privacy

- Prioritize a fast, text-first list for low-data connections; load the map and images optionally, compress assets and avoid autoplay. Display timestamps and all essential information as text as well as audio.
- Support keyboard navigation, screen readers and adequate contrast; test on low-cost mobile devices and slow connections.
- Do not require continuous streaming to find an individual update. Explore offline and non-internet channels with local partners; none is presumed available in the MVP.
- Ask permission before using device location. Collect the minimum personal data needed; make public anonymity possible, restrict contact details and sensitive precise locations to authorized reviewers, and define retention and deletion policies before launch.
- Treat flood, contamination and other reports with care: distinguish reported, verified and unknown; provide a correction route and avoid unsupported assurances or definitive diagnosis.

## 8. Screens and flows

The following is a proposed inventory for the pilot. Screens may be combined on a small mobile interface; no screen implies that a feature is already implemented.

### V1 — Public screens

| ID | Screen | Main content and actions |
| --- | --- | --- |
| S1 | Welcome / choose area | Brief explanation; search or select an area; optionally use device location; entry to reporting. Manual selection remains available if permission is denied. |
| S2 | Water points — list and map | List sorted by approximate distance when a location is known; optional map and filters; point name, type, dated availability and quality status; select a point. Provide loading, error and no-results states and allow reporting a missing point. |
| S3 | Water point details | Location and landmark, access and price where known, dated availability observations, quality information and test details if documented, source and review dates, report history; actions to suggest a correction or report a problem. |
| S4 | Add a point | Location or landmark, type, observed availability, date and description; optional photo, access and price. Mark unknown fields as unknown. |
| S5 | Report an update | Existing point preselected; report type, observation date and description; optional photo and contact for follow-up. |
| S6 | Review and submit | Summarize contribution, explain privacy and moderation, edit before submitting. Show progress and a clear success or failure state; offer retry without claiming an unsent report was received. |
| S7 | Submission status | Report identifier and review status where available, accessible without exposing the contributor's identity publicly; avoid making identifiers a way to expose private details. |
| S8 | Local updates | Dated, approved text updates with area, source and verification status; open related point if available. |
| S9 | Language and privacy | Select available interface language; explain location and photo permissions, handling of contributions, contact and correction options. |

### V1 — Moderator screens

| ID | Screen | Main content and actions |
| --- | --- | --- |
| M1 | Moderator sign-in | Authorized staff authentication and sign-out. |
| M2 | Review queue | Filter by status, area, date and urgency; show pending reports and possible duplicates. |
| M3 | Report review | Inspect submission, point history, evidence and private contact where authorized; approve as community report, request follow-up, reject or mark verified with evidence; record reviewer and decision. |
| M4 | Duplicate and point review | Compare potential matches; merge or link records while retaining sources, conflicting observations and audit history. |
| M5 | Published point and corrections | Review a point, update or retract information, keep a dated history and distinguish operational verification from quality testing. |
| M6 | Local update editor | Create or correct a dated text update with area, source, verification label and link to related point; publish or retract. |

### V1 — Main flows

1. **Find water:** S1 → select area or optional geolocation → S2 → S3. If no points are found, S2 offers S4. A working point is not automatically safe to drink.
2. **Add a point:** S1 or S2 → S4 → S6 → S7. A submission enters the moderation queue; failure and retry are explicit.
3. **Report a change:** S3 → S5 → S6 → S7. The report is linked to the selected point and remains pending until reviewed.
4. **Review a contribution:** M1 → M2 → M3 → optionally M4 → publish, reject or request follow-up. If published, S3 shows its dated provenance and status.
5. **Correct information:** S3 → S5 → moderation via M2/M3 → M5 records and publishes a correction or retraction.
6. **Publish local news:** M1 → M6 → S8; readers can open the related point in S3 when available.
7. **Change location or language:** S1/S2 → manually choose another area; S9 → select an available language. Location permission is optional.

### V1.5 — Android and iPhone

Port the V1 public flows to Android and iOS. Add native permission prompts for optional location and camera/photo access, app installation and store onboarding as applicable, plus settings for permission status. Denied permissions must not prevent manual area selection or text reporting. Define and test draft recovery and offline behavior before promising them. Moderator access on mobile is a separate pilot decision.

### V2 — Radio

- **R1 Station / player:** select an available station, play or pause, control volume, see the current item and its date and verification label.
- **R2 Bulletin detail:** read the text, source and location for a bulletin; play short audio where available; open a related water point.
- **R3 Radio editorial and scheduling:** authorized editors prepare, review, schedule, correct or withdraw bulletins and jingles.
- **Radio flow:** approved local information → editorial review → scheduled bulletin → listener opens R1 or R2 → optionally opens S3 or submits an update. Continuous streaming and station availability depend on V2 implementation and operations.

## 9. Proposed technical stack and languages

These are recommended choices for the pilot, subject to Ike's experience, budget and infrastructure decisions. The V1 MVP is a mobile-first web application. V1.5 adds Android and iPhone applications; radio follows in V2.

| Component | Proposed technology | Purpose and constraints |
| --- | --- | --- |
| Web app and moderation interface | React and TypeScript | Shared technology for the water-point list, forms and moderator dashboard. Responsive, accessible and optimized for low-end phones. |
| Frontend hosting | Cloudflare Workers Static Assets; Pages alternative | Serve the static Vite build over HTTPS independently of the developer's computer. Supabase remains the backend. Deployment is prepared; account authentication and actual publication are still pending. |
| Map | Leaflet and an OpenStreetMap-based tile provider | Show point locations as an optional view. Choose a production tile provider after checking its terms, attribution, reliability and costs; OpenStreetMap data and tiles are distinct services. The text list must work without loading the map. |
| Database and geospatial queries | PostgreSQL with PostGIS | Store points and observations; index coordinates and query nearby points or map bounds. |
| Backend | Supabase | Managed PostgreSQL, authentication for moderators, storage for optional photos and backend APIs. Use server-side validation and appropriate row-level security; never expose privileged keys to the client. |
| Data import | Python or TypeScript | Inspect and import WPdx records, preserve provenance and licences, validate fields and flag possible duplicates for review. |
| Media | Supabase Storage, subject to cost review | Store optional compressed photos with access controls; prevent exposure of private contact information and unreviewed media. |
| Radio | Version 2 | Decide on audio hosting, streaming and scheduling after the map pilot; no streaming service is selected yet. |

The application should prioritize a lightweight, text-first experience, manual area selection and optional geolocation. Map tiles and photos should load only when needed. A progressive web app may enable installation and caching, but offline access, draft persistence and synchronization require explicit implementation and real-device testing; they are not guaranteed by choosing a PWA. Data hosting, provider limits, backups, operating costs and incident ownership must be reviewed before public launch.

### Frontend deployment — Cloudflare

The current Cloudflare project uses Workers Static Assets for V1, configured to publish `dist/` through `npx wrangler deploy`; Cloudflare Pages is an alternative. The initial Pages configuration was incompatible with the Workers Builds command and has been corrected. A local deploy dry-run passes; actual publication remains to be verified. The production source is `nlr-ai/aquaman`, branch `main`; build with Node 24 and `npm run build`, publishing `dist/`. Git integration is the preferred route for automatic deployments after pushes. A Wrangler direct upload is an alternative, but does not automatically configure Git integration.

Configure `VITE_DATA_BACKEND=supabase`, `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as frontend build variables. Administrator tokens and service-role credentials must never be included in frontend variables or published assets. The production build does not start the localhost SQLite API. Supabase Auth, database RPCs and private photo storage remain separate services.

Once the actual production address is available, add it to Supabase Auth's redirect allowlist and verify password setup/reset on that origin. Record the final deployment URL only after checking the deployed application. The temporary Cloudflare Tunnel is a development/demo link, not the permanent Pages deployment.

The Free plan is the pilot target, subject to current quotas and terms; no custom domain purchase is required to start with a Pages subdomain. Backend, map-provider and fieldwork costs are separate. At this stage the Pages configuration and deployment instructions are committed, but account authentication, publication, automatic Git deployment and production Auth redirect verification remain pending. See `docs/DEPLOYMENT.md`.

### Map options and pilot costs

The pilot can start with a no-fee map option, subject to usage terms. Keep the provider configurable, show attribution, and keep the text list usable if the map is unavailable.

- **OpenStreetMap standard raster tiles + Leaflet:** OSM data is open and its standard tile service can be used at no charge for appropriate interactive viewing. Follow the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/), including attribution, identification and caching. The service is best effort, without an SLA, and may block access. Bulk prefetching and offline tile downloads are prohibited. For offline maps, choose a provider that explicitly permits them or host suitable tiles independently.
- **Google Maps Platform:** the [pricing table](https://developers.google.com/maps/billing-and-pricing/pricing) currently lists 10,000 no-charge Dynamic Maps loads monthly for the web, followed by usage-based charges. Address search and geocoding have separate quotas and prices. The production Maps JavaScript API requires an API key and enabled billing; restrict keys and configure monitoring and limits. The pricing table lists unlimited no-charge Maps SDK usage, but confirm the actual V1.5 integration, additional services and applicable terms. Pricing and quotas can change.

Neither option supplies verified water-point safety data. A small pilot may incur no map-service charges, depending on eligibility, traffic and other APIs; hosting, maintenance and fieldwork remain separate costs.

### Version 1.5: Android and iPhone

Port the validated web MVP to Android and iOS, targeting release on Google Play and the Apple App Store. The proposed first approach is **Capacitor** around the existing React/TypeScript app, to reuse the interface and workflows; validate device performance, accessibility, map behavior, camera and geolocation permissions, and store requirements before committing to it. If the wrapper proves inadequate, reassess the approach. Supabase and PostGIS remain the shared backend; each platform must follow the same moderation and water-quality rules.

The port includes the map and list, manual area selection, optional location, point details, reporting with optional camera/photo access, and moderator-approved updates. Request device permissions only when needed and provide usable alternatives when denied. Installation does not by itself provide offline operation: any cached points, local drafts and later synchronization need explicit design, implementation and testing. Minimize app download size and data use.

V1.5 delivery includes real-device testing on representative Android phones and iPhones, low-connectivity testing, privacy disclosures and permissions, store listing assets, developer accounts, release and update ownership, and any applicable store review requirements. Account fees, available devices, publication timing and ownership remain to be confirmed. Do not assume an app has been published until each store release is verified.

### User-facing languages

Start the prototype in clear, simple English. Prepare interface text for translation from the beginning and allow users to select a language. Add a language based on the chosen pilot community and local user feedback; Yoruba and Nigerian Pidgin are possibilities to investigate for a Lagos pilot, not assumptions about every resident. Store community submissions in their original language and clearly identify any machine translation. Have local speakers review translations, particularly water-quality and urgent-alert language.

### Access for people without affordable data

A lightweight web app still needs connectivity. Explore assisted reporting through community partners and possible telephone or SMS channels; their implementation, funding and operational ownership are not yet established. Radio remains a version 2 feature and internet radio alone does not remove the connectivity requirement.

## 10. Pilot acceptance criteria

- A user can choose an area without giving location permission and can view a list even if the map is unavailable.
- Every displayed point identifies the source and observation date, or explicitly says they are unknown.
- A point with no documented test displays **Water quality unknown**; working or community approval never changes it to safe automatically.
- A user can submit a point or update, see whether it was sent, and understand that it is pending review.
- Moderators can review and publish or reject submissions, preserve provenance and correct a previously published item.
- An approved local update states its location, date, source and verification status in accessible text.
- The pilot dataset is checked for duplicate records and access restrictions, and a sample is verified locally with documented outcomes.
- The V1 experience is tested with real pilot users, on mobile and under constrained connectivity; alternative access channels are tested only if actually provided. Radio is outside MVP acceptance.
- For V1.5, both Android and iPhone builds pass device, permission, accessibility, reporting and low-connectivity checks; store publication is confirmed separately for each platform.

## 11. Measures of learning

Track points imported, locally checked, corrected and with unknown access or quality; median time to review a report; reports needing follow-up; and listener/use patterns where consent and privacy allow. Test whether people can find useful local information and report a change. Number of mapped points alone is not a measure of water safety.

## 12. Decisions and questions for Ike

1. Which exact map, list and contribution features are required for the first pilot?
2. Which community or city is the pilot, and who can verify records there?
3. For version 2, what role should continuous radio play, and is an existing stream or local broadcaster available?
4. What can the proposed Clean Nigeria Initiative partnership actually provide, and is it confirmed?
5. How can people without affordable data contribute or receive updates in the pilot?
6. Who moderates, how quickly, in which languages, and how are corrections handled?
7. Are any local test results available for specific points, with permission to publish and qualified interpretation?
8. What resources, budget, devices, timeline and accessibility requirements are available?
9. What is the legal entity, data governance, retention and consent policy, and who owns the operational response to urgent reports?

## References

- Ike Okuzu, *aquaman.fm — Product Overview*, supplied in conversation, 27 October 2026.
- [WPdx — Access Data](https://www.waterpointdata.org/access-data/).
- [WPdx — GRID3 Nigeria 2018–2020 metadata](https://catalog.waterpointdata.org/datasets/grid3-nigeria-water-points-61ae7cd9/).
- [WHO — Guidelines for drinking-water quality](https://www.who.int/publications/i/item/9789240121225).
