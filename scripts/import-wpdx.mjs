// Manual snapshot refresh. Raw downloads stay under ignored data/provider/.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parse} from 'csv-parse/sync';
import assert from 'node:assert/strict';
import {loadPointNamer} from './point-names.mjs';
const namer=loadPointNamer();
const dataset='29677a2d-1fb2-48a3-a06a-9c66800c418b';
const sourceUrl='https://data.humdata.org/dataset/wpdx_nga';
mkdirSync('data/provider',{recursive:true});
const cached=process.argv.includes('--cached');
let meta,bytes;
if(cached){meta=JSON.parse(readFileSync('data/provider/hdx-metadata.json','utf8'));bytes=readFileSync('data/provider/wpdx-nigeria.csv')}
else{const r=await fetch('https://data.humdata.org/api/3/action/package_show?id='+dataset);assert(r.ok);meta=await r.json();assert(meta.success);const resource=meta.result.resources.find(r=>r.name==='wpdx_water_points_nga');const csv=await fetch(resource.url);assert(csv.ok);bytes=Buffer.from(await csv.arrayBuffer());writeFileSync('data/provider/hdx-metadata.json',JSON.stringify(meta));writeFileSync('data/provider/wpdx-nigeria.csv',bytes);}
assert.equal(meta.result.organization.name,'water-point-data-exchange');
assert(/Creative Commons Attribution Share-Alike/i.test(meta.result.license_title),'Review a changed provider licence before publishing');
const resource=meta.result.resources.find(r=>r.name==='wpdx_water_points_nga');
const sha256=createHash('sha256').update(bytes).digest('hex');
const rows=parse(bytes,{columns:true,bom:true,skip_empty_lines:true});const selected=rows.filter(r=>r.clean_country_id==='NGA'&&r.clean_adm1==='Lagos');
const ids=new Set(),numeric=new Set();const points=[];let skipped=0;
for(const r of selected){const lat=Number(r.lat_deg),lon=Number(r.lon_deg);if(!r.lat_deg||!r.lon_deg||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180||!r.wpdx_id||!r.clean_adm2){skipped++;continue;}
 assert(!ids.has(r.wpdx_id),'Duplicate WPdx identifier: manual source reconciliation required');ids.add(r.wpdx_id);
 const id=2000000000000+parseInt(createHash('sha256').update('WPdx:'+r.wpdx_id).digest('hex').slice(0,10),16);assert(!numeric.has(id),'Numeric ID collision');numeric.add(id);
 const type=/tap/i.test(r.water_tech_clean)?'Public tap':/borehole|tubewell/i.test(r.water_source_clean)?'Borehole':/well/i.test(r.water_source_clean)?'Well':'Other';
 const date=/^\d{4}-\d{2}-\d{2}$/.test(r.report_date)?r.report_date:'Unknown';
 points.push({id,providerId:r.wpdx_id,name:namer.nameFor('wpdx:'+r.wpdx_id),generatedName:true,sourceLabel:`${type} · ${r.wpdx_id}`,type,area:r.clean_adm2,state:'Lagos',country:'Nigeria',coords:[lat,lon],landmark:`${r.clean_adm2}, Lagos`,access:'Access unknown',price:'Price unknown',status:'Unknown',date,sourceDate:date,imported:true,provider:'WPdx',historical:{waterPresent:r.status_id||'Unknown',condition:r.status_clean||'Unknown',sourceType:r.water_source_clean||'Unknown',technology:r.water_tech_clean||'Unknown',management:r.management_clean||'Unknown',payment:r.pay_clean||'Unknown'},provenance:{organization:r.source,dataset:r.dataset_title,sourceUrl,downloadUrl:resource.url,license:meta.result.license_title,sourceUpdated:resource.last_modified,csvSha256:sha256}});
}
assert(points.length>0);const groups=[...new Set(points.map(p=>p.area))].sort();
for(const area of groups)assert(points.filter(p=>p.area===area).length<=500,'Area exceeds the RPC limit: add pagination before importing');
const manifest={provider:'WPdx via HDX',state:'Lagos',country:'Nigeria',recordCount:points.length,skipped,areas:groups.map((area,index)=>({area,count:points.filter(p=>p.area===area).length,file:`area-${index}.json`})),observationRange:[...points.map(p=>p.date).filter(d=>d!=='Unknown')].sort().filter((d,i,a)=>i===0||i===a.length-1),retrievedAt:new Date().toISOString(),sourceUrl,downloadUrl:resource.url,sourceUpdated:resource.last_modified,license:meta.result.license_title,licenseNote:'HDX declares Creative Commons Attribution Share-Alike without a version in this metadata. Source attribution and licence accompany this normalized snapshot. This data licence does not license application source code.',csvSha256:sha256,limitations:'Historical inventory. Current availability, access and drinking-water quality are unknown. Predictions and subjective quality are not used as verified evidence. Three-word app nicknames are stable labels, not local names or location codes. Original source identifiers are retained.'};
writeFileSync('data/provider/import-preview.json',JSON.stringify(manifest,null,2));console.log(JSON.stringify({count:points.length,areas:groups.length,observationRange:manifest.observationRange,skipped,sha256},null,2));
if(!process.argv.includes('--apply')){console.log('Preview only. Use --apply to import and publish the attributed snapshot.');process.exit(0)}
const env=Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).filter(x=>x&&!x.startsWith('#')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1).trim().replace(/^['"]|['"]$/g,'')]}));
const ref=new URL(env.VITE_SUPABASE_URL).hostname.split('.')[0];
namer.save();
for(let i=0;i<points.length;i+=100){const chunk=points.slice(i,i+100).map(p=>({id:p.id,provider_id:p.providerId,area:p.area,payload:p}));const json=JSON.stringify(chunk).replaceAll("'","''");const query=`insert into aquaman_private.provider_points(id,provider_id,area,payload) select id,provider_id,area,payload from jsonb_to_recordset('${json}'::jsonb) as x(id bigint,provider_id text,area text,payload jsonb) on conflict(provider_id) do update set area=excluded.area,payload=excluded.payload,imported_at=now()`;const r=await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`,{method:'POST',headers:{Authorization:'Bearer '+env.SUPABASE_ACCESS_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({query})});if(!r.ok)throw Error('Import batch failed: '+await r.text());}
mkdirSync('public/data/wpdx',{recursive:true});
writeFileSync('public/data/wpdx/index.json',JSON.stringify(manifest,null,2));
for(const group of manifest.areas)writeFileSync('public/data/wpdx/'+group.file,JSON.stringify({attribution:manifest.provider,license:manifest.license,sourceUrl,points:points.filter(p=>p.area===group.area)}));
console.log('Imported into Supabase and wrote attributed per-area snapshots. Existing records absent from a later snapshot are retained, not silently deleted.');
