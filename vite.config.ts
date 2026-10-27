import {defineConfig} from 'vite';
export default defineConfig(async ({command,isPreview})=>({
 plugins:command==='serve'&&!isPreview?[(await import('./server/api.ts')).localApi()]:[],
 server:{host:'127.0.0.1',port:5173,strictPort:true}
}));
