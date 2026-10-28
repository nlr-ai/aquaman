import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parse} from 'csv-parse/sync';
import assert from 'node:assert/strict';
const sourceUrl='https://catalog.waterpointdata.org/datasets/grid3-nigeria-water-points-61ae7cd9/';
const downloadUrl='https://catalog.waterpointdata.org/datafiles/grid3-nigeria-water-points-61ae7cd9.csv';
mkdirSync('data/provider',{recursive:true});
let bytes;
if(process.argv.includes('--cached'))bytes=readFileSync('data/provider/grid3-original.csv');
else{const response=await fetch(downloadUrl,{signal:AbortSignal.timeout(30000)});assert(response.ok);bytes=Buffer.from(await response.arrayBuffer());writeFileSync('data/provider/grid3-original.csv',bytes);}
const grid=parse(bytes,{columns:true,bom:true,skip_empty_lines:true}).filter(r=>r.wardcode.startsWith('LAS'));
const wpBytes=readFileSync('data/provider/wpdx-nigeria.csv');
const wp=parse(wpBytes,{columns:true,bom:true,skip_empty_lines:true}).filter(r=>r.clean_country_id==='NGA'&&r.clean_adm1==='Lagos');
assert.equal(new Set(grid.map(r=>r.globalid)).size,grid.length,'Resolve duplicate source identifiers before joining');
const hash=data=>createHash('sha256').update(data).digest('hex');
function distance(a,b){const rad=Math.PI/180;const h=Math.sin((b[0]-a[0])*rad/2)**2+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin((b[1]-a[1])*rad/2)**2;return Math.round(6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h)));}
const wpdxHash=hash(wpBytes);
const byId=new Map(grid.map(r=>[r.globalid,r])),matches={},matchedIds=new Set();
for(const p of wp){const r=byId.get(p.activity_id);if(!r)continue;const coords=[Number(r.Y),Number(r.X)];assert(coords.every(Number.isFinite));matchedIds.add(r.globalid);
 matches[p.wpdx_id]={sourceId:r.globalid,name:r.name,alternativeName:r.alt_name,type:r.type_waterpoint,coords,date:r.timestamp.slice(0,10).replaceAll('/','-'),originalTimestamp:r.timestamp,originalReportDate:r.report_date,wpdxDate:p.report_date,wpdxCoords:[Number(p.lat_deg),Number(p.lon_deg)],offsetM:distance(coords,[Number(p.lat_deg),Number(p.lon_deg)]),matchMethod:'Exact source globalid = WPdx activity_id',sourceUrl,downloadUrl,wpdxCsvSha256:wpdxHash};
}
const candidates=grid.filter(r=>!matchedIds.has(r.globalid)).map(r=>{
 const coords=[Number(r.Y),Number(r.X)];assert(coords.every(Number.isFinite));
 const nearest=wp.map(p=>({providerId:p.wpdx_id,area:p.clean_adm2,distanceM:distance(coords,[Number(p.lat_deg),Number(p.lon_deg)])})).sort((a,b)=>a.distanceM-b.distanceM).slice(0,3);
 return {sourceId:r.globalid,name:r.name,type:r.type_waterpoint,wardCode:r.wardcode,coords,date:r.timestamp.slice(0,10).replaceAll('/','-'),nearestWpdx:nearest,review:'Unresolved source record; not automatically a new point or a duplicate'};
});
const report={provider:'GRID3 original source via WPdx catalogue',sourceUrl,downloadUrl,attribution:'GRID3 / Nigeria GeoPortal; original source file hosted by WPdx',licence:'Attribution required; reuse permission described in the WPdx source catalogue',retrievedAt:new Date().toISOString(),csvSha256:hash(bytes),wpdxCsvSha256:wpdxHash,scope:'Lagos, selected by original LAS ward-code prefix; not a new administrative-boundary survey',summary:{wpdxRecords:wp.length,originalRecords:grid.length,exactIdMatches:Object.keys(matches).length,unresolved:candidates.length,unresolvedWithin75m:candidates.filter(c=>c.nearestWpdx[0].distanceM<=75).length,exactMatchesOffsetOver100m:Object.values(matches).filter(m=>m.offsetM>100).length,exactMatchesDateDisagreement:Object.values(matches).filter(m=>m.date!==m.wpdxDate).length},limitations:'GRID3 is already an upstream WPdx contributor, not independent confirmation. Proximity is a review hint, not proof of identity. X/Y retain original precision; the source lat/lon columns and many WPdx coordinates are rounded. No coordinate, operational status or water quality is automatically replaced or verified.',matches,candidates};
mkdirSync('public/data/crosscheck',{recursive:true});
writeFileSync('public/data/crosscheck/grid3-lagos.json',JSON.stringify(report));
console.log(JSON.stringify(report.summary,null,2));
