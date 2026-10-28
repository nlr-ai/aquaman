import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pointNamer,nameWords} from './point-names.mjs';
const registry=JSON.parse(readFileSync('public/data/wpdx/names.json','utf8'));
const namer=pointNamer(registry);
for(const [id,name] of Object.entries(registry)){
 assert.equal(namer.nameFor(id),name);
 const words=name.split('-');assert.equal(new Set(words).size,3);assert(words.every(w=>nameWords.includes(w)));
}
const first=pointNamer().nameFor('collision-test');
const occupied=pointNamer({anotherPoint:first});
assert.notEqual(occupied.nameFor('collision-test'),first,'A collision must get a different, persisted name');
const ids=Array.from({length:5000},(_,i)=>'synthetic-test:'+i);
const names=ids.map(id=>namer.nameFor(id));assert.equal(new Set(names).size,names.length);
const reloaded=pointNamer(JSON.parse(JSON.stringify(namer.entries())));
for(const id of ids.toReversed())assert.equal(reloaded.nameFor(id),namer.nameFor(id));
assert.equal(Object.keys(reloaded.entries()).length,new Set(Object.values(reloaded.entries())).size);
console.log('Point names verified: existing registry retained, three distinct curated words, collision handling, stable after serialization/reordering, 5,000 new unique test names.');
