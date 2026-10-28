import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {loadPointNamer,pointDisplayName} from './point-names.mjs';
const namer=loadPointNamer();
const query='[out:json][timeout:60];area["ISO3166-2"="NG-LA"]["admin_level"="4"]->.lagos;(nwr(area.lagos)["amenity"~"^(drinking_water|water_point)$"];nwr(area.lagos)["man_made"~"^(water_well|water_tap)$"];);out center meta;';
let raw;
if(process.argv.includes('--cached'))raw=readFileSync('data/provider/osm-lagos.json');
else{const response=await fetch('https://overpass-api.de/api/interpreter?data='+encodeURIComponent(query),{signal:AbortSignal.timeout(70000)});assert(response.ok,'Overpass unavailable; retain the last valid snapshot');raw=Buffer.from(await response.arrayBuffer());mkdirSync('data/provider',{recursive:true});writeFileSync('data/provider/osm-lagos.json',raw);}
const data=JSON.parse(raw);assert(!data.remark,'Reject partial Overpass responses');assert(data.elements.length>0,'Review an empty extract manually');
const records=data.elements.map(e=>{
 const coords=[e.lat??e.center?.lat,e.lon??e.center?.lon];assert(coords.every(Number.isFinite));
 const tags=Object.fromEntries(Object.entries(e.tags||{}).filter(([k])=>['name','amenity','man_made','access','fee','drinking_water','check_date','survey:date','operational_status'].includes(k)));
 return {appNickname:tags.name?undefined:pointDisplayName(tags.man_made==='water_well'?'Well':tags.man_made==='water_tap'?'Public tap':'Water point',namer.nameFor('osm:'+e.type+'/'+e.id)),sourceId:e.type+'/'+e.id,sourceUrl:'https://www.openstreetmap.org/'+e.type+'/'+e.id,coords,coordinateKind:e.center?'Geometry centre':'Node position',tags,lastEdited:e.timestamp,version:e.version,status:'Unknown',quality:'Unknown'};
});
assert.equal(new Set(records.map(r=>r.sourceId)).size,records.length);
const snapshot={provider:'OpenStreetMap',attribution:'© OpenStreetMap contributors',licence:'ODbL 1.0',licenceUrl:'https://www.openstreetmap.org/copyright',query,osmBaseTimestamp:data.osm3s.timestamp_osm_base,retrievedAt:new Date().toISOString(),sha256:createHash('sha256').update(raw).digest('hex'),scope:'Lagos State administrative area ISO3166-2=NG-LA',limitations:'Separate OSM extract. Tags are mapper statements, not laboratory tests or current availability confirmation. Edit timestamps are not observation dates. No WPdx data or inferred matches are embedded in this separately licensed snapshot.',records};
mkdirSync('public/data/osm',{recursive:true});namer.save();writeFileSync('public/data/osm/lagos.json',JSON.stringify(snapshot));
function distance(a,b){const rad=Math.PI/180;const h=Math.sin((b[0]-a[0])*rad/2)**2+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin((b[1]-a[1])*rad/2)**2;return Math.round(6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h)));}
const manifest=JSON.parse(readFileSync('public/data/wpdx/index.json','utf8'));
const wp=manifest.areas.flatMap(a=>JSON.parse(readFileSync('public/data/wpdx/'+a.file,'utf8')).points);
const grid=JSON.parse(readFileSync('public/data/crosscheck/grid3-lagos.json','utf8'));
const precise=[...Object.values(grid.matches),...grid.candidates];
const comparison=records.map(p=>{
 const nearest=wp.map(w=>({providerId:w.providerId,area:w.area,distanceM:distance(p.coords,w.coords)})).sort((a,b)=>a.distanceM-b.distanceM)[0];
 const nearestOriginal=precise.map(g=>({sourceId:g.sourceId,name:g.name,distanceM:distance(p.coords,g.coords)})).sort((a,b)=>a.distanceM-b.distanceM)[0];
 return {osmId:p.sourceId,name:p.tags.name||'',coords:p.coords,nearestWpdx:nearest,nearestOriginalGrid3:nearestOriginal,review:'Spatial candidate only; identity and additional coverage are unconfirmed'};
});
const report={summary:{osmRecords:records.length,within75mOfWpdx:comparison.filter(p=>p.nearestWpdx.distanceM<=75).length,within150mOfWpdx:comparison.filter(p=>p.nearestWpdx.distanceM<=150).length,within75mOfOriginalGrid3:comparison.filter(p=>p.nearestOriginalGrid3.distanceM<=75).length,beyond150mOfBothInventories:comparison.filter(p=>p.nearestWpdx.distanceM>150&&p.nearestOriginalGrid3.distanceM>150).length},comparison,limitations:'Distance thresholds are review heuristics only. A nearby object may be a distinct water point, and a distant object may reflect rounded or incorrect coordinates. No automatic merge or new-point import.'};
writeFileSync('data/provider/osm-comparison.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report.summary,null,2));
