import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {geometryDistance} from './landmark-geometry.mjs';
import {applyNearbyNames} from '../src/NearbyNames.ts';
assert(geometryDistance([0,0],[[0,-.001],[0,.001]])<.001,'Distance must use the segment, not its distant vertices');
assert(geometryDistance([0,0],[[.001,-.001],[.001,.001]])>110);
assert.equal(geometryDistance([0,0],[[-1,-1],[-1,1],[1,1],[1,-1],[-1,-1]],true),0);
assert.equal(geometryDistance([0,0],[]),Infinity);
const layer=JSON.parse(readFileSync('public/data/landmarks/ikeja-pilot.json','utf8'));
const manifest=JSON.parse(readFileSync('public/data/wpdx/index.json','utf8'));
const all=manifest.areas.flatMap(a=>JSON.parse(readFileSync('public/data/wpdx/'+a.file,'utf8')).points);
const result=applyNearbyNames(all,layer);
assert.equal(result.length,all.length);assert.equal(result.filter(p=>p.nearbyLabel).length,3);
for(const point of result.filter(p=>p.nearbyLabel)){
 const original=all.find(p=>p.id===point.id),match=layer.matches[point.providerId],candidate=match.candidates[0];
 const feature=layer.features.find(f=>f.sourceId===candidate.sourceId);
 assert.equal(point.nickname,original.name);assert.equal(point.status,original.status);
 assert.deepEqual(point.coords,match.originalCoords);
 assert.equal(Math.round(geometryDistance(match.originalCoords,feature.geometry,feature.closed&&feature.kind==='landmark')),candidate.distanceM);
 assert(candidate.distanceM<=(feature.kind==='street'?100:150));assert(point.name.includes(' · Near '));
 assert.equal(applyNearbyNames([{...original,generatedName:false}],layer)[0].name,original.name,'Preserve local names');
 assert.equal(applyNearbyNames([{...original,coords:[0,0]}],layer)[0].name,original.name,'Do not replace changed coordinates');
 assert.equal(applyNearbyNames([{...original,provenance:{...original.provenance,csvSha256:'different'}}],layer)[0].name,original.name,'Reject comparisons from a different snapshot');
}
assert.deepEqual(applyNearbyNames(all,null),all);
console.log('Landmark pilot verified: 3 suggested names, actual street-segment/landmark geometry distances, coordinate and snapshot guards, local-name preservation, unchanged point count/status and retained nicknames.');
