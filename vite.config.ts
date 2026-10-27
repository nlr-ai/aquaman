import {defineConfig} from 'vite';
import {localApi} from './server/api';
export default defineConfig({plugins:[localApi()],server:{host:'127.0.0.1',port:5173,strictPort:true}});
