export type ForestAction =
  | "MARKBEREDNING" | "FORYNGELSE" | "UNGSKOGPLEIE" | "TYNNING"
  | "GJODSLING" | "SLUTTAVVIRKNING" | "TERRENGTRANSPORT" | "GROFT" | "VEG";

export type RelevanceLevel = "hidden" | "information" | "assessment" | "special_rule";
export type BasisType = "law" | "regulation" | "public_decision" | "pefc" | "fsc" | "professional" | "operational";
export type RecordRelationship = "supersedes" | "superseded" | "primary_with_supplement" | "parallel" | "refines" | "conflicts" | "unknown";

export interface DatasetDefinition {
  id: string; name: string; provider: string; sourceUrl?: string;
  serviceType: "API" | "WFS" | "WMS" | "OGC_API" | "ARCGIS" | "RASTER" | "FILE";
  licenseStatus: "open" | "restricted" | "clarification_required" | "unknown";
  license?: string;
  mappingRole: "reference_nin" | "full_coverage_nin" | "management_selection" | "forestry_environment" | "species" | "legal_status" | "external_professional" | "resource_model";
  authorityEffect: "descriptive" | "assessment_trigger" | "management_status" | "legal_status";
  enabled: boolean;
  dataStatus: "LIVE" | "TEST_FIXTURE" | "MOCK" | "NOT_CONNECTED";
  method?: string; mappingYear?: number; ninVersion?: string;
  statusNote: string;
}

export interface NormalizedFeature {
  datasetId: string; featureId: string; geometry: { type: string; coordinates: unknown };
  title: string; registrationDate?: string; mappingYear?: number; method?: string; ninVersion?: string;
  properties: Record<string, unknown>; mappingRole: DatasetDefinition["mappingRole"];
  authorityEffect: DatasetDefinition["authorityEffect"]; sourceUrl?: string;
}

export interface FilterResult {
  featureIds: string[]; action: ForestAction; relevance: RelevanceLevel; basisType: BasisType;
  basisReference?: string; title: string; reason: string; recommendedAction?: string;
  sourceDatasetIds: string[]; sourceDate?: string; relationship?: RecordRelationship;
  geometryRelation?: "inside" | "overlap" | "near" | "buffer" | "crossing";
  distanceMeters?: number; confidence: "high" | "medium" | "low" | "insufficient_data";
}

export const datasets: DatasetDefinition[] = [
  {id:"artskart",name:"Artskart / Artsdatabanken",provider:"Artsdatabanken",sourceUrl:"https://artskart.artsdatabanken.no/",serviceType:"API",licenseStatus:"open",license:"NLOD 2.0",mappingRole:"species",authorityEffect:"assessment_trigger",enabled:true,dataStatus:"LIVE",method:"Artskart Public API",statusNote:"Levende uttrekk for brukerens valgte område."},
  {id:"mdir_naturetypes",name:"Naturtyper etter Miljødirektoratets instruks",provider:"Miljødirektoratet",sourceUrl:"https://kart.miljodirektoratet.no/arcgis/rest/services/naturtyper_nin/MapServer/0",serviceType:"ARCGIS",licenseStatus:"open",license:"NLOD 2.0",mappingRole:"management_selection",authorityEffect:"assessment_trigger",enabled:true,dataStatus:"LIVE",method:"Miljødirektoratets instruks / ArcGIS Feature Layer",ninVersion:"NiN 2.1",statusNote:"Levende, romlig avgrenset GeoJSON-uttrekk for brukerens valgte område."},
  {id:"utvalgte_naturtyper",name:"Utvalgte naturtyper",provider:"Miljødirektoratet",sourceUrl:"https://kartkatalog.miljodirektoratet.no/",serviceType:"API",licenseStatus:"open",mappingRole:"legal_status",authorityEffect:"legal_status",enabled:false,dataStatus:"NOT_CONNECTED",statusNote:"Definisjon finnes, men ingen data brukes i resultatene."},
  {id:"dn13",name:"Naturtyper etter DN-håndbok 13",provider:"Miljødirektoratet",sourceUrl:"https://kartkatalog.miljodirektoratet.no/",serviceType:"WFS",licenseStatus:"open",mappingRole:"management_selection",authorityEffect:"assessment_trigger",enabled:true,dataStatus:"TEST_FIXTURE",method:"DN-håndbok 13",mappingYear:2010,statusNote:"Kun testregistrering for overlapps- og filtreringstest."},
  {id:"mis_nokkel",name:"MiS – nøkkelbiotoper",provider:"NIBIO / skogeier",serviceType:"WMS",licenseStatus:"unknown",mappingRole:"forestry_environment",authorityEffect:"management_status",enabled:false,dataStatus:"NOT_CONNECTED",method:"MiS",statusNote:"Særregel er definert, men ingen maskinell tjeneste er koblet til."},
  {id:"mis_valgt",name:"MiS – utvalgte livsmiljøer",provider:"NIBIO / skogeier",serviceType:"WMS",licenseStatus:"unknown",mappingRole:"forestry_environment",authorityEffect:"management_status",enabled:false,dataStatus:"NOT_CONNECTED",method:"MiS",statusNote:"Overlappsregelen er testet, men datasettet er ikke live."},
  {id:"mis_ikke_valgt",name:"MiS – ikke-utvalgte livsmiljøer",provider:"NIBIO / skogeier",serviceType:"WMS",licenseStatus:"unknown",mappingRole:"forestry_environment",authorityEffect:"descriptive",enabled:true,dataStatus:"TEST_FIXTURE",method:"MiS",mappingYear:2025,statusNote:"Merket testregistrering i Eiker/Veia-scenarioet; ikke live."},
  {id:"nin_full",name:"Ren / heldekkende NiN-kartlegging",provider:"Kartleggingsinstitusjon",serviceType:"FILE",licenseStatus:"unknown",mappingRole:"full_coverage_nin",authorityEffect:"descriptive",enabled:false,dataStatus:"NOT_CONNECTED",method:"NiN",statusNote:"Arkitekturen bevarer faglig prioritet, men datasettet er ikke koblet til."},
  {id:"nhm_nin",name:"NHM/UiO – NiN-referansekartlegging",provider:"Naturhistorisk museum, UiO",serviceType:"FILE",licenseStatus:"unknown",mappingRole:"reference_nin",authorityEffect:"descriptive",enabled:true,dataStatus:"TEST_FIXTURE",method:"NiN referansekartlegging",mappingYear:2020,ninVersion:"NiN 2.0",statusNote:"Merket Eiker/Veia-regresjonsfixture; ikke live eller publisert kildedatasett."},
  {id:"narin",name:"NARIN / Biofokus",provider:"Biofokus",serviceType:"FILE",licenseStatus:"clarification_required",mappingRole:"external_professional",authorityEffect:"descriptive",enabled:false,dataStatus:"NOT_CONNECTED",statusNote:"Ikke høstet, mellomlagret eller republisert. Gjenbruksrettigheter må avklares."},
];

export function relationshipBetween(a: NormalizedFeature, b: NormalizedFeature): RecordRelationship {
  const sameMethod = a.method && b.method && a.method === b.method;
  if (sameMethod && a.mappingYear && b.mappingYear && a.mappingYear !== b.mappingYear) return a.mappingYear > b.mappingYear ? "supersedes" : "superseded";
  const ids = new Set([a.datasetId,b.datasetId]);
  if (ids.has("dn13") && ids.has("mdir_naturetypes")) return "primary_with_supplement";
  if ([...ids].some(id=>id.startsWith("mis_")) && ids.has("mdir_naturetypes")) return "parallel";
  if ((ids.has("nhm_nin") || ids.has("nin_full")) && ids.has("mdir_naturetypes")) {
    const aType=String(a.properties.grunntype??""),bType=String(b.properties.grunntype??"");
    return aType && bType && aType!==bType ? "conflicts" : "refines";
  }
  return "unknown";
}

export const eikerDemoFeatures: NormalizedFeature[] = [
  {datasetId:"nhm_nin",featureId:"nhm-veia-2020",geometry:{type:"Polygon",coordinates:[]},title:"NHM/UiO – NiN 2020",mappingYear:2020,method:"NiN referansekartlegging",ninVersion:"NiN 2.0",properties:{grunntype:"kalkrik høgstaudeskog",kalktrinn:"høyt"},mappingRole:"reference_nin",authorityEffect:"descriptive",sourceUrl:"https://www.nhm.uio.no/"},
  {datasetId:"mdir_naturetypes",featureId:"mdir-eiker-2018",geometry:{type:"Polygon",coordinates:[]},title:"Mdir-instruks – Eiker",mappingYear:2018,method:"Miljødirektoratets instruks",properties:{grunntype:"kalkgranskog",localityQuality:"Høy kvalitet",UK_Truet:1,"UK_SentralØkosystemFunksjon":1},mappingRole:"management_selection",authorityEffect:"assessment_trigger",sourceUrl:"https://kartkatalog.miljodirektoratet.no/"},
  {datasetId:"mis_ikke_valgt",featureId:"mis-veia-2025",geometry:{type:"Polygon",coordinates:[]},title:"MiS-livsmiljø – ikke valgt",mappingYear:2025,method:"MiS",properties:{livsmiljo:"liggende død ved",utvalgt:false},mappingRole:"forestry_environment",authorityEffect:"descriptive"},
];

export const v8FixtureFeatures: NormalizedFeature[] = [
  ...eikerDemoFeatures,
  {datasetId:"dn13",featureId:"dn13-eiker-2010",geometry:{type:"Polygon",coordinates:[]},title:"DN13 – eldre registrering",mappingYear:2010,method:"DN-håndbok 13",properties:{verdi:"C"},mappingRole:"management_selection",authorityEffect:"assessment_trigger"},
];

export function filterFeatures(features: NormalizedFeature[], action: ForestAction): FilterResult[] {
  return features.map(feature=>{
    const base={featureIds:[feature.featureId],action,sourceDatasetIds:[feature.datasetId],sourceDate:feature.mappingYear?String(feature.mappingYear):undefined,geometryRelation:"overlap" as const};
    if(feature.datasetId==="nhm_nin") return {...base,relevance:action==="MARKBEREDNING"?"assessment":"information",basisType:"professional",title:feature.title,reason:action==="MARKBEREDNING"?"Detaljert NiN-grunnlag viser kalkrik høgstaudeskog som kan påvirkes direkte i skogbunnen.":"Detaljert faglig naturbeskrivelse beholdes parallelt med forvaltningskartleggingen.",recommendedAction:"Sammenhold grunntype og kalktrinn med feltforholdene.",confidence:"high" as const};
    if(feature.datasetId==="mdir_naturetypes"){
      const p=feature.properties,threatened=p.UK_Truet===1,central=p["UK_SentralØkosystemFunksjon"]===1,quality=String(p.localityQuality??p.lokalitetskvalitet??""),diversity=String(p.biodiversity??"");
      if(!threatened&&!central)return {...base,relevance:"hidden",basisType:"professional",title:feature.title,reason:"Figuren finnes i området, men tilgjengelige utvalgskriterier utløser ingen implementert tiltakregel.",confidence:(p.UK_Truet==null&&p["UK_SentralØkosystemFunksjon"]==null?"insufficient_data":"high") as FilterResult["confidence"]};
      if(action!=="SLUTTAVVIRKNING"&&action!=="MARKBEREDNING")return {...base,relevance:"information",basisType:"professional",title:feature.title,reason:"Naturtypen er prioritert for kartlegging, men valgt tiltak har foreløpig ingen mer spesifikk regel.",confidence:"medium" as const};
      const ground=action==="MARKBEREDNING",strong=quality.startsWith("Svært høy")||quality.startsWith("Høy")||diversity==="Stort";
      return {...base,relevance:(ground&&central&&strong?"special_rule":"assessment") as RelevanceLevel,basisType:"professional",title:feature.title,reason:ground?`Markinngrep kan påvirke en ${central?"naturtype med sentral økosystemfunksjon":"truet naturtype"}${quality?` med ${quality.toLowerCase()}`:""}.`:`${threatened?"Truet naturtype":"Naturtype med sentral økosystemfunksjon"}${quality?` med ${quality.toLowerCase()}`:""} må vurderes før sluttavvirkning.`,recommendedAction:ground?"Avgrens markinngrep og kontroller lokalitetens faktiske verdier i felt.":"Vurder figurens avgrensning, kvalitet og naturmangfold før avvirkning.",confidence:(quality||diversity?"high":"insufficient_data") as FilterResult["confidence"]};
    }
    if(feature.datasetId==="mis_ikke_valgt") return {...base,relevance:action==="MARKBEREDNING"?"assessment":"information",basisType:"pefc",title:feature.title,reason:action==="MARKBEREDNING"?"Markinngrep kan berøre livsmiljøet selv om figuren ikke er valgt som nøkkelbiotop.":"Ikke-utvalgt MiS-livsmiljø er relevant informasjon, men er ikke en nøkkelbiotop.",recommendedAction:"Avklar status og faktisk påvirkning; ikke anta nøkkelbiotopstatus.",confidence:"medium" as const};
    return {...base,relevance:"hidden",basisType:"professional",title:feature.title,reason:"Ingen implementert regel gjør registreringen relevant for valgt tiltak.",confidence:"insufficient_data" as const};
  });
}

export function groupOverlaps(features: NormalizedFeature[], action: ForestAction): FilterResult {
  const relation=relationshipBetween(features[0],features[1]);
  const results=filterFeatures(features,action);
  const rank:Record<RelevanceLevel,number>={hidden:0,information:1,assessment:2,special_rule:3};
  const relevance=results.reduce((best,item)=>rank[item.relevance]>rank[best]?item.relevance:best,"hidden" as RelevanceLevel);
  return {featureIds:features.map(f=>f.featureId),action,relevance,basisType:"professional",title:"Flere naturkartlegginger finnes",reason:"NiN beskriver naturforholdene detaljert, Mdir-data har forvaltningsrettet funksjon, og MiS beholdes parallelt. Ingen kilde skjules automatisk.",recommendedAction:action==="MARKBEREDNING"?"Vurder skogbunn, kalktrinn og livsmiljø før markinngrep.":"Vurder registreringene samlet før avvirkning.",sourceDatasetIds:features.map(f=>f.datasetId),relationship:relation,geometryRelation:"overlap",confidence:"high"};
}

export function summarizeResults(results: FilterResult[]) {
  const unique=new Map<string,{relevance:RelevanceLevel;datasetId:string}>();
  const rank:Record<RelevanceLevel,number>={hidden:0,information:1,assessment:2,special_rule:3};
  for(const result of results) result.featureIds.forEach((id,index)=>{const current=unique.get(id),candidate={relevance:result.relevance,datasetId:result.sourceDatasetIds[index]??result.sourceDatasetIds[0]??"unknown"};if(!current||rank[candidate.relevance]>rank[current.relevance])unique.set(id,candidate)});
  const counts={special_rule:0,assessment:0,information:0,hidden:0};
  const categories={arter:0,naturtyper:0,mis:0,nin:0,andre:0};
  for(const item of unique.values()){
    counts[item.relevance]++;
    if(item.datasetId==="artskart")categories.arter++;else if(item.datasetId.startsWith("mis_"))categories.mis++;else if(item.datasetId==="mdir_naturetypes"||item.datasetId==="dn13"||item.datasetId==="utvalgte_naturtyper")categories.naturtyper++;else if(item.datasetId.includes("nin"))categories.nin++;else categories.andre++;
  }
  return {counts,categories,total:unique.size,relevant:unique.size-counts.hidden};
}

export const actionMeta: Record<ForestAction,{label:string;phase:"cycle"|"other";rules:"complete"|"expanding"}> = {
  MARKBEREDNING:{label:"Markberedning",phase:"cycle",rules:"complete"},FORYNGELSE:{label:"Foryngelse",phase:"cycle",rules:"expanding"},UNGSKOGPLEIE:{label:"Ungskogpleie",phase:"cycle",rules:"expanding"},TYNNING:{label:"Tynning",phase:"cycle",rules:"expanding"},GJODSLING:{label:"Gjødsling",phase:"cycle",rules:"expanding"},SLUTTAVVIRKNING:{label:"Sluttavvirkning",phase:"cycle",rules:"complete"},TERRENGTRANSPORT:{label:"Terrengtransport",phase:"other",rules:"expanding"},GROFT:{label:"Grøfting / grøfterensk",phase:"other",rules:"expanding"},VEG:{label:"Nybygging / ombygging av skogsbilveg",phase:"other",rules:"expanding"}
};
