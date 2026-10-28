import {api,isSupabase} from './dataApi';
import type {Point} from './main';
type Area={area:string;count:number;file?:string};
async function snapshot(path:string){const response=await fetch('/data/wpdx/'+path);if(!response.ok)throw new Error('Historical inventory is unavailable');return response.json();}
export async function providerAreas():Promise<Area[]>{return isSupabase?api('/provider/areas'):(await snapshot('index.json')).areas;}
export async function providerPoints(area:string):Promise<Point[]>{if(isSupabase)return api('/provider/points/'+encodeURIComponent(area));const record=(await providerAreas()).find(a=>a.area===area);return record?(await snapshot(record.file!)).points:[];}
