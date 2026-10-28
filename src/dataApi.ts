import {createClient} from '@supabase/supabase-js';

export const isSupabase=import.meta.env.VITE_DATA_BACKEND==='supabase';
export const recoveryRedirect=typeof window!=='undefined'&&window.location.hash.includes('type=recovery');
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase=isSupabase&&url&&key?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
function failure(error:{message:string;code?:string}):never{
 if(error.code==='PGRST202'||error.code==='PGRST205')throw new Error('Supabase is reachable, but the Aquaman database setup is not installed yet.');
 throw new Error(error.message);
}
async function rpc(name:string,args?:Record<string,unknown>){if(!supabase)throw new Error('Supabase configuration is missing.');const {data,error}=await supabase.rpc(name,args);if(error)failure(error);return data;}
export async function api(path:string,body?:any):Promise<any>{
 if(!isSupabase){const r=await fetch('/api'+path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw new Error(data.error||'Request failed');return data;}
 if(path.startsWith('/editorial/'))return rpc('aquaman_editorial_log',{p_point:Number(path.slice(11))});
 if(path==='/staff/unmerge')return rpc('aquaman_unmerge',{p_id:body.id,p_note:body.note});
 if(path==='/staff/edit')return rpc('aquaman_edit',{p_id:body.id,p_action:body.action,p_patch:body.patch,p_note:body.note});
 if(path==='/staff/merge')return rpc('aquaman_merge',{p_id:body.id,p_target:body.target,p_note:body.note});
 if(path==='/published')return rpc('aquaman_published');
 if(path==='/reports')return rpc('aquaman_submit',{p_payload:body});
 if(path.startsWith('/status/'))return rpc('aquaman_status',{p_id:decodeURIComponent(path.slice(8))});
 if(path==='/staff/login'){
  if(!supabase)throw new Error('Supabase configuration is missing.');
  const {error}=await supabase.auth.signInWithPassword({email:body.email,password:body.password});if(error)failure(error);
  try{return await rpc('aquaman_staff_session')}catch(e){await supabase.auth.signOut();throw e;}
 }
 if(path==='/staff/logout'){const {error}=await supabase!.auth.signOut();if(error)failure(error);return {ok:true};}
 if(path==='/staff/reset'){
  const {error}=await supabase!.auth.resetPasswordForEmail(body.email,{redirectTo:window.location.origin});if(error)failure(error);return {ok:true};
 }
 if(path==='/staff/session')return rpc('aquaman_staff_session');
 if(path==='/staff/reports')return rpc('aquaman_queue');
 if(path.startsWith('/staff/review/'))return rpc('aquaman_review',{p_id:decodeURIComponent(path.slice(14)),p_decision:body.status,p_note:body.reason});
 throw new Error('Unsupported data operation');
}
