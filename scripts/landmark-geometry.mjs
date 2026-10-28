// Local metre projection for short-distance landmark suggestions only.
export function geometryDistance(point,geometry,closed=false){
 if(!geometry.length)return Infinity;
 const scale=Math.PI/180*6371000,cos=Math.cos(point[0]*Math.PI/180);
 const xy=geometry.map(([lat,lon])=>[(lon-point[1])*scale*cos,(lat-point[0])*scale]);
 if(closed&&xy.length>=4){let inside=false;for(let i=0,j=xy.length-1;i<xy.length;j=i++){const [x,y]=xy[i],[u,v]=xy[j];if((y>0)!==(v>0)&&0<(u-x)*(-y)/(v-y)+x)inside=!inside;}if(inside)return 0;}
 let best=Math.hypot(...xy[0]);
 for(let i=1;i<xy.length;i++){const [x,y]=xy[i-1],[u,v]=xy[i],dx=u-x,dy=v-y,l=dx*dx+dy*dy;const t=l?Math.max(0,Math.min(1,-(x*dx+y*dy)/l)):0;best=Math.min(best,Math.hypot(x+t*dx,y+t*dy));}
 return best;
}
