import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import {geometryDistance} from './landmark-geometry.mjs';
const manifest=JSON.parse(readFileSync('public/data/wpdx/index.json','utf8'));
const cross=JSON.parse(readFileSync('public/data/crosscheck/grid3-lagos.json','utf8'));
assert.equal(manifest.csvSha256,cross.wpdxCsvSha256);
const group=manifest.areas.find(a=>a.area==='Ikeja');
const points=JSON.parse(readFileSync('public/data/wpdx/'+group.file,'utf8')).points.filter(p=>cross.matches[p.providerId]).slice(0,3);
const features=new Map(),matches={};
for(const point of points){
 const original=cross.matches[point.providerId],coords=original.coords;
 const path='data/provider/osm-landmark-'+point.providerId.replaceAll('+','_')+'.json';
 if(!existsSync(path)||process.argv.includes('--refresh')){
  const [lat,lon]=coords,bbox=[lon-.003,lat-.003,lon+.003,lat+.003].join(',');
  const response=await fetch('https://api.openstreetmap.org/api/0.6/map.json?bbox='+bbox,{headers:{'User-Agent':'Aquaman small-area landmark pilot'},signal:AbortSignal.timeout(30000)});
  assert(response.ok,'OSM extract unavailable; retain the last reviewed output');writeFileSync(path,await response.text());
 }
 const data=JSON.parse(readFileSync(path,'utf8'));assert(Array.isArray(data.elements));
 const nodes=new Map(data.elements.filter(e=>e.type==='node').map(e=>[e.id,[e.lat,e.lon]]));
 const candidates=[];
 for(const element of data.elements){
  const tags=element.tags||{},name=tags.name?.trim();if(!name||name.length>100)continue;
  const kind=element.type==='way'&&tags.highway?'street':/^(school|marketplace|hospital|clinic|place_of_worship|community_centre|bus_station|library|townhall)$/.test(tags.amenity||'')?'landmark':null;
  if(!kind||!['node','way'].includes(element.type))continue;
  const geometry=element.type==='node'?[[element.lat,element.lon]]:(element.nodes||[]).map(id=>nodes.get(id));
  if(!geometry.length||geometry.some(p=>!p))continue;
  const closed=element.type==='way'&&element.nodes[0]===element.nodes.at(-1),distanceM=geometryDistance(coords,geometry,kind==='landmark'&&closed);
  if(distanceM>(kind==='street'?100:150))continue;
  const sourceId=element.type+'/'+element.id;
  const feature={sourceId,name,kind,geometry,closed,sourceUrl:'https://www.openstreetmap.org/'+sourceId};features.set(sourceId,feature);
  candidates.push({sourceId,distanceM:Math.round(distanceM),exactDistanceM:distanceM});
 }
 candidates.sort((a,b)=>a.exactDistanceM-b.exactDistanceM||a.sourceId.localeCompare(b.sourceId));
 if(candidates.length)matches[point.providerId]={wpdxCsvSha256:manifest.csvSha256,originalSourceId:original.sourceId,originalCoords:coords,wpdxCoords:point.coords,candidates:candidates.slice(0,3).map(({exactDistanceM,...rest})=>rest)};
}
const output={scope:'Three exact-ID-linked GRID3 points in Ikeja; small-area pilot',attribution:'© OpenStreetMap contributors; original point positions: GRID3 via WPdx source catalogue',licence:'ODbL 1.0 for OSM features and landmark suggestions',licenceUrl:'https://www.openstreetmap.org/copyright',retrievedAt:new Date().toISOString(),limitations:'Proposed nearby labels only, not official names, addresses or walking directions. GRID3 positions have more precision but are not locally verified. No water-quality or access inference. Source IDs and coordinate bases are retained.',matches,features:[...features.values()]};
mkdirSync('public/data/landmarks',{recursive:true});writeFileSync('public/data/landmarks/ikeja-pilot.json',JSON.stringify(output));
console.log(JSON.stringify({examined:points.length,withSuggestions:Object.keys(matches).length,results:Object.entries(matches).map(([id,m])=>({id,name:features.get(m.candidates[0].sourceId).name,distanceM:m.candidates[0].distanceM}))},null,2));
