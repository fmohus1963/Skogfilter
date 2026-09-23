import {DN13_SERVICE,dn13Domains,normalizeDn13,type Dn13Domains} from "@/lib/dn13-adapter";
import {natureRegistration} from "@/lib/registration-adapters";
import type {GeoJsonFeature} from "@/lib/mdir-nature-type-adapter";
export const runtime="edge";
let cachedDomains:{value:Dn13Domains;expires:number}|undefined;
async function getDomains(){
  if(cachedDomains&&cachedDomains.expires>Date.now())return cachedDomains.value;
  const response=await fetch(`${DN13_SERVICE}?f=json`,{signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error("Kodelister utilgjengelige");
  const metadata=await response.json() as Parameters<typeof dn13Domains>[0];
  if(!Array.isArray(metadata.fields))throw new Error("Kodelister mangler");
  const value=dn13Domains(metadata);cachedDomains={value,expires:Date.now()+3600000};return value;
}
export async function POST(request:Request){
  let body:{points?:{lon:number;lat:number}[]};
  try{body=await request.json() as typeof body}catch{return Response.json({error:"Ugyldig område."},{status:400})}
  const points=body?.points;
  if(!Array.isArray(points)||points.length<3||points.length>500||!points.every(p=>p&&Number.isFinite(p.lon)&&Number.isFinite(p.lat)&&Math.abs(p.lon)<=180&&Math.abs(p.lat)<=90))return Response.json({error:"Ugyldig eller manglende område."},{status:400});
  try{
    const domains=await getDomains().catch(()=>({} as Dn13Domains)),ring=points.map(p=>[p.lon,p.lat]);ring.push(ring[0]);
    const results:ReturnType<typeof normalizeDn13>[]=[],seen=new Set<string>();let truncated=false,skipped=0;
    for(let offset=0;offset<2000;offset+=500){
      const params=new URLSearchParams({where:"1=1",geometry:JSON.stringify({rings:[ring],spatialReference:{wkid:4326}}),geometryType:"esriGeometryPolygon",inSR:"4326",outSR:"4326",spatialRel:"esriSpatialRelIntersects",outFields:"*",returnGeometry:"true",f:"geojson",resultOffset:String(offset),resultRecordCount:"500",orderByFields:"OBJECTID ASC"});
      const response=await fetch(`${DN13_SERVICE}/query`,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:params,signal:AbortSignal.timeout(18000)});
      if(!response.ok)throw new Error(`DN13 HTTP ${response.status}`);
      const payload=await response.json() as {features?:GeoJsonFeature[];error?:unknown;exceededTransferLimit?:boolean;properties?:{exceededTransferLimit?:boolean}};
      if(payload.error||!Array.isArray(payload.features))throw new Error("Ugyldig DN13-svar");
      for(const raw of payload.features){try{const f=normalizeDn13(raw,domains);if(!seen.has(f.featureId)){results.push(f);seen.add(f.featureId)}}catch{skipped++}}
      const more=payload.exceededTransferLimit??payload.properties?.exceededTransferLimit??payload.features.length===500;
      if(!more)break;if(offset===1500)truncated=true;
    }
    return Response.json({results,registrations:results.map(natureRegistration),total:results.length,truncated,skipped,codeLabelsAvailable:Object.keys(domains).length>0,fetchedAt:new Date().toISOString(),serviceUrl:DN13_SERVICE});
  }catch{return Response.json({error:"DN13-data kunne ikke hentes akkurat nå. Prøv igjen eller velg et mindre område."},{status:502})}
}
