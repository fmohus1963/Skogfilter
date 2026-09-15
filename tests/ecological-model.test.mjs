import assert from "node:assert/strict";
import test,{after} from "node:test";
import {createServer} from "vite";
const vite=await createServer({configFile:false,server:{middlewareMode:true}});
after(()=>vite.close());
const model=await vite.ssrLoadModule('/lib/ecological-model.ts');
const adapters=await vite.ssrLoadModule('/lib/registration-adapters.ts');
const engine=await vite.ssrLoadModule('/lib/skogfilter-engine.ts');
const actions=await vite.ssrLoadModule('/lib/action-taxonomy.ts');
const mapping=await vite.ssrLoadModule('/lib/forest-action-arts-mapping.ts');
const geometry=await vite.ssrLoadModule('/lib/polygon-path.ts');
test('same taxon has separate observations, unknown type and no inferred occurrence',()=>{
 const raw={TaxonId:42,ScientificName:'Test fungus',Longitude:10,Latitude:60};
 const a=adapters.artsObservation({...raw,Id:'a',CollectedDate:'2018-05-01'},0);
 const b=adapters.artsObservation({...raw,Id:'b',CollectedDate:'2024-05-01'},1);
 assert.equal(a.entity.id,b.entity.id);assert.notEqual(a.observation.id,b.observation.id);
 assert.equal(a.observation.observationType,'unknown');assert.equal(a.observation.coordinateUncertaintyMeters,undefined);
 assert.deepEqual(a.observation.observationGeometry,{type:'Point',coordinates:[10,60]});
 assert.equal(a.observation.interpretedOccurrenceGeometry,undefined);
 assert.equal(adapters.artsObservation({...raw,Longitude:''},0),null);
});
test('chronology includes unknown years without hiding older records',()=>{
 const records=[{mappingYear:2024},{mappingYear:2009},{},{registrationDate:'2018-06-01'}];
 assert.deepEqual(model.chronological(records).map(model.registrationYear),[2009,2018,2024,undefined]);
 assert.equal(records.filter(r=>model.inRegistrationYear(r,'all')).length,4);
 assert.equal(records.filter(r=>model.inRegistrationYear(r,'unknown')).length,1);
});
test('nature adapter preserves each source geometry and raw record',()=>{
 const first=engine.eikerDemoFeatures[0],second=engine.eikerDemoFeatures[1];
 const a=adapters.natureRegistration(first),b=adapters.natureRegistration(second);
 assert.notEqual(a.registration.id,b.registration.id);assert.equal(a.feature.geometry,first.geometry);
 assert.equal(a.registration.raw,first.properties);assert.equal(engine.relationshipBetween(first,second),'parallel');
});
test('action hierarchy keeps specific harvest methods and cross-cutting actions',()=>{
 assert.equal(actions.actionChildren('SLUTTAVVIRKNING').length,5);
 assert.equal(actions.actionDefinition('TERRENGTRANSPORT').parentId,undefined);
 assert.equal(actions.actionChildren('GROFT').length,2);
 assert.equal(mapping.artsRuleFor('SLUTTAVVIRKNING','FLATEHOGST').measure,'clearcut');
 assert.equal(mapping.artsRuleFor('SLUTTAVVIRKNING','SELEKTIV_HOGST').measure,'selective');
 for(const id of ['SLUTTAVVIRKNING','FROTRESTILLING','SKJERMSTILLING','PLUKKHOGST'])assert.equal(mapping.artsRuleFor('SLUTTAVVIRKNING',id).scope,'unavailable');
 const f=engine.eikerDemoFeatures[1];
 assert.equal(engine.filterFeatures([f],'SLUTTAVVIRKNING','SELEKTIV_HOGST')[0].actionId,'SELEKTIV_HOGST');
 assert.equal(engine.filterFeatures([f],'SLUTTAVVIRKNING','SELEKTIV_HOGST')[0].confidence,'insufficient_data');
});
test('same external ID from different datasets is counted independently',()=>{
 const f=engine.eikerDemoFeatures.slice(0,2).map(x=>({...x,featureId:'same-id'}));
 assert.equal(engine.summarizeResults(engine.filterFeatures(f,'MARKBEREDNING')).total,2);
});
test('polygon holes remain separate closed subpaths',()=>{
 const path=geometry.polygonPath([[[0,0],[10,0],[10,10],[0,0]],[[2,2],[3,2],[3,3],[2,2]]],(x,y)=>({x,y}));
 assert.equal((path.match(/M/g)||[]).length,2);assert.equal((path.match(/Z/g)||[]).length,2);
});
