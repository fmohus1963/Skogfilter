"use client";
import { chronological, inRegistrationYear, recordKey, registrationYear } from "@/lib/ecological-model";
import { datasets, type NormalizedFeature } from "@/lib/skogfilter-engine";
export type TimelineYear = "all" | "unknown" | number;
export function visibleRegistrations(features: NormalizedFeature[],year:TimelineYear,hidden:Set<string>){return features.filter(f=>inRegistrationYear(f,year)&&!hidden.has(recordKey(f.datasetId,f.featureId)))}
export function RegistrationTimeline({features,year,onYear,hidden,onHidden,onSelect}:{features:NormalizedFeature[];year:TimelineYear;onYear:(year:TimelineYear)=>void;hidden:Set<string>;onHidden:(hidden:Set<string>)=>void;onSelect:(key:string)=>void}){
  const years=[...new Set(features.map(registrationYear).filter((y):y is number=>y!==undefined))].sort((a,b)=>a-b);
  const index=typeof year==="number"?years.indexOf(year):-1;
  return <section className="border-b border-[#d7ded6] bg-[#f8faf6] p-4" aria-label="Naturregistreringer etter år">
    <h2 className="font-semibold">Naturregistreringer · år og kartvisning</h2>
    <p className="my-2 text-sm">Hver kartlegging beholdes separat. Året gjelder registreringen, ikke hvor lenge naturtypen har eksistert.</p>
    <div className="flex flex-wrap items-center gap-2">
      <button className="rounded border p-2 disabled:opacity-40" disabled={!years.length||(index===0)} onClick={()=>onYear(years[index<0?years.length-1:index-1])}>◀ Eldre</button>
      <label className="text-sm">Vis år <select className="rounded border bg-white p-2" value={year} onChange={e=>onYear(e.target.value==="all"||e.target.value==="unknown"?e.target.value:Number(e.target.value))}><option value="all">Alle år</option>{years.map(y=><option key={y} value={y}>{y}</option>)}<option value="unknown">Ukjent år</option></select></label>
      <button className="rounded border p-2 disabled:opacity-40" disabled={!years.length||index===years.length-1} onClick={()=>onYear(years[index<0?0:index+1])}>Nyere ▶</button>
      <button className="rounded border p-2 text-sm" onClick={()=>{onYear("all");onHidden(new Set())}}>Vis alle registreringer</button>
    </div>
    <details className="mt-3"><summary className="cursor-pointer text-sm font-medium">Slå enkeltregistreringer av/på ({features.length})</summary>
      <div className="mt-2 max-h-64 space-y-2 overflow-auto scrollbar-thin scrollbar-stable">{chronological(features).map(f=>{const key=recordKey(f.datasetId,f.featureId);return <div key={key} className="flex items-start gap-2 rounded border bg-white p-2 text-sm"><input type="checkbox" aria-label={`Vis ${f.title}, ${registrationYear(f)??"ukjent år"}`} className="mt-1" checked={!hidden.has(key)} onChange={e=>{const next=new Set(hidden);if(e.target.checked)next.delete(key);else next.add(key);onHidden(next)}}/><span><button className="font-semibold underline underline-offset-4" onClick={()=>onSelect(key)}>{f.title}</button> · {registrationYear(f)??"Ukjent år"}<br/>{datasets.find(d=>d.id===f.datasetId)?.name??f.datasetId} · {f.method??"Ukjent metode"}{f.ninVersion?` · ${f.ninVersion}`:""}<br/><small>{f.featureId}</small></span></div>})}</div>
    </details>
    {!features.length&&<p className="mt-2 text-sm">Ingen naturregistreringer i gjeldende uttrekk.</p>}
  </section>;
}
