import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
const env=Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).filter(x=>x&&!x.startsWith('#')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1).trim().replace(/^['"]|['"]$/g,'')]}));
const base='https://api.supabase.com/v1/projects/ffrtgkzllqwlkbnzisdh';const headers={Authorization:'Bearer '+env.SUPABASE_ACCESS_TOKEN,'Content-Type':'application/json'};
async function sql(query){const r=await fetch(base+'/database/query',{method:'POST',headers,body:JSON.stringify({query})});if(!r.ok)throw Error(await r.text());return r.json();}
const kr=await fetch(base+'/api-keys?reveal=true',{headers});assert(kr.ok);const keys=await kr.json(),key=keys.find(k=>k.name==='service_role')?.api_key||keys.find(k=>k.type==='secret')?.api_key;
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const admin=createClient(env.VITE_SUPABASE_URL,key,options),anon=createClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_PUBLISHABLE_KEY,options),staff=createClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_PUBLISHABLE_KEY,options);
const file='data/editorial-ui.json';let state={ids:[]};
async function cleanup(){if(state.ids.length){const ids=state.ids.map(id=>{assert(/^AQ-[0-9a-f]{32}$/.test(id));return `'${id}'`}).join(',');await sql(`delete from aquaman_private.point_merges where report_id in (${ids});delete from aquaman_private.editorial_events where report_id in (${ids});delete from aquaman_private.review_events where report_id in (${ids});delete from aquaman_private.reports where id in (${ids});`)}if(state.uid){await sql(`delete from aquaman_private.moderators where user_id='${state.uid}'`);assert.ifError((await admin.auth.admin.deleteUser(state.uid)).error)}try{unlinkSync(file)}catch{}console.log('Synthetic editorial fixtures removed.');}
if(process.argv.includes('--cleanup')){state=JSON.parse(readFileSync(file,'utf8'));await cleanup();process.exit(0);}
async function rpc(client,name,params={}){const r=await client.rpc(name,params);assert.ifError(r.error);return r.data;}
try{
state.email='aquaman-editorial-'+randomUUID()+'@example.invalid';state.password='Aquaman-UI-test-only-2026!';
const user=await admin.auth.admin.createUser({email:state.email,password:state.password,email_confirm:true});assert.ifError(user.error);state.uid=user.data.user.id;
await sql(`insert into aquaman_private.moderators(user_id) values('${state.uid}')`);assert.ifError((await staff.auth.signInWithPassword({email:state.email,password:state.password})).error);
const fixture={kind:'add',area:'Verification only',landmark:'Fictional courtyard',type:'Borehole',status:'Unknown',observed:new Date().toISOString().slice(0,10),description:'Synthetic editorial fixture',coords:[6.45,3.33],locationConsent:true};
for(const name of ['Temporary editorial target','Temporary editorial source']){const r=await rpc(anon,'aquaman_submit',{p_payload:{...fixture,name,requestKey:randomUUID()}});state.ids.push(r.id);await rpc(staff,'aquaman_review',{p_id:r.id,p_decision:'published',p_note:'Synthetic test approval'});}
state.target=Number.parseInt(state.ids[0].slice(3,13),16)+100;
assert((await anon.rpc('aquaman_edit',{p_id:state.ids[0],p_action:'retract',p_patch:{},p_note:'Must be denied'})).error);
await rpc(staff,'aquaman_merge',{p_id:state.ids[1],p_target:state.target,p_note:'Same fictional point'});
let list=await rpc(anon,'aquaman_published');assert.equal(list.find(r=>r.id===state.ids[1]).pointId,state.target);assert.equal(list.find(r=>r.id===state.ids[1]).kind,'update');
await rpc(staff,'aquaman_edit',{p_id:state.ids[0],p_action:'correct',p_patch:{description:'Corrected synthetic text'},p_note:'Public test correction'});
const queue=await rpc(staff,'aquaman_queue');assert.equal(queue.find(r=>r.id===state.ids[0]).edits[0].previousPayload.description,fixture.description);
await rpc(staff,'aquaman_edit',{p_id:state.ids[0],p_action:'retract',p_patch:{},p_note:'Public test retraction'});
list=await rpc(anon,'aquaman_published');assert(!list.some(r=>state.ids.includes(r.id)));
assert((await rpc(anon,'aquaman_editorial_log',{p_point:state.target})).some(e=>e.action==='retract'));
await rpc(staff,'aquaman_edit',{p_id:state.ids[0],p_action:'restore',p_patch:{},p_note:'Public test restoration'});
await rpc(staff,'aquaman_unmerge',{p_id:state.ids[1],p_note:'Separate fictional points'});
list=await rpc(anon,'aquaman_published');assert.equal(list.filter(r=>state.ids.includes(r.id)&&r.kind==='add').length,2);
console.log('Live editorial checks passed: role protection, merge projection, text correction/audit, root retraction, public notice, restoration and undo merge.');
if(process.argv.includes('--keep')){writeFileSync(file,JSON.stringify(state));console.log('Temporary browser test email:',state.email);console.log('Target point ID:',state.target);}else await cleanup();
}catch(e){await cleanup();throw e;}
