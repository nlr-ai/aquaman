import {readFileSync} from 'node:fs';
import {parse} from 'csv-parse/sync';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const report=JSON.parse(readFileSync('public/data/crosscheck/grid3-lagos.json','utf8'));
const raw=readFileSync('data/provider/grid3-original.csv');
assert.equal(createHash('sha256').update(raw).digest('hex'),report.csvSha256);
const original=new Map(parse(raw,{columns:true,bom:true,skip_empty_lines:true}).map(r=>[r.globalid,r]));
const manifest=JSON.parse(readFileSync('public/data/wpdx/index.json','utf8'));
assert.equal(report.wpdxCsvSha256,manifest.csvSha256);
const points=manifest.areas.flatMap(a=>JSON.parse(readFileSync('public/data/wpdx/'+a.file,'utf8')).points);
const sourceIds=new Set();
for(const [id,match] of Object.entries(report.matches)){
 assert(points.some(p=>p.providerId===id));assert(!sourceIds.has(match.sourceId));sourceIds.add(match.sourceId);
 const r=original.get(match.sourceId);assert(r&&r.wardcode.startsWith('LAS'));
 assert.equal(match.name,r.name);assert.deepEqual(match.coords,[Number(r.Y),Number(r.X)]);
 assert.equal(match.wpdxCsvSha256,manifest.csvSha256);
 assert(!('status' in match));assert(!('quality' in match));
}
for(const candidate of report.candidates){assert(!sourceIds.has(candidate.sourceId));sourceIds.add(candidate.sourceId);assert(candidate.nearestWpdx.length===3);assert(candidate.nearestWpdx[0].distanceM<=candidate.nearestWpdx[1].distanceM);}
assert.equal(sourceIds.size,report.summary.originalRecords);
assert.equal(Object.keys(report.matches).length,report.summary.exactIdMatches);
assert.equal(report.candidates.length,report.summary.unresolved);
assert.equal(points.length,1829,'Source comparison must not add unresolved candidates to the map');
const osm=JSON.parse(readFileSync('public/data/osm/lagos.json','utf8'));
assert.equal(osm.licence,'ODbL 1.0');assert(osm.attribution.includes('OpenStreetMap'));
assert.equal(osm.records.length,84);assert.equal(new Set(osm.records.map(r=>r.sourceId)).size,84);
for(const r of osm.records){assert.equal(r.status,'Unknown');assert.equal(r.quality,'Unknown');assert(r.coords.every(Number.isFinite));assert(!('uid'in r));assert(!('user'in r));assert(!('nearestWpdx'in r));assert(r.sourceUrl.startsWith('https://www.openstreetmap.org/'));}
console.log(`Crosscheck passed: ${report.summary.exactIdMatches} exact source links, ${report.candidates.length} unresolved candidates, unchanged 1,829-point catalogue and no safety claims inferred.`);
