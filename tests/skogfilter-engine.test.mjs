import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root=fileURLToPath(new URL("..",import.meta.url));
const vite=await createServer({appType:"custom",configFile:false,root,resolve:{alias:{"@":root}},server:{middlewareMode:true}});
after(async()=>vite.close());
const engine=await vite.ssrLoadModule("/lib/skogfilter-engine.ts");
const feature=(datasetId,mappingYear,method="same",properties={})=>({datasetId,featureId:`${datasetId}-${mappingYear}`,geometry:{type:"Polygon",coordinates:[]},title:datasetId,mappingYear,method,properties,mappingRole:"management_selection",authorityEffect:"assessment_trigger"});

test("nyere sammenlignbar Mdir-kartlegging erstatter eldre",()=>assert.equal(engine.relationshipBetween(feature("mdir_naturtyper",2024),feature("mdir_naturtyper",2019)),"supersedes"));
test("DN13 blir supplement til nyere Mdir-kartlegging",()=>assert.equal(engine.relationshipBetween(feature("dn13",2010,"DN13"),feature("mdir_naturtyper",2024,"Mdir")),"primary_with_supplement"));
test("MiS og Mdir behandles parallelt",()=>assert.equal(engine.relationshipBetween(feature("mis_valgt",2025,"MiS"),feature("mdir_naturtyper",2024,"Mdir")),"parallel"));
test("NHM/UiO beholdes og gis ikke lavere faglig detaljprioritet",()=>{const nhm=engine.eikerDemoFeatures.find(f=>f.datasetId==="nhm_nin"),mdir=engine.eikerDemoFeatures.find(f=>f.datasetId==="mdir_naturtyper");assert.ok(nhm);assert.ok(mdir);assert.equal(nhm.mappingRole,"reference_nin");assert.equal(nhm.authorityEffect,"descriptive");assert.match(engine.relationshipBetween(nhm,mdir),/^(refines|conflicts)$/);const grouped=engine.groupOverlaps([nhm,mdir],"SLUTTAVVIRKNING");assert.deepEqual(new Set(grouped.featureIds),new Set([nhm.featureId,mdir.featureId]));});
test("sluttavvirkning og markberedning gir ulike resultater",()=>{const harvest=engine.filterFeatures(engine.eikerDemoFeatures,"SLUTTAVVIRKNING");const scarification=engine.filterFeatures(engine.eikerDemoFeatures,"MARKBEREDNING");assert.notDeepEqual(harvest.map(r=>r.relevance),scarification.map(r=>r.relevance));});
test("NARIN er deaktivert mens lisensen må avklares",()=>{const narin=engine.datasets.find(d=>d.id==="narin");assert.equal(narin.enabled,false);assert.equal(narin.licenseStatus,"clarification_required");assert.equal(narin.connectionStatus,"blocked");});
test("sluttavvirkning finnes bare i skogbrukssyklusen",()=>{assert.equal(engine.actionMeta.SLUTTAVVIRKNING.phase,"cycle");assert.ok(!Object.entries(engine.actionMeta).filter(([,meta])=>meta.phase==="other").some(([id])=>id==="SLUTTAVVIRKNING"));});
