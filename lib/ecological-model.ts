/** Independent records linked by namespaced IDs. Missing knowledge stays missing. */
export type Geometry = { type: string; coordinates: unknown };
export type ObservationType = "organism" | "fruitingBody" | "thallus" | "colony" | "substrateOccurrence" | "eDNA" | "spore" | "unknown";
export interface EcologicalEntity {
  id: string; kind: "species" | "natureType" | "misHabitat" | "substrate" | "host" | "process" | "forestEnvironment";
  name: string; scientificName?: string; classification?: { system: string; version?: string; code: string };
  taxonGroup?: string; functionalGroupIds?: string[];
}
export interface Registration {
  id: string; datasetId: string; entityIds: string[]; featureIds: string[];
  externalId?: string; sourceUrl?: string; recordedAt?: string; mappingYear?: number;
  observer?: string; method?: string; purpose?: string; classification?: string;
  quality?: string; uncertainty?: string; raw: Record<string, unknown>;
}
export interface Observation extends Registration {
  observationType: ObservationType; observationGeometry: Geometry;
  substrateEntityId?: string; hostEntityId?: string; coordinateUncertaintyMeters?: number;
}
export interface RegisteredFeature {
  id: string; datasetId: string; registrationId: string; geometry: Geometry;
  geometryMeaning: "registeredGeometry";
}
export interface KnowledgeSource {
  id: string; title: string; category: "official" | "peerReviewedNorwegian" | "peerReviewedInternational" | "institutionalReport" | "expertMapping" | "literature" | "historical";
  authors?: string[]; publishedAt?: string; url?: string; doi?: string; publisher?: string;
}
export type SubjectRef = { kind: "entity" | "registration" | "feature" | "action" | "claim"; id: string };
export interface Claim {
  id: string; subject: SubjectRef; topic: string; statement: string; sourceIds: string[];
  geographicRelevance?: string; environmentIds?: string[]; studyDesign?: string;
  evidenceStrength?: string; uncertainty?: string; timeHorizon?: string; measuredOutcome?: string;
}
export interface EcologicalRelation {
  id: string; from: SubjectRef; to: SubjectRef;
  predicate: "supports" | "refines" | "qualifies" | "contradicts" | "appliesTo" | "affectedBy" | "associatedWith" | "observedOn" | "dependsOn";
  claimIds: string[]; sourceIds: string[]; context?: string;
}
export interface ImpactAssessment {
  id: string; subject: SubjectRef; actionId: string; claimIds: string[]; sourceIds: string[];
  effect: string; uncertainty?: string; geographicRelevance?: string; timeHorizon?: string;
}
export interface ManagementConsequence {
  id: string; subject: SubjectRef; assessmentIds: string[]; sourceIds: string[];
  basis: "law" | "certification" | "professional"; statement: string;
}
/** Only explicitly authored interpretations may supply this geometry. No automatic buffer. */
export interface OccurrenceInterpretation {
  id: string; observationIds: string[]; interpretedOccurrenceGeometry: Geometry;
  claimIds: string[]; sourceIds: string[]; author: string; method: string; uncertainty: string;
}
export const recordKey = (datasetId: string, externalId: string) => `${encodeURIComponent(datasetId)}:${encodeURIComponent(externalId)}`;
export function registrationYear(record: { mappingYear?: number; registrationDate?: string; recordedAt?: string }): number | undefined {
  if (Number.isInteger(record.mappingYear) && record.mappingYear! > 0) return record.mappingYear;
  const date = record.registrationDate ?? record.recordedAt;
  return date && /^\d{4}-/.test(date) ? Number(date.slice(0, 4)) : undefined;
}
export function chronological<T extends { mappingYear?: number; registrationDate?: string; recordedAt?: string }>(records: T[]): T[] {
  return [...records].sort((a,b)=>(registrationYear(a)??Infinity)-(registrationYear(b)??Infinity));
}
export function inRegistrationYear(record: Parameters<typeof registrationYear>[0], year: "all" | "unknown" | number) {
  return year === "all" || (year === "unknown" ? registrationYear(record) === undefined : registrationYear(record) === year);
}
