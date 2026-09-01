import { NextResponse } from "next/server";

type Point = { lon: number; lat: number };
type ClassKey = "S1" | "S2" | "S3" | "SU";

const forest = /skog|gran|furu|tre\b|trær|stamme|stubbe|læger|låg\b|gadd|død ved|bark|vedbo|hogstflat|picea|pinus|betula|populus|salix|fraxinus|quercus|tilia|ulmus|alnus/i;
const spruce = /gran\b|granskog|granlåg|granlæger|picea abies/i;
const deadWood = /død|læger|låg\b|gadd|stubbe|vindfall|ved\b|bark|grein|stamme/i;
const wet = /myr|sump|bekk|vann|tjern|innsjø|strand|elv|dam\b|våt|kilde/i;
const culture = /gård|tun\b|åker|eng\b|beite|plen|park|hage|veikant|traktorvei|jernbane|ruderat|kirkegård|tørrbakke/i;

function mercator({ lon, lat }: Point) {
  const r = 6378137;
  return { x: r * lon * Math.PI / 180, y: r * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) };
}

function classify(habitat: string) {
  const general: ClassKey = forest.test(habitat) ? "S1" : wet.test(habitat) ? "S2" : culture.test(habitat) ? "S3" : "SU";
  const deadSpruce: ClassKey = spruce.test(habitat) && deadWood.test(habitat) ? "S1" : spruce.test(habitat) || forest.test(habitat) ? "S2" : wet.test(habitat) || culture.test(habitat) ? "S3" : "SU";
  const dependency = general === "S1" ? "Skogstruktur eller treslag nevnt i observasjonen" : general === "S2" ? "Vannmiljø eller hydrologi" : general === "S3" ? "Annet registrert habitat" : "Ikke dokumentert i Artskart-posten";
  return { general, deadSpruce, dependency };
}

function explanation(key: ClassKey, measure: "general" | "deadSpruce") {
  if (key === "S1") return measure === "deadSpruce" ? "Artskart-posten nevner både gran og dødvedstruktur. Uttaket kan derfor berøre registrert livsmedium direkte." : "Artskart-posten dokumenterer skog-, tre- eller dødvedtilknytning som kan påvirkes av skogsdrift.";
  if (key === "S2") return measure === "deadSpruce" ? "Funnet har skogtilknytning, men det er ikke dokumentert at akkurat død gran er artens relevante livsmedium." : "Relevansen avhenger av tiltakets plassering, hydrologi eller hvordan bestandet berøres.";
  if (key === "S3") return "Registrert habitat tilsier normalt ingen direkte sammenheng med dette tiltaket.";
  return "Artskart-posten mangler tilstrekkelig habitatinformasjon. Manglende data betyr ikke at arten er irrelevant.";
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { points?: Point[] };
    const points = body.points?.filter(p => Number.isFinite(p.lon) && Number.isFinite(p.lat)).slice(0, 50) ?? [];
    if (points.length < 3) return NextResponse.json({ error: "Velg minst tre grensepunkter." }, { status: 400 });
    const ring = [...points, points[0]].map(mercator).map(p => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(",");
    const params = new URLSearchParams({ pageSize: "5000", pageIndex: "0", gmWktPolygon: `POLYGON((${ring}))`, fromDate: "2000-01-01" });
    for (const precision of ["0", "1", "2"]) params.append("precision", precision);
    const response = await fetch(`https://artskart.artsdatabanken.no/publicapi/api/Observations/list/?${params}`, { signal: AbortSignal.timeout(25000), headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Artskart svarte ${response.status}`);
    const payload = await response.json() as { Observations?: Record<string, unknown>[]; TotalCount?: number };
    const unique = new Map<string, Record<string, unknown>>();
    for (const obs of payload.Observations ?? []) {
      const key = String(obs.ScientificNameId ?? obs.TaxonId ?? obs.ScientificName ?? obs.Id);
      const existing = unique.get(key);
      const precision = Number(obs.Precision ?? 999999);
      if (!existing || precision < Number(existing.Precision ?? 999999)) unique.set(key, obs);
    }
    const rankStatus: Record<string, number> = { CR: 0, EN: 1, VU: 2, NT: 3, DD: 4, LC: 5 };
    const results = [...unique.values()].map((obs, index) => {
      const habitat = String(obs.Habitat ?? "").trim();
      const classes = classify(habitat);
      const date = String(obs.CollectedDate ?? "");
      const year = Number(date.match(/(?:18|19|20)\d{2}/)?.[0] ?? 0);
      const lon = Number(String(obs.Longitude ?? "").replace(",", "."));
      const lat = Number(String(obs.Latitude ?? "").replace(",", "."));
      return { id: index + 10000, name: String(obs.Name ?? obs.ScientificName ?? "Ubestemt takson"), latin: String(obs.ScientificName ?? ""), status: String(obs.Status ?? "–"), lat, lon, year, precision: Number(obs.Precision ?? 0), habitat: habitat || "Ikke oppgitt i Artskart-posten", ...classes, explanation: { general: explanation(classes.general, "general"), deadSpruce: explanation(classes.deadSpruce, "deadSpruce") }, obsUrl: String(obs.ObsUrl ?? "") };
    }).filter(item => Number.isFinite(item.lon) && Number.isFinite(item.lat))
      .sort((a, b) => (rankStatus[a.status] ?? 9) - (rankStatus[b.status] ?? 9) || a.name.localeCompare(b.name, "nb"))
      .slice(0, 600);
    return NextResponse.json({ results, totalObservations: payload.TotalCount ?? 0, sampledObservations: payload.Observations?.length ?? 0, uniqueTaxaInSample: unique.size, shownTaxa: results.length, truncated: (payload.TotalCount ?? 0) > (payload.Observations?.length ?? 0) || unique.size > results.length, fetchedAt: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukjent feil";
    return NextResponse.json({ error: `Kunne ikke hente Artskart-data: ${message}` }, { status: 502 });
  }
}
