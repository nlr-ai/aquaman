import {CircleCheck, CircleHelp, CircleX, Clock3, Coins, Droplets, Faucet, Gift, LockKeyhole, Users, Waves} from 'lucide-react';
import type {Point} from './main';

export function waterTypeKey(type:string){return type==='Borehole'?'borehole':type==='Well'?'well':type==='Public tap'?'tap':'other';}
export function WaterTypeIcon({type,size=18}:{type:string;size?:number}){
 const Icon=({borehole:Droplets,well:Waves,tap:Faucet,other:Droplets})[waterTypeKey(type)];
 return <Icon size={size} aria-hidden="true" focusable="false"/>;
}
export function AvailabilityIcon({status,size=16}:{status:Point['status'];size?:number}){
 const Icon=status==='Working'?CircleCheck:status==='Intermittent'?Clock3:status==='Not working'?CircleX:CircleHelp;
 return <Icon size={size} aria-hidden="true" focusable="false"/>;
}
export function AccessIcon({access,size=16}:{access:string;size?:number}){
 const Icon=access==='Public'?Users:/private|restricted/i.test(access)?LockKeyhole:CircleHelp;
 return <Icon size={size} aria-hidden="true" focusable="false"/>;
}
export function PriceIcon({price,size=16}:{price:string;size?:number}){
 const Icon=price.toLowerCase()==='free'?Gift:Coins;
 return <Icon size={size} aria-hidden="true" focusable="false"/>;
}
