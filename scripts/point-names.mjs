import {createHash} from 'node:crypto';
import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';

export const nameWords='acacia almond apple apricot aster bamboo basil beach beacon berry birch blossom bluebird bouquet brook butterfly cacao calabash canary canopy cedar cherry chestnut clover coconut coral cosmos cotton crane cricket dahlia daisies dawn dove dragonfly dune elm fern finch firefly forest freesia garden gazelle ginger grove guava harbor haven hazel heather heron hibiscus hill honey iris island jade jasmine juniper kite kiwi lake lantern lark lavender leaf lemon lilac lily lotus magnolia mango maple marigold meadow mint moon morning moss nectar nutmeg oasis olive orchid otter palm papaya peach pearl pebble petal pine plum poppy primrose rainbow reed robin roses saffron sage savanna shell shore sparrow spring star sunflower sunrise swallow tamarind thyme tulip willow wing wisteria woodland zebra zinnia'.split(' ');

const capitalize=word=>word[0].toUpperCase()+word.slice(1);
export const pointDisplayName=(type,nickname)=>type.split(' ').map(capitalize).join(' ')+' '+nickname;
export function pointNamer(saved={}){
 const registry=new Map(),used=new Set();
 for(const [id,name] of Object.entries(saved))if(/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(name)){assert(!used.has(name),'Existing point nicknames must be unique');registry.set(id,name);used.add(name)}
 for(const [id,name] of Object.entries(saved))if(!registry.has(id)){
  assert(/^[a-z]+-[a-z]+-[a-z]+$/.test(name),'Invalid existing nickname');
  const pair=name.split('-').slice(0,2).map(capitalize).join(' ');
  if(!used.has(pair)){registry.set(id,pair);used.add(pair)}
 }
 return {nameFor(id){
  if(registry.has(id))return registry.get(id);
  for(let attempt=0;attempt<10000;attempt++){
   const hash=createHash('sha256').update('aquaman-nickname-v2:'+id+':'+attempt).digest();
   const words=[0,4].map(offset=>nameWords[hash.readUInt32BE(offset)%nameWords.length]);
   const name=words.map(capitalize).join(' ');if(new Set(words).size!==2||used.has(name))continue;
   registry.set(id,name);used.add(name);return name;
  }
  throw Error('Nickname space exhausted');
 },entries(){return Object.fromEntries([...registry].sort(([a],[b])=>a.localeCompare(b)))}};
}
export function loadPointNamer(){const path='public/data/wpdx/names.json';const namer=pointNamer(existsSync(path)?JSON.parse(readFileSync(path,'utf8')):{});return {...namer,save(){writeFileSync(path,JSON.stringify(namer.entries(),null,2)+'\n')}};}
