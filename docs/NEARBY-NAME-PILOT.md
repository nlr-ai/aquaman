# Nearby-name pilot — Ikeja

Three WPdx points with exact source-ID matches to original GRID3 records have proposed names based on nearby named OSM streets or landmarks. These are suggestions, not official water-point names, addresses or walking directions.

| Point source ID | Proposed reference | Distance |
| --- | --- | --- |
| 6FR5H7RR+222 | Remi Akande (street) | 17 m |
| 6FR5H8RR+222 | Old Secretariat Road | 22 m |
| 6FR5J72R+222 | Christ Gospel apostolic Church | 147 m |

The app displays “Borehole · Near …” and “to confirm”, with the measured distance, source link and retained two-word nickname. For these three points only, the displayed map position uses the original GRID3 coordinates that underpin the suggestion; neither the position nor name has been locally verified. WPdx source coordinates and identities remain unchanged in Supabase. New approved location reports disable the suggestion and retain the nickname. All other points retain their existing names and positions.

Named OSM roads are measured against their line segments, not a centroid or nearest vertex. Named landmark footprints use boundary distance, or zero inside a polygon. Thresholds are 100 m for streets and 150 m for public landmark categories. The nearest eligible feature is selected. Three candidates per point remain in the data for review. No point is added, merged, marked working, declared public or classified as safe.

The suggestions are a separate layer, gated by the WPdx CSV hash and exact original coordinate match. Unavailable, stale or mismatched layers fall back to existing nicknames and positions. Existing local names are not replaced. API failures do not trigger invented names.

Overpass requests returned 406/429 during this run. As a bounded fallback, three small read-only OSM Editing API map extracts were downloaded around original GRID3 positions. These cached extracts are ignored by Git. There are no per-visitor geocoding requests. This is a small pilot, not an API strategy for national batch geocoding.

Reproduce using `npm run provider:landmarks`; it reuses cached raw extracts, or downloads the three small areas if absent. `-- --refresh` explicitly refreshes them. Run `npm run test:landmarks` for geometry distances, snapshot guards, name preservation and unchanged point count/status. The app reads `public/data/landmarks/ikeja-pilot.json`.

OSM feature geometry and proposed references retain © OpenStreetMap contributors attribution and [ODbL terms](https://www.openstreetmap.org/copyright). Original point positions are attributed to GRID3 via the [WPdx source catalogue](https://catalog.waterpointdata.org/datasets/grid3-nigeria-water-points-61ae7cd9/). The layer records both sources; it does not replace the source inventory's licence.

Next: local review of the three suggestions, then a bounded expansion with an appropriate cached extract/geocoding service. Do not use rounded WPdx coordinates to assert an exact street address.
