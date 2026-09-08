import type{ForestAction}from"./skogfilter-engine";
export type HarvestMethod="FLATEHOGST_APEN_HOGST"|"LUKKET_SELEKTIV_HOGST"|"IKKE_SPESIFISERT";
export type LegacyArtsMeasure="clearcut"|"selective"|"thinning"|"youngForest"|"standingDead"|"lyingDead"|"scarification"|"ditching"|"road"|"speciesChange"|"fertilizing"|"oldTrees";
export const legacyArtsMeasures:Record<LegacyArtsMeasure,{code:string;label:string}>={clearcut:{code:"H1",label:"Flatehogst / åpen hogst"},selective:{code:"H2",label:"Lukket eller selektiv hogst"},thinning:{code:"H3",label:"Tynning"},youngForest:{code:"H4",label:"Ungskogpleie og rydding"},standingDead:{code:"H5",label:"Tørrgran, vindfall og døde trær"},lyingDead:{code:"H6",label:"Liggende død ved"},scarification:{code:"H7",label:"Markberedning"},ditching:{code:"H8",label:"Grøfting og grøfterensk"},road:{code:"H9",label:"Skogsbilveg og terrengtransport"},speciesChange:{code:"H10",label:"Treslagsskifte"},fertilizing:{code:"H11",label:"Gjødsling og sprøyting"},oldTrees:{code:"H12",label:"Gamle eller spesielle trær"}};
export const forestActionArtsMapping:Record<ForestAction,{measure:LegacyArtsMeasure;scope:"equivalent"|"legacy_broader"|"legacy_narrower";temporaryLimitation?:string}>={
  MARKBEREDNING:{measure:"scarification",scope:"equivalent"},
  FORYNGELSE:{measure:"speciesChange",scope:"legacy_narrower",temporaryLimitation:"Foryngelse vurderes foreløpig med den smalere H10-profilen for treslagsskifte."},
  UNGSKOGPLEIE:{measure:"youngForest",scope:"equivalent"},
  TYNNING:{measure:"thinning",scope:"equivalent"},
  GJODSLING:{measure:"fertilizing",scope:"legacy_broader",temporaryLimitation:"H11 omfatter også sprøyting, mens brukerens valgte tiltak er gjødsling."},
  SLUTTAVVIRKNING:{measure:"clearcut",scope:"legacy_narrower",temporaryLimitation:"Hogstform er ikke valgt. Artsvurderingen bruker foreløpig H1 for flatehogst / åpen hogst som en midlertidig, snevrere regelprofil."},
  TERRENGTRANSPORT:{measure:"road",scope:"legacy_broader",temporaryLimitation:"H9 omfatter både skogsbilveg og terrengtransport."},
  GROFT:{measure:"ditching",scope:"equivalent"},
  VEG:{measure:"road",scope:"legacy_broader",temporaryLimitation:"H9 omfatter både skogsbilveg og terrengtransport."},
};
export function artsRuleFor(action:ForestAction){const mapping=forestActionArtsMapping[action],legacy=legacyArtsMeasures[mapping.measure];return{...mapping,...legacy}}
