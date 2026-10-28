import {Capacitor} from '@capacitor/core';
import {Geolocation} from '@capacitor/geolocation';
export const locationService={
 available:()=>Capacitor.isNativePlatform()||!!navigator.geolocation,
 getCurrentPosition(success:(p:{coords:{latitude:number;longitude:number}})=>void,failure:(e:unknown)=>void,options:PositionOptions={}){
  if(!Capacitor.isNativePlatform()){navigator.geolocation.getCurrentPosition(success,failure,options);return;}
  void (async()=>{
   let permissions=await Geolocation.checkPermissions();
   if(permissions.location!=='granted'&&permissions.coarseLocation!=='granted')permissions=await Geolocation.requestPermissions({permissions:['location']});
   if(permissions.location!=='granted'&&permissions.coarseLocation!=='granted')throw new Error('Location permission declined');
   return Geolocation.getCurrentPosition(options);
  })().then(success).catch(failure);
 }
};
