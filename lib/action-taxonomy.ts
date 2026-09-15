import type { ForestAction } from "./skogfilter-engine";
export interface ActionDefinition { id: string; label: string; parentId?: string; axis: "cycle" | "crossCutting"; legacyAction: ForestAction }
export const actionTaxonomy: ActionDefinition[] = [
  ...([ ["MARKBEREDNING","Markberedning"], ["FORYNGELSE","Foryngelse"], ["UNGSKOGPLEIE","Ungskogpleie"], ["TYNNING","Tynning"], ["GJODSLING","Gjødsling"], ["SLUTTAVVIRKNING","Sluttavvirkning"] ] as const).map(([id,label])=>({id,label,axis:"cycle" as const,legacyAction:id})),
  ...([ ["FLATEHOGST","Flatehogst"], ["FROTRESTILLING","Frøtrestillingshogst"], ["SKJERMSTILLING","Skjermstillingshogst"], ["SELEKTIV_HOGST","Selektiv hogst"], ["PLUKKHOGST","Plukkhogst"] ] as const).map(([id,label])=>({id,label,parentId:"SLUTTAVVIRKNING",axis:"cycle" as const,legacyAction:"SLUTTAVVIRKNING" as const})),
  {id:"TERRENGTRANSPORT",label:"Terrengtransport",axis:"crossCutting",legacyAction:"TERRENGTRANSPORT"},
  {id:"GROFT",label:"Grøfting / grøfterensk",axis:"crossCutting",legacyAction:"GROFT"},
  {id:"GROFTING",label:"Grøfting",parentId:"GROFT",axis:"crossCutting",legacyAction:"GROFT"},
  {id:"GROFTERENSK",label:"Grøfterensk",parentId:"GROFT",axis:"crossCutting",legacyAction:"GROFT"},
  {id:"VEG",label:"Skogsbilveg",axis:"crossCutting",legacyAction:"VEG"},
];
export const actionChildren = (parentId: string) => actionTaxonomy.filter(a=>a.parentId===parentId);
export const actionDefinition = (id: string) => actionTaxonomy.find(a=>a.id===id);
