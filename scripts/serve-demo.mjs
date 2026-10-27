import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.woff2':'font/woff2','.woff':'font/woff','.png':'image/png','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  if(pathname.startsWith('/api/')){res.writeHead(404);res.end('Local development API is not available on this demo.');return;}
  let file=path.resolve(root,'.'+pathname);
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  try{if(!(await stat(file)).isFile())file=path.join(root,'index.html')}catch{if(path.extname(pathname)){res.writeHead(404);res.end();return;}file=path.join(root,'index.html')}
  const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Cache-Control':file.endsWith('.html')?'no-cache':'public, max-age=3600'});res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(500);res.end('Unable to serve demo.');}
}).listen(4173,'127.0.0.1',()=>console.log('Production demo: http://127.0.0.1:4173 (static files only)'));
