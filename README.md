# Aquaman

**Find water nearby, and see what is actually known about it.**

Aquaman is a community water-information project initiated by **Ike Okuzu**. It helps residents discover local water points, share changes and consult information reviewed by community moderators. The initial focus is a pilot in Nigeria; the launch community and field partners are still to be confirmed.

V1 centres on a mobile-friendly map and list. Android and iPhone distribution is planned for **V1.5**. A water-information radio, part of the original aquaman.fm concept, follows in **V2**.

## What the prototype does

- Browse a list or on-demand OpenStreetMap view, with availability, access and test-information filters.
- Consult dated observations, sources, access information and report history.
- Submit a new point or update, with an optional map-picked position and compressed photo.
- Review before sending and track contributions with readable references such as `AQ-7K3P-29DR-F6MX`.
- Let authorized moderators approve reports, reject them or request follow-up.
- Keep pending reports and photos separate from published information.

**This demonstration uses fictional seed points and test results.** It has not been validated as a real-world water-finding service. There is not yet an imported, verified Nigerian water-point catalogue.

## Availability and water quality

A working pump does not establish that its water is safe to drink. Aquaman keeps availability, access and quality distinct. Quality is unknown without documented evidence; historical tests carry a sample date and limitations. Community approval and photographs do not establish potability.

The test example currently displayed is fictional. Qualified water-quality review and emergency operations remain outside the implemented scope.

## Stack

| Layer | Technology |
| --- | --- |
| Interface | React, TypeScript, Vite |
| Map | Leaflet and OpenStreetMap tiles, loaded on demand |
| Cloud | Supabase Auth, PostgreSQL RPCs and private Storage |
| Local alternative | SQLite behind a localhost-only Vite API |
| Presentation | CSS, self-hosted Figtree / Young Serif, Lucide icons |
| Planned mobile packaging | Capacitor, subject to device and store validation |

PostGIS is intended for the production catalogue; the current prototype stores validated coordinates in moderated report payloads.

## Run locally

Use **Node.js 24 or later**; the local API uses `node:sqlite`.

```sh
npm ci
```

Copy `.env.example` to `.env.local`. Select the self-contained local demo:

```env
VITE_DATA_BACKEND=local
```

```sh
npm run dev
```

Open `http://127.0.0.1:5173`. The first start generates a moderator password in `data/moderator-password.txt`; local reports persist in `data/aquaman.sqlite`. The entire `data/` directory is excluded from Git.

### Supabase mode

```env
VITE_DATA_BACKEND=supabase
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Install the ordered SQL migrations and private photo bucket using [Supabase setup](supabase/SETUP.md). Authorize moderator Auth users explicitly; ordinary accounts have no moderation rights.

The browser uses only the publishable key. Optional `SUPABASE_ACCESS_TOKEN` is reserved for migration tooling and must never have a `VITE_` prefix.

```sh
npm run migrate             # inspect pending migrations
npm run migrate -- --apply  # apply to the configured project
```

Confirm the target project first. Applied migration hashes are checked; later changes belong in new migration files.

## Build and verification

```sh
npm run build          # TypeScript and frontend production build
npm run preview        # static preview
npm run test:supabase  # isolated PostgreSQL permission/workflow tests
npm test               # local API tests; requires npm run dev
```

Local API tests create fictional verification records. The isolated SQL tests model Supabase roles and Storage tables; they do not prove a deployed project works. Live verification procedures and current evidence are in the [development notes](docs/DEVELOPMENT.md).

Supabase mode can use a static frontend after cloud installation. SQLite mode requires the development API. `scripts/serve-demo.mjs` serves only `dist/` on localhost port 4173 for temporary tunnels, excluding source files, environment files and the local API.

## Roadmap

| Release | Focus |
| --- | --- |
| V1 | Web map/list, contributions and moderation; ongoing work on duplicates, corrections, real data and pilot validation |
| V1.5 | Android/iPhone packaging, device permissions, testing and store publication |
| V2 | Water-news radio, audio bulletins and editorial scheduling |

Before a public pilot: establish real data provenance, local field verification and moderation, per-client abuse prevention, abandoned-upload cleanup, physical-device tests and stable hosting. SMS, WhatsApp and assisted reporting are possibilities to evaluate with partners.

## Project documents

- [Product specification](SPEC.md)
- [Implementation checklist](TODO.md)
- [Supabase setup](supabase/SETUP.md)
- [Development notes](docs/DEVELOPMENT.md)
- [Design reference](https://claude.ai/artifact/CqtLLXUc6wtuAsogNrg6xU)

Map data: **© OpenStreetMap contributors**. Standard tiles are subject to the [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/); no offline region downloads are implemented.

No open-source licence is granted by this repository at present. Third-party dependencies retain their respective licences.
