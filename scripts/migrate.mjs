import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const env=Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).filter(x=>x&&!x.startsWith('#')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1).trim().replace(/^['"]|['"]$/g,'')]}));
const ref=new URL(env.VITE_SUPABASE_URL).hostname.split('.')[0];
async function sql(query){const r=await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`,{method:'POST',headers:{Authorization:'Bearer '+env.SUPABASE_ACCESS_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({query})});const data=await r.json();if(!r.ok)throw Error(JSON.stringify(data));return data;}
const exists=await sql("select to_regclass('aquaman_private.schema_migrations') is not null as present");
const ledger=exists[0].present?await sql('select version,sha256 from aquaman_private.schema_migrations'):[];
for(const file of readdirSync('supabase/migrations').filter(f=>/^\d+.*\.sql$/.test(f)).sort()){
 const version=file.split('_')[0],source=readFileSync('supabase/migrations/'+file,'utf8'),hash=createHash('sha256').update(source).digest('hex'),old=ledger.find(r=>r.version===version);
 if(old){if(old.sha256!==hash)throw Error('Applied migration modified: '+file);continue;}
 console.log(process.argv.includes('--apply')?'Applying:':'Pending:',file);
 if(process.argv.includes('--apply')){const query=source.replace(/^begin;\s*$/mi,'').replace(/^commit;\s*$/mi,'');await sql(`begin; ${query}\ncreate table if not exists aquaman_private.schema_migrations(version text primary key,sha256 text not null,applied_at timestamptz not null default now()); alter table aquaman_private.schema_migrations enable row level security; revoke all on aquaman_private.schema_migrations from public,anon,authenticated; insert into aquaman_private.schema_migrations(version,sha256) values('${version}','${hash}'); commit;`);console.log('Applied:',version);}
}
