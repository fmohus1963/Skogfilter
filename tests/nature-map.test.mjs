import assert from 'node:assert/strict';
import test,{after} from 'node:test';
import {createServer} from 'vite';
const vite=await createServer({configFile:false,resolve:{alias:{'@':process.cwd()}},server:{middlewareMode:true,hmr:false}});
after(()=>vite.close());
const {containsNaturePoint}=await vite.ssrLoadModule('/lib/nature-map.ts');
const {normalizeDn13,dn13Domains}=await vite.ssrLoadModule('/lib/dn13-adapter.ts');
const {POST}=await vite.ssrLoadModule('/app/api/dn13/route.ts');
const shell=[[0,0],[10,0],[10,10],[0,10],[0,0]],hole=[[2,2],[4,2],[4,4],[2,4],[2,2]];
const raw={type:'Feature',geometry:{type:'Polygon',coordinates:[shell,hole]},properties:{naturtypeId:'BN-test',omraadenavn:'Testområde',naturtype:'F16',verdi:'B',registreringsDato:1444608000000,noeyaktighetsklasse:4,faktaark:'https://faktaark.naturbase.no?id=BN-test'}};
test('map selection respects holes, boundaries and multipart geometries',()=>{
 assert.equal(containsNaturePoint(raw.geometry,[1,1]),true);
 assert.equal(containsNaturePoint(raw.geometry,[3,3]),false);
 assert.equal(containsNaturePoint(raw.geometry,[10,5]),true);
 assert.equal(containsNaturePoint(raw.geometry,[12,5]),false);
 assert.equal(containsNaturePoint({type:'MultiPolygon',coordinates:[[[[20,20],[21,20],[21,21],[20,20]]],raw.geometry.coordinates]},[1,1]),true);
 assert.equal(containsNaturePoint({type:'Point',coordinates:[1,1]},[1,1]),false);
});
test('DN13 dates, value and source remain independent of NiN quality',()=>{
 const domains=dn13Domains({fields:[{name:'naturtype',domain:{codedValues:[{code:'F16',name:'Testtype'}]}}]});
 const f=normalizeDn13(raw,domains);assert.equal(f.datasetId,'dn13');assert.equal(f.mappingYear,2015);
 assert.equal(f.properties.natureTypeName,'Testtype');assert.equal(f.properties.valueLabel,'Viktig');assert.equal(f.properties.localityQuality,undefined);
 assert.equal(f.geometry,raw.geometry);assert.equal(f.properties.naturtypeId,'BN-test');
 assert.equal(normalizeDn13({...raw,properties:{...raw.properties,registreringsDato:null}}).mappingYear,undefined);
 assert.equal(normalizeDn13({...raw,properties:{...raw.properties,registreringsDato:Infinity}}).mappingYear,undefined);
 assert.throws(()=>normalizeDn13({...raw,geometry:null}));
});
test('DN13 rejects invalid bounds without requesting a source',async()=>{
 const response=await POST(new Request('http://localhost/api/dn13',{method:'POST',body:JSON.stringify({points:[{lon:400,lat:60},{lon:10,lat:60},{lon:10,lat:61}]})}));assert.equal(response.status,400);
});
test('DN13 pages and preserves separate records; labels may be unavailable',async()=>{
 const original=globalThis.fetch;let pages=0;
 globalThis.fetch=async(url,options)=>{
   if(String(url).endsWith('?f=json'))return new Response('{}',{status:503});
   const params=new URLSearchParams(options.body);assert.equal(params.get('outSR'),'4326');assert.equal(params.get('spatialRel'),'esriSpatialRelIntersects');
   pages++;return Response.json({features:[{...raw,properties:{...raw.properties,naturtypeId:`BN-${pages}`}}],exceededTransferLimit:pages===1});
 };
 try{const r=await POST(new Request('http://localhost/api/dn13',{method:'POST',body:JSON.stringify({points:[{lon:9,lat:59},{lon:10,lat:59},{lon:10,lat:60}]})}));const p=await r.json();assert.equal(r.status,200);assert.equal(p.results.length,2);assert.equal(p.registrations.length,2);assert.equal(p.codeLabelsAvailable,false);assert.equal(p.truncated,false);assert.equal(pages,2)}finally{globalThis.fetch=original}
});
