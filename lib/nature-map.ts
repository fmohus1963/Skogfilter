import type { Geometry } from "./ecological-model";
export type NatureFill = "solid" | "hatch" | "outline";
export type Position = [number,number];
export function polygonRings(geometry:Geometry):number[][][][] {
  return geometry.type==="Polygon"?[geometry.coordinates as number[][][]]:geometry.type==="MultiPolygon"?geometry.coordinates as number[][][][]:[];
}
function ringLocation(point:Position,ring:number[][]):"inside"|"outside"|"boundary" {
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[j],b=ring[i];
    if(!a||!b)continue;
    const cross=(point[0]-a[0])*(b[1]-a[1])-(point[1]-a[1])*(b[0]-a[0]);
    if(Math.abs(cross)<1e-12&&point[0]>=Math.min(a[0],b[0])&&point[0]<=Math.max(a[0],b[0])&&point[1]>=Math.min(a[1],b[1])&&point[1]<=Math.max(a[1],b[1]))return "boundary";
    if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside?"inside":"outside";
}
/** Geographic hit-testing includes boundaries and excludes polygon holes. */
export function containsNaturePoint(geometry:Geometry,point:Position){
  return polygonRings(geometry).some(([outer,...holes])=>{
    if(!outer||outer.length<3||ringLocation(point,outer)==="outside")return false;
    return !holes.some(hole=>ringLocation(point,hole)==="inside");
  });
}
