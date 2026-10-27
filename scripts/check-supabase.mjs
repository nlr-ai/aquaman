import {readFileSync} from 'node:fs';
const env=Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>l&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)]}));
const base=env.VITE_SUPABASE_URL,key=env.VITE_SUPABASE_PUBLISHABLE_KEY;
let ok=true;
for(const [path,body] of [['/auth/v1/settings',null],['/rest/v1/rpc/aquaman_published',{}]]){
 const r=await fetch(base+path,{method:body?'POST':'GET',headers:{apikey:key,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 const data=await r.json();console.log(path,r.status,r.ok?'reachable':data.message);if(!r.ok)ok=false;
}
if(!ok){console.log('Remote Aquaman setup is incomplete; run the migration through an authorized database owner.');process.exitCode=1;}
