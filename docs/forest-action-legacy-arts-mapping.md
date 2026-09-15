# Gjeldende status

Hogstform velges nå eksplisitt. Flatehogst bruker H1, selektiv hogst H2; øvrige former og uspesifisert hogst har ingen egen artsregel og gir SU. Grøfting og grøfterensk beholder foreløpig H8. Se [datamodell v9](datamodel-v9.md).

## Historisk beskrivelse før v9

# ForestAction og eldre artsregler

Gjennomgått 8. september 2026. S1/S2/S3/SU-reglene er ikke endret i denne rettingen.

`SLUTTAVVIRKNING` var direkte mappet til `clearcut` / H1. H1 er spesifikt formulert for flatehogst eller åpen hogst: fjerning av hoveddelen av bestandet og direkte endring av skogklima og skogbunn. H1 er derfor ikke synonymt med sluttavvirkning. Ny modell skiller `ForestAction`, `HarvestMethod` og `LegacyArtsMeasure`. Inntil hogstform kan velges er `HarvestMethod=IKKE_SPESIFISERT`, mens H1 brukes som en synlig, midlertidig og snevrere artsregelprofil.

Mapping:

- MARKBEREDNING → H7 Markberedning: tilsvarende omfang.
- FORYNGELSE → H10 Treslagsskifte: gammel profil er smalere enn nytt tiltak.
- UNGSKOGPLEIE → H4 Ungskogpleie og rydding: tilsvarende omfang.
- TYNNING → H3 Tynning: tilsvarende omfang.
- GJODSLING → H11 Gjødsling og sprøyting: gammel profil er bredere.
- SLUTTAVVIRKNING → H1 Flatehogst / åpen hogst: gammel profil er smalere.
- TERRENGTRANSPORT → H9 Skogsbilveg og terrengtransport: gammel profil er bredere.
- GROFT → H8 Grøfting og grøfterensk: tilsvarende omfang.
- VEG → H9 Skogsbilveg og terrengtransport: gammel profil er bredere.

H2, H5, H6 og H12 har ingen egen `ForestAction` i dagens hovedflyt. De er beholdt som detaljerte artsregelprofiler, men brukeren kan ikke velge dem som hovedtiltak i v8.2.
