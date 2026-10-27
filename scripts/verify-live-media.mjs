import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
const env=Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).filter(x=>x&&!x.startsWith('#')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1).trim().replace(/^['"]|['"]$/g,'')]}));
const management='https://api.supabase.com/v1/projects/ffrtgkzllqwlkbnzisdh';const headers={Authorization:'Bearer '+env.SUPABASE_ACCESS_TOKEN,'Content-Type':'application/json'};
async function sql(query){const r=await fetch(management+'/database/query',{method:'POST',headers,body:JSON.stringify({query})});const d=await r.json();if(!r.ok)throw Error(JSON.stringify(d));return d;}
const k=await fetch(management+'/api-keys?reveal=true',{headers});assert(k.ok);const keys=await k.json();const key=keys.find(k=>k.name==='service_role')?.api_key||keys.find(k=>k.type==='secret')?.api_key;assert(key);
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const admin=createClient(env.VITE_SUPABASE_URL,key,options),anon=createClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_PUBLISHABLE_KEY,options),staff=createClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_PUBLISHABLE_KEY,options);
const folder=randomUUID(),photoPath=folder+'/photo.jpg',thumbPath=folder+'/thumb.jpg';let uid,id;
try{
const image=readFileSync('data/verification-photo.jpg');
for(const path of [photoPath,thumbPath]){const r=await anon.storage.from('aquaman-photos').upload(path,image,{contentType:'image/jpeg'});assert.ifError(r.error);}
assert((await anon.storage.from('aquaman-photos').createSignedUrl(photoPath,60)).error,'Unreviewed upload must not be readable');
const email='aquaman-test-'+randomUUID()+'@example.invalid',password=randomUUID()+'Aa1!';
const user=await admin.auth.admin.createUser({email,password,email_confirm:true});assert.ifError(user.error);uid=user.data.user.id;
await sql(`insert into aquaman_private.moderators(user_id) values('${uid}'::uuid)`);
assert.ifError((await staff.auth.signInWithPassword({email,password})).error);
assert.ifError((await staff.rpc('aquaman_staff_session')).error);
const payload={kind:'add',name:'Temporary media verification',area:'Verification only',landmark:'Fictional test location',type:'Public tap',status:'Unknown',observed:new Date().toISOString().slice(0,10),description:'Temporary synthetic fixture',requestKey:randomUUID(),coords:[6.45,3.33],locationConsent:true,photoPath,photoConsent:true};
const receipt=await anon.rpc('aquaman_submit',{p_payload:payload});assert.ifError(receipt.error);id=receipt.data.id;
assert(!(await anon.rpc('aquaman_published')).data.some(r=>r.id===id));
assert((await staff.rpc('aquaman_queue')).data.some(r=>r.id===id&&r.payload.coords[0]===6.45));
assert.ifError((await staff.storage.from('aquaman-photos').createSignedUrl(photoPath,60)).error);
assert((await anon.rpc('aquaman_submit',{p_payload:{...payload,requestKey:randomUUID(),coords:[91,3]}})).error);
assert((await anon.rpc('aquaman_submit',{p_payload:{...payload,requestKey:randomUUID(),photoConsent:false}})).error);
assert.ifError((await staff.rpc('aquaman_review',{p_id:id,p_decision:'published',p_note:'Synthetic fixture reviewed for integration test'})).error);
const published=(await anon.rpc('aquaman_published')).data.find(r=>r.id===id);assert.deepEqual(published.coords,[6.45,3.33]);assert.equal(published.photoPath,photoPath);
const signed=await anon.storage.from('aquaman-photos').createSignedUrl(photoPath,60);assert.ifError(signed.error);assert((await fetch(signed.data.signedUrl)).ok);
console.log('Live passed: JPEG upload, pending photo privacy, real Auth moderator session, queue coordinates/photo, validation, approval and public signed-image download.');
}finally{
if(id){await sql(`delete from aquaman_private.review_events where report_id='${id}';delete from aquaman_private.reports where id='${id}' and payload->>'name'='Temporary media verification';`)}
assert.ifError((await admin.storage.from('aquaman-photos').remove([photoPath,thumbPath])).error);
if(uid){await sql(`delete from aquaman_private.moderators where user_id='${uid}'::uuid`);assert.ifError((await admin.auth.admin.deleteUser(uid)).error);}
console.log('Temporary test account, report, audit and photo objects removed.');
}
