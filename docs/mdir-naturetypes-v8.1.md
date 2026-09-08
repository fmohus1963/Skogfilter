# Naturtyper etter Miljødirektoratets instruks – v8.1

Status: `LIVE`. Datasett-ID: `mdir_naturetypes`. Leverandør: Miljødirektoratet. Lisens: Norsk lisens for offentlige data (NLOD) 2.0.

Tjeneste: `https://kart.miljodirektoratet.no/arcgis/rest/services/naturtyper_nin/MapServer/0` (`naturtyper_nin_alle`). Tjenestetype: ArcGIS REST Feature Layer, polygon, med server-side `esriSpatialRelIntersects` og GeoJSON-respons. Klienten sender bare valgt polygon; nasjonalt datasett lastes ikke ned.

Faktiske felt i tjenestelaget: `OBJECTID`, `Områdenavn`, `Kommuner`, `NiNID`, `Naturtype`, `Lokalitetskvalitet`, `Tilstand`, `Tilstandbeskrivelse`, `Naturmangfold`, `Naturmangfoldbeskrivelse`, `Hovedøkosystem`, `Mosaikk`, `Nøyaktighet`, `Usikkerhet`, `Usikkerhetsbeskrivelse`, `Kartleggingsdato`, `Kartleggingsår`, `Oppdragsgiver`, `Kartlegger`, `Oppdragstaker`, `Kartleggingsinstruks`, `Prosjektnavn`, `Naturtypekode`, `NiNKartleggingsenheter`, `NiNBeskrivelsesvariabler`, `Faktaark`, `UK_Truet`, `UK_NærTruet`, `UK_SpesieltDårligKartlagt`, `UK_SentralØkosystemFunksjon`, `UK_SeBekrivelseNaturtype`, `UK_IngenStatus`, `prosjektid`, `naturomradeid`, `SHAPE.STArea()` og `SHAPE.STLength()`.

Adapteren mapper `NiNID` til stabil `featureId` (med fallback til `naturomradeid`, GeoJSON-ID eller `OBJECTID`), `Naturtype` til `title`, dato/år, polygongeometri, faktaarklenke, metode og NiN 2.1. Kodede domener for kvalitet, tilstand, naturmangfold og nøyaktighet oversettes til lesbare verdier. Alle originale attributter beholdes i `properties`.

Reglene bruker bare `UK_Truet`, `UK_SentralØkosystemFunksjon`, `Lokalitetskvalitet` og `Naturmangfold`. Manglende nødvendige utvalgskriterier gir `insufficient_data`; kalktrinn, kantavstand og hydrologi antas ikke. Polygonets eksistens alene gir ikke gult eller rødt resultat.

Avgrenset kontroll 8. september 2026: en server-side intersects-spørring mot en Eiker-konvolutt (9.82–10.02° Ø, 59.66–59.74° N) returnerte 585 levende objekter. Antallet for en valgt eiendom eller tegnet flate vil normalt være lavere og avhenger av den eksakte geometrien og løpende oppdateringer hos dataeier.
