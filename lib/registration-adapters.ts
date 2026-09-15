import type { NormalizedFeature } from "./skogfilter-engine";
import { recordKey, type EcologicalEntity, type Observation, type Registration, type RegisteredFeature } from "./ecological-model";
/** Lossless compatibility projection: the old feature remains available to old filters. */
export function natureRegistration(feature: NormalizedFeature) {
  const id = recordKey(feature.datasetId,feature.featureId);
  const code = feature.properties.natureTypeCode;
  const entityId = recordKey(feature.datasetId, String(code ?? feature.featureId));
  const entity: EcologicalEntity = {id:entityId,kind:feature.mappingRole==="forestry_environment"?"misHabitat":"natureType",name:feature.title,
    classification: code ? {system:feature.method??"unknown",version:feature.ninVersion,code:String(code)}:undefined};
  const registration: Registration = {id,datasetId:feature.datasetId,externalId:feature.featureId,entityIds:[entityId],featureIds:[id],sourceUrl:feature.sourceUrl,recordedAt:feature.registrationDate,mappingYear:feature.mappingYear,method:feature.method,classification:feature.ninVersion,raw:feature.properties};
  const registeredFeature: RegisteredFeature = {id,datasetId:feature.datasetId,registrationId:id,geometry:feature.geometry,geometryMeaning:"registeredGeometry"};
  return {entity,registration,feature:registeredFeature};
}
export function artsObservation(raw: Record<string,unknown>, index: number): {entity: EcologicalEntity; observation: Observation; feature: RegisteredFeature} | null {
  const coordinate = (value:unknown) => value===null||value===undefined||String(value).trim()==="" ? NaN : Number(String(value).replace(",","."));
  const lon=coordinate(raw.Longitude),lat=coordinate(raw.Latitude);
  if(!Number.isFinite(lon)||!Number.isFinite(lat)||Math.abs(lon)>180||Math.abs(lat)>90)return null;
  const externalId=raw.Id ?? raw.ObservationId;
  // Missing upstream IDs receive an explicitly sample-local identity; never deduplicate by taxon.
  const id=recordKey("artskart",externalId==null?`sample-${index}`:String(externalId));
  const entityId=recordKey("artskart-taxon",String(raw.ScientificNameId??raw.TaxonId??raw.ScientificName??`unknown-${index}`));
  const entity: EcologicalEntity={id:entityId,kind:"species",name:String(raw.Name??raw.ScientificName??"Ubestemt takson"),scientificName:typeof raw.ScientificName==="string"?raw.ScientificName:undefined};
  const geometry={type:"Point",coordinates:[lon,lat]};
  const precision=coordinate(raw.Precision);
  const observation: Observation={id,datasetId:"artskart",externalId:externalId==null?undefined:String(externalId),entityIds:[entityId],featureIds:[id],recordedAt:typeof raw.CollectedDate==="string"?raw.CollectedDate:undefined,sourceUrl:typeof raw.ObsUrl==="string"?raw.ObsUrl:undefined,observationType:"unknown",observationGeometry:geometry,coordinateUncertaintyMeters:Number.isFinite(precision)&&precision>=0?precision:undefined,raw};
  return {entity,observation,feature:{id,datasetId:"artskart",registrationId:id,geometry,geometryMeaning:"registeredGeometry"}};
}
