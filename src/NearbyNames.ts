import type {Point} from './main';
export type NearbyLabel={name:string;distanceM:number;kind:string;sourceUrl:string;basisCoords:[number,number];wpdxCoords:[number,number]};
type Layer={matches:Record<string,{wpdxCsvSha256:string;originalCoords:[number,number];wpdxCoords:[number,number];candidates:{sourceId:string;distanceM:number}[]}>;features:{sourceId:string;name:string;kind:string;sourceUrl:string}[]};
let cache:Promise<Layer|null>|undefined;
export function loadNearbyNames():Promise<Layer|null>{return cache??=fetch('/data/landmarks/ikeja-pilot.json').then(async response=>response.ok?response.json():null).catch(()=>null);}
export function applyNearbyNames(points:Point[],layer:Layer|null):Point[]{
 if(!layer)return points;
 return points.map(point=>{
  const match=point.providerId?layer.matches[point.providerId]:undefined;
  if(!match||!point.generatedName||match.wpdxCsvSha256!==point.provenance?.csvSha256||!point.coords||point.coords.some((v,i)=>v!==match.wpdxCoords[i]))return point;
  const candidate=match.candidates[0],feature=layer.features.find(f=>f.sourceId===candidate?.sourceId);
  if(!feature||candidate.distanceM>(feature.kind==='street'?100:150))return point;
  const prefix=point.type.split(' ').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');
  return {...point,nickname:point.name,name:`${prefix} · Near ${feature.name}`,coords:match.originalCoords,nearbyLabel:{name:feature.name,distanceM:candidate.distanceM,kind:feature.kind,sourceUrl:feature.sourceUrl,basisCoords:match.originalCoords,wpdxCoords:match.wpdxCoords}};
 });
}
