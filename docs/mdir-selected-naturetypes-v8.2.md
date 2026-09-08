# Naturtyper – utvalgte, v8.2

Status `LIVE`; datasett-ID `mdir_selected_naturetypes`; leverandør Miljødirektoratet; ArcGIS FeatureServer; NLOD; `mappingRole=legal_status`; `authorityEffect=legal_status`.

Tjenesten er `https://kart.miljodirektoratet.no/arcgis/rest/services/naturtyper_utvalgte2/FeatureServer/0`, lag `naturtype_utvalgt_omr`. Klienten sender valgt eiendoms- eller tegnepolygon til et isolert serverendepunkt. Endepunktet bruker `esriSpatialRelIntersects`, GeoJSON og paginering med 1000 objekter per side.

Verifiserte felt 8. september 2026: `UtvalgtNaturtypeId`, `UtvalgtNaturtypeKode`, `UtvalgtNaturtype`, `Opphav`, `Områdenavn`, `Registreringsdato`, `Nøyaktighetsklasse`, `Verdi`, `Lokalitetskvalitet`, `Tilstand`, `Naturmangfold`, `Faktaark`, `FaktaarkOpphav`, `Kommune`, `GlobalId`, `crc` og `OBJECTID`.

Adapteren bruker `UtvalgtNaturtypeId` som stabil ID, med fallback til `GlobalId`, GeoJSON-ID eller `OBJECTID`. Navn, kode, dato, geometri, opphav og faktaark mappes til `NormalizedFeature`; alle råattributter beholdes i `properties`.

Det finnes ikke en universell felles ID mellom dette laget og `naturtyper_nin_alle`. Sikker kobling gjøres bare når `FaktaarkOpphav` faktisk inneholder samme kilde-ID som ordinærpostens `NiNID`. Romlig overlapp alene gir ikke sammenslåing og behandles parallelt.

Berørt utvalgt naturtype gir `special_rule`, `basisType=law`. For `VEG` brukes `permit_assessment` med § 53. Øvrige ForestActions bruker `notification_required` som betinget prosedyre: teksten sier at § 54 kan gi meldeplikt dersom tiltaket ikke krever annen tillatelse. Ingen regel konkluderer generisk med at tiltaket er forbudt.

Eiker-testkonvolutten 9.82–10.02° Ø / 59.66–59.74° N returnerte 29 forekomster: Hule eiker 10, Kalklindeskog 6, Slåttemark 3, Slåttemyr 8 og Åpen grunnlendt kalkmark i boreonemoral sone 2.
