# Skogfilter: utvidbar grunnmodell

## Endret i denne runden

- `ecological-model.ts` skiller EcologicalEntity, Registration, Observation, RegisteredFeature, Claim, KnowledgeSource, EcologicalRelation, ImpactAssessment, ManagementConsequence og OccurrenceInterpretation. Referanser har type og ID; kilder og påstander kan eksistere parallelt uten konsensusfelt.
- DatasetDefinition er utvidet med valgfri versjon, periode, publisering, oppdatering, geografisk dekning og kvalitet. Gamle navn og kildeoppsett beholdes.
- `registration-adapters.ts` lager tapsfrie kjerneobjekter i tillegg til tidligere API-resultater. Rå kildefelt beholdes. Naturtypeidentiteter er kildeavgrenset, og ulike klassifikasjoner likestilles ikke automatisk.
- `relationshipBetween` returnerer parallelle registreringer. Årstall, metode og organisasjon etablerer ikke automatisk erstatning, faglig prioritet eller motstrid.
- Tiltakstaksonomien har foreldrerelasjoner og fem egne hogstformer. Terrengtransport, grøfter og veg er uavhengige av hogstform. Grøfting og grøfterensk har egne ID-er under den bakoverkompatible gruppen GROFT.
- FilterResult beholder hovedtiltak og får konkret actionId. Artsreglene H1 og H2 brukes bare ved eksplisitt flatehogst eller selektiv hogst. Uspesifisert hogst og øvrige hogstformer får SU; naturtypevurderingen viser manglende eget regelgrunnlag. Lovbaserte særregler beholdes.
- Artskart slås ikke lenger sammen per takson. Art, observasjon og punktgeometri returneres separat; manglende observasjonstype er unknown. Manglende presisjon er ukjent, ikke null meter. Ingen buffer eller tolket utbredelse konstrueres.
- Sammendrag og kart bruker datasett + ekstern ID for å unngå kollisjoner på tvers av kilder.

## Faktisk brukergrensesnitt

Eksisterende områdevalg, kartbakgrunner, eiendomsgrenser, artsfiltre, kildelenker og forskningsvarsler er beholdt. Nye kontroller gir valg av hogstform/undertiltak og naturregistreringer etter år (eldre/nyere, alle år og ukjent år), samt av/på per registrering. Resultattall følger dette utvalget; relevansfilteret gjelder fortsatt. Polygoner beholder hver sin geometri, også hull. Ingen overlappende figurer slås sammen. Artslisten viser registreringsår og teller observasjoner separat fra antall taksa.

## Migrering

Ingen database er tilkoblet for disse dataene; ingen SQL-migrering er nødvendig. Eksisterende `results` og feature-ID-er beholdes. Naturtype-API-ene legger til `registrations`, og artsresultatene legger til `entity`, `observation` og `registeredFeature`. API-feltene shownTaxa og uniqueTaxaInSample teller nå faktiske taksa; shownObservations teller viste observasjoner. Observasjoner uten ekstern ID har eksplisitt uttrekkslokal identitet og kan ikke brukes til sikker kobling mellom uttrekk.

## Forberedt, ikke implementert

Claims, evidensrelasjoner, kildekategorier, økologiske faktorer, substrat/vert, funksjonelle artsgrupper, tolkede forekomster og forvaltningskonsekvenser er typet, men har ingen ny redigeringsmodul eller varig lagring. Tidligere habitatbaserte artsregler og forskningsvarsler er kompatibilitetslogikk, ikke konvertert til kildebelagte Claims. En full forskningsmodul inngår ikke.

## Begrensninger

- Levende kilder er fortsatt Artskart og to Naturbase-lag. NHM/UiO, DN13 og MiS har ikke fått nye datatilkoblinger. Testdata vises ikke som ekte registreringer.
- Tidsvisningen sorterer registreringene i gjeldende uttrekk; den henter ikke eldre versjoner som kildetjenesten ikke tilbyr. Ukjent år beholdes eksplisitt.
- Artskart henter maksimalt de første 2000 postene fra år 2000 og viser opptil 600 gyldige observasjoner. Avgrensning oppgis i grensesnittet. Originale grenser for koordinatpresisjon beholdes.
- Kartleggingsår og registreringsdato kan bety forskjellige ting hos ulike kilder; rådata beholdes. Ukjent kartlegger, substrat og vert utledes ikke av habitattekst.
- Plukkhogst er foreløpig en separat taksonomipost, ikke en påstand om terminologisk avgrensning mot selektiv hogst. Frøtrestillingshogst, skjermstillingshogst og plukkhogst mangler egne artsregler.
- Ingen automatisk buffering, biologisk utbredelse, kilderangering eller sammenslåing av forskning er innført.

Dette dokumentet beskriver gjeldende arkitektur og erstatter eldre v8-beskrivelser av automatisk kildeprioritet, én observasjon per art og standard H1 for sluttavvirkning.
