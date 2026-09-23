# Naturtypekart: visning, sammenligning og DN13

## Implementert

- Glidebryter 0–100 % for tydelighet. Fargefyll, skravur eller bare omriss. Fargene følger de eksisterende resultatklassene. Svake omriss beholdes ved 0 %. Valgt registrering har et tydelig stiplet omriss uavhengig av tydeligheten.
- Klikk på et kartpunkt viser alle synlige naturregistreringer som inneholder punktet, med kort side om side. Hull i polygoner gir ikke treff; flerpolygoner støttes. Dette er sammenligning **på klikkstedet**, ikke en beregning av samlet overlappsareal. Kartdrag og klikk på artsmarkører skal ikke velge naturregistrering.
- Tastaturbrukere kan åpne detaljer fra den kronologiske registreringslisten. Dette viser alle år, slår på den valgte registreringen og viser også relevansfiltrerte figurer, slik at det valgte objektet faktisk blir synlig. Kortvalg fremhever originalgeometrien uten sammenslåing.
- Kilde, dato, metode, klassifikasjon, kvalitet/verdi, nøyaktighet og originalt faktaark vises. Metadata som ikke er levert, merkes «Ikke oppgitt».
- Årsfilter, av/på per registrering og relevansfilter styrer både kart og sammenligning. Tydelighet og visningsstil endrer bare tegning, ikke faglig vurdering eller antall.

## DN13

Tjeneste: https://kart.miljodirektoratet.no/arcgis/rest/services/naturtyper_hb13/MapServer/0

NLOD oppgis i tjenestens `info/iteminfo`. Felt og kodelister kontrolleres mot tjenestens metadata. Kodelister hentes med én times mellomlagring; ved feil beholdes originalkodene med et synlig varsel. Forespørsler bruker valgt geografisk polygon, WGS84 ut, stabil OBJECTID-sortering og sider på 500 objekter. Uttrekk er begrenset til 2000 registreringer med varsel. Ugyldige poster telles og varsles. En feil fra DN13 hindrer ikke de andre kildene.

DN13 behandles som selvstendige registreringer og blå faglig informasjon. Ingen ny juridisk konklusjon eller udokumentert påvirkningsregel innføres. A/B/C er DN13-verdi, ikke NiN-lokalitetskvalitet. Registreringsdato beholdes som levert; den er ikke nødvendigvis en feltkartleggingsdato. Datasettet er et nåværende uttrekk, ikke et komplett historisk arkiv. Utvalgt-status i DN13 brukes ikke til å lage en ekstra lovbasert regel; det eksisterende separate laget for utvalgte naturtyper beholdes.

## Kontroll og avgrensning

Et levende DN13-uttrekk fra Øvre Eiker ble kontrollert 23. september 2026, blant annet BN00047348 med naturtypekode F16, verdi B og registreringsdato i 2015. Testene dekker datakonvertering, manglende datoer, paginering, utilgjengelige kodelister og geografiske treff med polygonhull.

Nye NHM/UiO- og MiS-kilder, arealberegning av overlapp, faglig rangering og komplette tiltaksregler for DN13 inngår ikke. Visningsvalg gjelder økten og lagres ikke permanent.

Dette dokumentet oppdaterer v9-dokumentasjonens beskrivelse av DN13 som ikke tilkoblet. Publisering må bekreftes separat; lokal implementasjon er ikke bevis på at produksjon er oppdatert.
