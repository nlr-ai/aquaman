import React,{useEffect,useRef,useState} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
type Coords=[number,number];
export default function LocationPicker({value,onChange}:{value?:Coords;onChange:(value:Coords)=>void}){
 const element=useRef<HTMLDivElement>(null),map=useRef<L.Map|null>(null);const [candidate,setCandidate]=useState<Coords>(value||[6.452,3.337]),[failed,setFailed]=useState(false);
 useEffect(()=>{if(!element.current)return;const instance=L.map(element.current,{scrollWheelZoom:false}).setView(value||[6.452,3.337],16);map.current=instance;L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',maxZoom:19}).on('tileerror',()=>setFailed(true)).addTo(instance);instance.on('moveend',()=>{const p=instance.getCenter();setCandidate([p.lat,p.lng])});instance.on('click',(e:L.LeafletMouseEvent)=>instance.panTo(e.latlng));return()=>{instance.remove();map.current=null}},[]);
 useEffect(()=>{if(value)map.current?.panTo(value)},[value?.[0],value?.[1]]);
 return <div className="locationpicker"><p className="small" id="picker-help">Move the map until the water point is under the pin, or tap a place. Keyboard: focus the map and use arrow keys. Then confirm the position.</p><div className="pickermapwrap"><div ref={element} className="pickermap" role="region" aria-label="Choose water point position on map" aria-describedby="picker-help"/><span className="centre-pin" aria-hidden="true">●</span></div><p className="small">Map centre: {candidate[0].toFixed(5)}, {candidate[1].toFixed(5)}</p><button type="button" className="primary" onClick={()=>onChange(candidate)}>Use this position</button>{failed&&<p className="notice">Some map tiles could not load. You can use GPS or enter coordinates below.</p>}</div>
}
