import type {NormalizedFeature} from "./skogfilter-engine";
import type {GeoJsonFeature} from "./mdir-nature-type-adapter";
export const DN13_SERVICE="https://kart.miljodirektoratet.no/arcgis/rest/services/naturtyper_hb13/MapServer/0";
export type Dn13Domains=Record<string,Record<string,string>>;
export function dn13Domains(metadata:{fields?:{name:string;domain?:{codedValues?:{code:string|number;name:string}[]}|null}[]}):Dn13Domains{
  return Object.fromEntries((metadata.fields??[]).map(f=>[f.name,Object.fromEntries((f.domain?.codedValues??[]).map(v=>[String(v.code),v.name]))]));
}
export function normalizeDn13(raw:GeoJsonFeature,domains:Dn13Domains={}):NormalizedFeature{
  const p=raw.properties??{},id=p.naturtypeId??raw.id??p.OBJECTID;
  if(id==null||String(id).trim()===""||!raw.geometry||!["Polygon","MultiPolygon"].includes(raw.geometry.type))throw new Error("DN13 mangler stabil ID eller polygongeometri");
  const stamp=p.registreringsDato,date=typeof stamp==="number"&&Number.isFinite(stamp)&&Number.isFinite(new Date(stamp).getTime())?new Date(stamp).toISOString().slice(0,10):undefined;
  const code=String(p.naturtype??""),name=domains.naturtype?.[code];
  return {datasetId:"dn13",featureId:`dn13-${id}`,title:String(p.omraadenavn||name||code||"DN13-registrering"),geometry:raw.geometry,registrationDate:date,mappingYear:date?Number(date.slice(0,4)):undefined,method:"DN-håndbok 13",mappingRole:"management_selection",authorityEffect:"descriptive",sourceUrl:typeof p.faktaark==="string"&&/^https?:\/\//i.test(p.faktaark)?p.faktaark:`https://faktaark.naturbase.no/?id=${encodeURIComponent(String(id))}`,properties:{...p,natureTypeCode:code,natureTypeName:name,valueLabel:domains.verdi?.[String(p.verdi)]??({A:"Svært viktig",B:"Viktig",C:"Lokalt viktig"} as Record<string,string>)[String(p.verdi)],accuracy:domains.noeyaktighetsklasse?.[String(p.noeyaktighetsklasse)],geometryRelation:"overlap"}};
}
