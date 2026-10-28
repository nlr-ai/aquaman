import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const root='public/data/wpdx/';
const manifest=JSON.parse(readFileSync(root+'index.json','utf8'));
const points=manifest.areas.flatMap(area=>{
 const snapshot=JSON.parse(readFileSync(root+area.file,'utf8'));
 assert.equal(snapshot.license,manifest.license);
 assert.equal(snapshot.sourceUrl,manifest.sourceUrl);
 assert.equal(snapshot.points.length,area.count);
 assert(snapshot.points.every(p=>p.area===area.area));
 return snapshot.points;
});
assert.equal(points.length,manifest.recordCount);
assert.equal(new Set(points.map(p=>p.id)).size,points.length);
assert.equal(new Set(points.map(p=>p.providerId)).size,points.length);
for(const p of points){
 assert(p.id>=2000000000000&&p.id<4000000000000);
 assert.equal(p.status,'Unknown');assert.equal(p.access,'Access unknown');assert.equal(p.price,'Price unknown');
 assert(!p.test);assert(!p.photoPath);assert.equal(p.sourceDate,p.date);
 assert(p.coords.length===2&&p.coords.every(Number.isFinite));
 assert(Math.abs(p.coords[0])<=90&&Math.abs(p.coords[1])<=180);
 assert.equal(p.provenance.csvSha256,manifest.csvSha256);
 assert.equal(p.provenance.license,manifest.license);
}
const dates=points.map(p=>p.date).filter(d=>d!=='Unknown').sort();
assert.deepEqual([dates[0],dates.at(-1)],manifest.observationRange);
const env=Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).filter(x=>x&&!x.startsWith('#')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1).trim().replace(/^['"]|['"]$/g,'')]}));
async function rpc(name,args={}){
 const r=await fetch(env.VITE_SUPABASE_URL+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:env.VITE_SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'},body:JSON.stringify(args)});
 assert(r.ok,'Public provider RPC must succeed');return r.json();
}
const [areas,ikeja]=await Promise.all([rpc('aquaman_provider_areas'),rpc('aquaman_provider_points',{p_area:'Ikeja'})]);
assert.deepEqual(areas,manifest.areas.map(({area,count})=>({area,count})));
const expected=points.filter(p=>p.area==='Ikeja');
assert.equal(ikeja.length,expected.length);
assert.deepEqual(ikeja.map(p=>p.providerId).sort(),expected.map(p=>p.providerId).sort());
assert(ikeja.every(p=>p.status==='Unknown'&&p.importedAt&&p.provenance));
console.log(`Provider verified: ${points.length} unique source records, ${areas.length} areas, licence/provenance/unknown current status, matching public Supabase inventory and ${ikeja.length} Ikeja records.`);
