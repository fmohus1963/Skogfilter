"use client";
import {useId} from "react";
import {Slider} from "@/components/ui/slider";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from "@/components/ui/select";
import {recordKey,registrationYear} from "@/lib/ecological-model";
import {polygonPath} from "@/lib/polygon-path";
import {polygonRings,type NatureFill} from "@/lib/nature-map";
import {datasets,type NormalizedFeature,type FilterResult} from "@/lib/skogfilter-engine";
const colors={hidden:"#69776c",information:"#2774a6",assessment:"#b47b05",special_rule:"#b7372f"};
export function NatureAppearance({strength,onStrength,fill,onFill}:{strength:number;onStrength:(value:number)=>void;fill:NatureFill;onFill:(value:NatureFill)=>void}){
  return <section className="border-b border-[#d7ded6] bg-[#f8faf6] px-4 pb-4" aria-label="Naturtypenes kartstil">
    <div className="flex flex-wrap items-center gap-5"><div className="min-w-48 flex-1"><p id="nature-strength" className="mb-3 text-sm font-semibold">Tydelighet i kartet · {strength} %</p><Slider aria-labelledby="nature-strength" min={0} max={100} step={5} value={[strength]} onValueChange={([value])=>onStrength(value)} className="py-2"/><div className="flex justify-between text-sm text-[#59675f]"><span>Svak</span><span>Tydelig</span></div></div><div><label htmlFor="nature-fill" className="mb-2 block text-sm font-semibold">Visning av naturtyper</label><Select value={fill} onValueChange={value=>onFill(value as NatureFill)}><SelectTrigger id="nature-fill" className="w-44 bg-white"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="solid">Fargefyll</SelectItem><SelectItem value="hatch">Skravur</SelectItem><SelectItem value="outline">Bare omriss</SelectItem></SelectContent></Select></div></div>
    <p className="mt-2 text-sm text-[#59675f]">Endrer bare kartvisningen. Omriss beholdes ved 0 %. Klikk i en naturtype for detaljer og sammenligning av registreringene på stedet.</p>
  </section>;
}
export function NatureMapLayer({features,results,strength,fill,selectedKey,width,height,project}:{features:NormalizedFeature[];results:FilterResult[];strength:number;fill:NatureFill;selectedKey:string|null;width:number;height:number;project:(lon:number,lat:number)=>{x:number;y:number}}){
  const id=useId().replace(/[^a-zA-Z0-9_-]/g,"");
  const byId=new Map(results.map(r=>[recordKey(r.sourceDatasetIds[0],r.featureIds[0]),r]));
  return <svg className="pointer-events-none absolute inset-0 z-10 size-full" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
    <defs>{Object.entries(colors).map(([level,color])=><pattern key={level} id={`${id}-${level}`} width="8" height="8" patternUnits="userSpaceOnUse"><path d="M-2 2 L2 -2 M0 8 L8 0 M6 10 L10 6" stroke={color} strokeWidth="1.5"/></pattern>)}</defs>
    {features.map(feature=>{const key=recordKey(feature.datasetId,feature.featureId),result=byId.get(key);if(!result)return null;return <g key={key}>{polygonRings(feature.geometry).map((polygon,index)=><path key={index} d={polygonPath(polygon,project)} fillRule="evenodd" fill={fill==="outline"?"none":fill==="hatch"?`url(#${id}-${result.relevance})`:colors[result.relevance]} fillOpacity={strength/100*(fill==="hatch"?1:.7)} stroke={colors[result.relevance]} strokeOpacity={.4+.6*strength/100} strokeWidth="1.3" vectorEffect="non-scaling-stroke"/>)}</g>})}
    {features.filter(f=>recordKey(f.datasetId,f.featureId)===selectedKey).flatMap(f=>polygonRings(f.geometry).map((polygon,index)=><g key={index}><path d={polygonPath(polygon,project)} fill="none" stroke="white" strokeWidth="5"/><path d={polygonPath(polygon,project)} fill="none" stroke="#173f2a" strokeWidth="2.5" strokeDasharray="7 3"/></g>))}
  </svg>;
}
function shown(value:unknown){return value===undefined||value===null||value===""?"Ikke oppgitt":String(value)}
export function NatureComparison({features,selectedKey,onSelect,onClose}:{features:NormalizedFeature[];selectedKey:string|null;onSelect:(key:string)=>void;onClose:()=>void}){
  if(!features.length)return null;
  return <section className="border-b border-[#d7ded6] bg-[#edf4ed] p-4" aria-label="Sammenlign naturregistreringer"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{features.length>1?`${features.length} registreringer på valgt sted`:"Valgt naturregistrering"}</h2><button className="rounded border bg-white px-3 py-2 text-sm" onClick={onClose}>Lukk detaljer</button></div><p className="my-2 text-sm">Velg et kort for å fremheve omrisset. Ulike datoer og klassifikasjoner betyr ikke at én registrering erstatter en annen.</p><div className="flex snap-x gap-3 overflow-x-auto pb-2">{features.map(f=>{const key=recordKey(f.datasetId,f.featureId),p=f.properties;return <article key={key} className={`w-72 shrink-0 snap-start rounded-xl border-2 bg-white p-3 ${selectedKey===key?"border-[#173f2a]":"border-[#ced7cd]"}`}><button className="w-full text-left font-semibold underline underline-offset-4" aria-pressed={selectedKey===key} onClick={()=>onSelect(key)}>{f.title}</button><dl className="mt-3 space-y-2 text-sm">{[
    ["Kilde",datasets.find(d=>d.id===f.datasetId)?.name??f.datasetId],["År",registrationYear(f)??"Ukjent år"],["Registreringsdato",f.registrationDate],["Metode",f.method],["Klassifikasjon",[f.ninVersion,p.natureTypeName,p.natureTypeCode].filter(Boolean).join(" · ")],["Kvalitet / verdi",p.localityQuality??p.valueLabel??p.verdi],["Nøyaktighet",p.accuracy],["Kartlegger",p.observer],["Geometri",f.geometry.type],["ID",f.featureId],
  ].map(([label,value])=><div key={String(label)}><dt className="font-semibold">{String(label)}</dt><dd className="break-words text-[#536258]">{shown(value)}</dd></div>)}</dl>{f.sourceUrl&&/^https?:\/\//i.test(f.sourceUrl)&&<a className="mt-3 inline-block text-sm font-semibold underline" href={f.sourceUrl} target="_blank" rel="noreferrer">Åpne originalt faktaark ↗</a>}</article>})}</div><p className="mt-2 text-sm text-[#59675f]">Sammenligningen følger synlige registreringer og år i kartet. Velg «Alle år» for å sammenligne på tvers av år. Registreringsdato er ikke nødvendigvis feltkartleggingsdato.</p></section>;
}
