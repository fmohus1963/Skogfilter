import { NextResponse } from "next/server";

type Coordinate = [number, number];
type Geometry = {
  type?: "Polygon" | "MultiPolygon";
  coordinates?: Coordinate[][] | Coordinate[][][];
};
type KartverketFeature = {
  geometry?: Geometry;
  properties?: Record<string, unknown>;
};

function validNumber(value: unknown, allowZero = false) {
  const text = String(value ?? "").trim();
  if (!/^\d+$/.test(text)) return false;
  return allowZero ? Number(text) >= 0 : Number(text) > 0;
}

function outerRings(geometry?: Geometry) {
  if (!geometry?.coordinates) return [];
  if (geometry.type === "Polygon") {
    const polygon = geometry.coordinates as Coordinate[][];
    return polygon[0] ? [polygon[0]] : [];
  }
  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates as Coordinate[][][]).map(polygon => polygon[0]).filter(Boolean);
  }
  return [];
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { municipality?: string; gnr?: string; bnr?: string; fnr?: string; snr?: string };
    const municipality = String(body.municipality ?? "").trim();
    const gnr = String(body.gnr ?? "").trim();
    const bnr = String(body.bnr ?? "").trim();
    const fnr = String(body.fnr ?? "").trim();
    const snr = String(body.snr ?? "").trim();
    if (!/^\d{4}$/.test(municipality) || !validNumber(gnr) || !validNumber(bnr) || (fnr && !validNumber(fnr, true)) || (snr && !validNumber(snr, true))) {
      return NextResponse.json({ error: "Oppgi gyldig kommunenummer, gårdsnummer og bruksnummer. Feste- og seksjonsnummer er valgfrie." }, { status: 400 });
    }
    const suffix = snr ? `/${fnr || "0"}/${snr}` : fnr ? `/${fnr}` : "";
    const matrikkelnummer = `${municipality}-${Number(gnr)}/${Number(bnr)}${suffix}`;
    const params = new URLSearchParams({ matrikkelnummer, omrade: "true", utkoordsys: "4258" });
    const response = await fetch(`https://ws.geonorge.no/eiendom/v1/geokoding?${params}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`Kartverket svarte ${response.status}`);
    const payload = await response.json() as { features?: KartverketFeature[] };
    const features = (payload.features ?? []).flatMap((feature, featureIndex) => {
      const properties = feature.properties ?? {};
      return outerRings(feature.geometry).map((ring, ringIndex) => ({
        id: `${String(properties.lokalid ?? featureIndex)}-${ringIndex}`,
        points: ring.map(([lon, lat]) => ({ lon, lat })).filter(point => Number.isFinite(point.lon) && Number.isFinite(point.lat)),
        main: Boolean(properties.hovedområde),
        label: String(properties.matrikkelnummertekst ?? `${Number(gnr)}/${Number(bnr)}`),
        objectType: String(properties.objekttype ?? "Teig"),
        accuracy: String(properties.nøyaktighetsklasseteig ?? "Ikke oppgitt"),
        updated: String(properties.oppdateringsdato ?? ""),
        sharedBoundary: Boolean(properties.teigmedflerematrikkelenheter),
      }));
    }).filter(feature => feature.points.length >= 3)
      .sort((a, b) => Number(b.main) - Number(a.main));
    if (!features.length) return NextResponse.json({ error: `Fant ingen kartfestet eiendom for ${matrikkelnummer}.` }, { status: 404 });
    return NextResponse.json({ matrikkelnummer, features, source: "Kartverkets åpne API for eiendomsdata" });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    const message = timedOut ? "Kartverket brukte mer enn 20 sekunder på å svare." : error instanceof Error ? error.message : "Ukjent feil";
    return NextResponse.json({ error: `Kunne ikke hente eiendommen: ${message}` }, { status: timedOut ? 504 : 502 });
  }
}
