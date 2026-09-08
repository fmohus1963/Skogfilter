export const speciesClassificationDefinitions={
  S1:{label:"Direkte relevant",short:"Tiltaket kan berøre dokumentert livsmiljø, substrat, individ eller skogstruktur direkte."},
  S2:{label:"Betinget relevant",short:"Relevansen avhenger av tiltakets plassering, styrke eller om konkrete økologiske forhold berøres."},
  S3:{label:"Normalt ikke relevant",short:"Registrert miljø tilsier normalt ingen direkte sammenheng med valgt tiltak."},
  SU:{label:"Uavklart",short:"U betyr uavklart: posten mangler tilstrekkelig miljøinformasjon. Funnets relevans må undersøkes; det er ikke klassifisert som irrelevant."},
} as const;
export const resultClassificationDefinitions={
  special_rule:{icon:"🔴",label:"Krever særskilt hensyn",short:"Særskilt regel eller status gjelder. Se grunnlaget."},
  assessment:{icon:"🟡",label:"Må vurderes",short:"Relevant forhold som krever nærmere vurdering."},
  information:{icon:"🔵",label:"Relevante opplysninger",short:"Relevant informasjon uten identifisert særregel."},
  hidden:{icon:"⚪",label:"Filtrert",short:"Kjent registrering uten implementert relevans for valgt tiltak."},
} as const;
