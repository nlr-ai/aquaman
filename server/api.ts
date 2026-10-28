import type {Plugin} from 'vite';
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,existsSync,readFileSync,writeFileSync} from 'node:fs';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import type {IncomingMessage,ServerResponse} from 'node:http';

export function localApi():Plugin{
 mkdirSync('data',{recursive:true});
 const secretPath='data/moderator-password.txt';
 if(!existsSync(secretPath))writeFileSync(secretPath,randomBytes(24).toString('base64url'),{mode:0o600});
 const password=readFileSync(secretPath,'utf8').trim();
 const db=new DatabaseSync('data/aquaman.sqlite');db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS reports(id TEXT PRIMARY KEY, request_key TEXT UNIQUE, payload TEXT NOT NULL, status TEXT NOT NULL, created TEXT NOT NULL, reviewed TEXT, reason TEXT); CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, expires INTEGER NOT NULL);');
 const newReference=()=>{const alphabet='23456789ABCDEFGHJKLMNPQRSTUVWXYZ';const chars=Array.from(randomBytes(12),n=>alphabet[n&31]).join('');return 'AQ-'+chars.match(/.{4}/g)!.join('-')};
 if(!db.prepare('PRAGMA table_info(reports)').all().some((c:any)=>c.name==='reference'))db.exec('ALTER TABLE reports ADD COLUMN reference TEXT');
 for(const row of db.prepare('SELECT id FROM reports WHERE reference IS NULL').all() as {id:string}[])db.prepare('UPDATE reports SET reference=? WHERE id=?').run(newReference(),row.id);
 db.exec('CREATE UNIQUE INDEX IF NOT EXISTS reports_reference ON reports(reference)');
 db.exec('CREATE TABLE IF NOT EXISTS review_events(id INTEGER PRIMARY KEY, report_id TEXT NOT NULL, decision TEXT NOT NULL, note TEXT NOT NULL, reviewer TEXT NOT NULL, at TEXT NOT NULL)');
 const limits=new Map<string,{count:number,start:number}>();
 const send=(res:ServerResponse,code:number,value:unknown)=>{res.statusCode=code;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(value));};
 const body=async(req:IncomingMessage)=>{let str='';for await(const chunk of req){str+=chunk;if(str.length>20000)throw new Error('Request too large');}return JSON.parse(str||'{}');};
 const session=(req:IncomingMessage)=>{const token=req.headers.cookie?.match(/(?:^|; )aquaman_staff=([^;]+)/)?.[1];return token&&db.prepare('SELECT token FROM sessions WHERE token=? AND expires>?').get(token,Date.now());};
 return {name:'aquaman-local-api',configureServer(server){server.middlewares.use('/api',async(req,res)=>{
 try{
 const url=new URL(req.url||'/', 'http://localhost');const path=url.pathname;
 if(req.method!=='GET') {const origin=req.headers.origin;if(origin&&origin!==`http://${req.headers.host}`){send(res,403,{error:'Origin not allowed'});return;}}
 if(path==='/published'&&req.method==='GET'){const rows=db.prepare("SELECT id,payload,created,reviewed FROM reports WHERE status='published' ORDER BY reviewed,id").all();send(res,200,rows.map((r:any)=>({id:r.id,...JSON.parse(r.payload),created:r.created,reviewed:r.reviewed})));return;}
 if(path==='/reports'&&req.method==='POST'){
 const ip=req.socket.remoteAddress||'local';const now=Date.now();let l=limits.get(ip);if(!l||now-l.start>60000){l={count:0,start:now};limits.set(ip,l);}if(++l.count>20){send(res,429,{error:'Too many submissions. Please wait a minute.'});return;}
 const b=await body(req);const statuses=['Working','Not working','Intermittent','Unknown'];const types=['Borehole','Well','Public tap','Other','Unknown'];
 if(!['add','update'].includes(b.kind)||!statuses.includes(b.status)||!types.includes(b.type)||typeof b.name!=='string'||!b.name.trim()||b.name.length>120||typeof b.area!=='string'||!b.area.trim()||b.area.length>100||typeof b.landmark!=='string'||!b.landmark.trim()||b.landmark.length>300||typeof b.description!=='string'||b.description.length>2000||!/^\d{4}-\d{2}-\d{2}$/.test(b.observed)||!Number.isFinite(Date.parse(b.observed))||b.observed>new Date(Date.now()+24*3600000).toISOString().slice(0,10)||typeof b.requestKey!=='string'||!/^[-a-zA-Z0-9]{16,100}$/.test(b.requestKey)||(b.kind==='update'&&(!Number.isInteger(b.pointId)||b.pointId<1))){send(res,400,{error:'Please check the required fields and observation date.'});return;}
 if(b.coords!==undefined&&(!Array.isArray(b.coords)||b.coords.length!==2||!b.coords.every(Number.isFinite)||Math.abs(b.coords[0])>90||Math.abs(b.coords[1])>180||b.locationConsent!==true)){send(res,400,{error:'Invalid coordinates or missing publication permission.'});return;}
 if(b.photoPath){send(res,400,{error:'Photos require Supabase mode.'});return;}
 const payload={dataset:'community',kind:b.kind,pointId:b.kind==='update'?b.pointId:null,name:b.name.trim(),area:b.area.trim(),landmark:b.landmark.trim(),type:b.type,status:b.status,observed:b.observed,description:b.description.trim(),...(b.coords?{coords:b.coords}:{})};
 const existing=db.prepare('SELECT id,reference FROM reports WHERE request_key=?').get(b.requestKey);if(existing){send(res,200,existing);return;}
 const id='AQ-'+randomBytes(16).toString('hex'),reference=newReference();db.prepare('INSERT INTO reports(id,reference,request_key,payload,status,created) VALUES(?,?,?,?,?,?)').run(id,reference,b.requestKey,JSON.stringify(payload),'pending',new Date().toISOString());send(res,201,{id,reference});return;
 }
 if(path.startsWith('/status/')&&req.method==='GET'){const r=db.prepare("SELECT id,reference,status,created,reviewed FROM reports WHERE id=? OR replace(reference,'-','')=?").get(decodeURIComponent(path.slice(8)),decodeURIComponent(path.slice(8)).toUpperCase().replace(/[^A-Z0-9]/g,''));send(res,r?200:404,r||{error:'Report not found. Check the reference.'});return;}
 if(path==='/staff/login'&&req.method==='POST'){
 const ip='login:'+req.socket.remoteAddress;let l=limits.get(ip);if(!l||Date.now()-l.start>60000){l={count:0,start:Date.now()};limits.set(ip,l);}if(++l.count>5){send(res,429,{error:'Please wait a minute before trying again.'});return;}
 const b=await body(req);const candidate=Buffer.from(typeof b.password==='string'?b.password:'');const actual=Buffer.from(password);if(candidate.length!==actual.length||!timingSafeEqual(candidate,actual)){send(res,401,{error:'Incorrect password.'});return;}
 const token=randomBytes(32).toString('hex');db.prepare('INSERT INTO sessions VALUES(?,?)').run(token,Date.now()+8*3600000);res.setHeader('Set-Cookie',`aquaman_staff=${token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=28800`);send(res,200,{ok:true});return;
 }
 if(path.startsWith('/staff/')){
 if(!session(req)){send(res,401,{error:'Moderator sign-in required.'});return;}
 if(path==='/staff/session'){send(res,200,{ok:true});return;}
 if(path==='/staff/logout'&&req.method==='POST'){const token=req.headers.cookie?.match(/aquaman_staff=([^;]+)/)?.[1];db.prepare('DELETE FROM sessions WHERE token=?').run(token||'');res.setHeader('Set-Cookie','aquaman_staff=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0');send(res,200,{ok:true});return;}
 if(path==='/staff/reports'&&req.method==='GET'){send(res,200,db.prepare('SELECT * FROM reports ORDER BY created DESC').all().map((r:any)=>({...r,payload:JSON.parse(r.payload)})));return;}
 if(path.startsWith('/staff/review/')&&req.method==='POST'){const b=await body(req);if(!['published','rejected','follow-up'].includes(b.status)||typeof b.reason!=='string'||!b.reason.trim()||b.reason.length>1000){send(res,400,{error:'Choose a decision and provide a review note.'});return;}const id=decodeURIComponent(path.slice(14));const at=new Date().toISOString();db.exec('BEGIN IMMEDIATE');try{const r=db.prepare("UPDATE reports SET status=?,reviewed=?,reason=? WHERE id=? AND status IN ('pending','follow-up')").run(b.status,at,b.reason.trim(),id);if(r.changes)db.prepare('INSERT INTO review_events(report_id,decision,note,reviewer,at) VALUES(?,?,?,?,?)').run(id,b.status,b.reason.trim(),'local moderator',at);db.exec('COMMIT');send(res,r.changes?200:409,r.changes?{ok:true}:{error:'Report already reviewed or not found.'});}catch(e){db.exec('ROLLBACK');throw e;}return;}
 }
 send(res,404,{error:'Not found'});
 }catch(error){send(res,400,{error:error instanceof Error?error.message:'Request failed'});}
 });}};
}
