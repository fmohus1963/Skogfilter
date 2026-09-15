/** SVG evenodd preserves holes; every source polygon remains a separate path. */
export function polygonPath(rings:number[][][],project:(lon:number,lat:number)=>{x:number;y:number}){
  return rings.filter(r=>r.length>=3&&r.every(p=>p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])))
    .map(r=>r.map(([lon,lat],i)=>{const p=project(lon,lat);return`${i===0?"M":"L"}${p.x},${p.y}`}).join(" ")+" Z").join(" ");
}
