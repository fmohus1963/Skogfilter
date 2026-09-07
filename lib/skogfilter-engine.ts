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
  connectionStatus: "connected" | "prepared" | "blocked";
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
  {id:"artskart",name:"Artskart / Artsdatabanken",provider:"Artsdatabanken",sourceUrl:"https://artskart.artsdatabanken.no/",serviceType:"API",licenseStatus:"open",license:"NLOD 2.0",mappingRole:"species",authorityEffect:"assessment_trigger",enabled:true,connectionStatus:"connected",statusNote:"Levende API-uttrekk er koblet til piloten."},
  {id:"mdir_naturtyper",name:"Naturtyper etter Miljødirektoratets instruks",provider:"Miljødirektoratet",sourceUrl:"https://kartkatalog.miljodirektoratet.no/",serviceType:"API",licenseStatus:"open",mappingRole:"management_selection",authorityEffect:"assessment_trigger",enabled:true,connectionStatus:"prepared",statusNote:"Adapter og regler er klargjort; piloten bruker demonstrasjonsdata."},
  {id:"utvalgte_naturtyper",name:"Utvalgte naturtyper",provider:"Miljødirektoratet",sourceUrl:"https://kartkatalog.miljodirektoratet.no/",serviceType:"API",licenseStatus:"open",mappingRole:"legal_status",authorityEffect:"legal_status",enabled:true,connectionStatus:"prepared",statusNote:"Regel og normalisert format er klargjort."},
  {id:"dn13",name:"Naturtyper etter DN-håndbok 13",provider:"Miljødirektoratet",sourceUrl:"https://kartkatalog.miljodirektoratet.no/",serviceType:"WFS",licenseStatus:"open",mappingRole:"management_selection",authorityEffect:"assessment_trigger",enabled:true,connectionStatus:"prepared",statusNote:"Overlappsregel mot nyere Mdir-kartlegging er implementert."},
  {id:"mis_nokkel",name:"MiS – nøkkelbiotoper",provider:"NIBIO / skogeier",serviceType:"WMS",licenseStatus:"unknown",mappingRole:"forestry_environment",authorityEffect:"management_status",enabled:true,connectionStatus:"prepared",statusNote:"Særregel er klargjort; ingen landsdekkende maskinell tjeneste er koblet til."},
  {id:"mis_valgt",name:"MiS – utvalgte livsmiljøer",provider:"NIBIO / skogeier",serviceType:"WMS",licenseStatus:"unknown",mappingRole:"forestry_environment",authorityEffect:"management_status",enabled:true,connectionStatus:"prepared",statusNote:"Behandles parallelt med naturtypekartlegging."},
  {id:"mis_ikke_valgt",name:"MiS – ikke-utvalgte livsmiljøer",provider:"NIBIO / skogeier",serviceType:"WMS",licenseStatus:"unknown",mappingRole:"forestry_environment",authorityEffect:"descriptive",enabled:true,connectionStatus:"prepared",statusNote:"Skal aldri automatisk behandles som nøkkelbiotop."},
  {id:"nin_full",name:"Ren / heldekkende NiN-kartlegging",provider:"Kartleggingsinstitusjon",serviceType:"FILE",licenseStatus:"unknown",mappingRole:"full_coverage_nin",authorityEffect:"descriptive",enabled:true,connectionStatus:"prepared",statusNote:"Beholdes som selvstendig faglig beskrivelsesgrunnlag."},
  {id:"nhm_nin",name:"NHM/UiO – NiN-referansekartlegging",provider:"Naturhistorisk museum, UiO",serviceType:"FILE",licenseStatus:"unknown",mappingRole:"reference_nin",authorityEffect:"descriptive",enabled:true,connectionStatus:"prepared",statusNote:"Eiker/Veia-regresjonseksempel er inkludert; ingen generell nedprioritering."},
  {id:"narin",name:"NARIN / Biofokus",provider:"Biofokus",serviceType:"FILE",licenseStatus:"clarification_required",mappingRole:"external_professional",authorityEffect:"descriptive",enabled:false,connectionStatus:"blocked",statusNote:"Ikke høstet, mellomlagret eller republisert. Gjenbruksrettigheter må avklares."},
];

export function relationshipBetween(a: NormalizedFeature, b: NormalizedFeature): RecordRelationship {
  const sameMethod = a.method && b.method && a.method === b.method;
  if (sameMethod && a.mappingYear && b.mappingYear && a.mappingYear !== b.mappingYear) return a.mappingYear > b.mappingYear ? "supersedes" : "superseded";
  const ids = new Set([a.datasetId,b.datasetId]);
  if (ids.has("dn13") && ids.has("mdir_naturtyper")) return "primary_with_supplement";
  if ([...ids].some(id=>id.startsWith("mis_")) && ids.has("mdir_naturtyper")) return "parallel";
  if ((ids.has("nhm_nin") || ids.has("nin_full")) && ids.has("mdir_naturtyper")) {
    const aType=String(a.properties.grunntype??""),bType=String(b.properties.grunntype??"");
    return aType && bType && aType!==bType ? "conflicts" : "refines";
  }
  return "unknown";
}

export const eikerDemoFeatures: NormalizedFeature[] = [
  {datasetId:"nhm_nin",featureId:"nhm-veia-2020",geometry:{type:"Polygon",coordinates:[]},title:"NHM/UiO – NiN 2020",mappingYear:2020,method:"NiN referansekartlegging",ninVersion:"NiN 2.0",properties:{grunntype:"kalkrik høgstaudeskog",kalktrinn:"høyt"},mappingRole:"reference_nin",authorityEffect:"descriptive",sourceUrl:"https://www.nhm.uio.no/"},
  {datasetId:"mdir_naturtyper",featureId:"mdir-eiker-2018",geometry:{type:"Polygon",coordinates:[]},title:"Mdir-instruks – Eiker",mappingYear:2018,method:"Miljødirektoratets instruks",properties:{grunntype:"kalkgranskog",lokalitetskvalitet:"høy"},mappingRole:"management_selection",authorityEffect:"assessment_trigger",sourceUrl:"https://kartkatalog.miljodirektoratet.no/"},
  {datasetId:"mis_ikke_valgt",featureId:"mis-veia-2025",geometry:{type:"Polygon",coordinates:[]},title:"MiS-livsmiljø – ikke valgt",mappingYear:2025,method:"MiS",properties:{livsmiljo:"liggende død ved",utvalgt:false},mappingRole:"forestry_environment",authorityEffect:"descriptive"},
];

export function filterFeatures(features: NormalizedFeature[], action: ForestAction): FilterResult[] {
  return features.map(feature=>{
    const base={featureIds:[feature.featureId],action,sourceDatasetIds:[feature.datasetId],sourceDate:feature.mappingYear?String(feature.mappingYear):undefined,geometryRelation:"overlap" as const};
    if(feature.datasetId==="nhm_nin") return {...base,relevance:action==="MARKBEREDNING"?"assessment":"information",basisType:"professional",title:feature.title,reason:action==="MARKBEREDNING"?"Detaljert NiN-grunnlag viser kalkrik høgstaudeskog som kan påvirkes direkte i skogbunnen.":"Detaljert faglig naturbeskrivelse beholdes parallelt med forvaltningskartleggingen.",recommendedAction:"Sammenhold grunntype og kalktrinn med feltforholdene.",confidence:"high" as const};
    if(feature.datasetId==="mdir_naturtyper") return {...base,relevance:"assessment",basisType:"professional",title:feature.title,reason:"Polygonet er ikke en restriksjon i seg selv; registrerte egenskaper utløser konkret vurdering.",recommendedAction:"Kontroller lokalitetskvalitet og hvilke deler av arealet tiltaket berører.",confidence:"medium" as const};
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

export const actionMeta: Record<ForestAction,{label:string;phase:"cycle"|"other";rules:"complete"|"expanding"}> = {
  MARKBEREDNING:{label:"Markberedning",phase:"cycle",rules:"complete"},FORYNGELSE:{label:"Foryngelse",phase:"cycle",rules:"expanding"},UNGSKOGPLEIE:{label:"Ungskogpleie",phase:"cycle",rules:"expanding"},TYNNING:{label:"Tynning",phase:"cycle",rules:"expanding"},GJODSLING:{label:"Gjødsling",phase:"cycle",rules:"expanding"},SLUTTAVVIRKNING:{label:"Sluttavvirkning",phase:"cycle",rules:"complete"},TERRENGTRANSPORT:{label:"Terrengtransport",phase:"other",rules:"expanding"},GROFT:{label:"Grøfting / grøfterensk",phase:"other",rules:"expanding"},VEG:{label:"Nybygging / ombygging av skogsbilveg",phase:"other",rules:"expanding"}
};
