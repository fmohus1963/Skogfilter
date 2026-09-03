import { NextResponse } from "next/server";

type ResearchRequest = {
  name?: string;
  latin?: string;
  habitat?: string;
  dependency?: string;
  measure?: string;
};

type LiteratureItem = {
  id: string;
  source: "NVA" | "OpenAlex";
  title: string;
  year: number | null;
  authors: string[];
  venue: string;
  url: string;
  citedBy?: number;
  openAccess?: boolean;
};

function clean(value: unknown, max = 240) {
  return String(value ?? "").replace(/[<>\r\n]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function searchProfile(body: ResearchRequest) {
  const text = `${clean(body.name)} ${clean(body.latin)} ${clean(body.habitat)} ${clean(body.dependency)} ${clean(body.measure)}`.toLowerCase();
  const taxon = /lav\b|lichen|alectoria|ramboldia|usnea|lobaria/.test(text) ? "lichens" : /mose|bryophy/.test(text) ? "bryophytes" : /sopp|kjuke|fung|fomitopsis|phellinus|phlebia|skeletocutis|steccherinum/.test(text) ? "fungi" : /plante|orkid|cephalanthera|pinguicula|taxus/.test(text) ? "vascular plants" : /fugl|spett|picoides|cinclus|vanellus/.test(text) ? "forest birds" : "forest species";
  if (/død|læger|låg\b|gadd|stubbe|kelo|vedbo|vindfall/.test(text)) return { key: "dead-wood", query: `dead wood forest biodiversity ${taxon}`, label: `død ved, skogbruk og ${taxon}` };
  if (/myr|sump|bekk|elv|vann|hydrolog|fukt/.test(text)) return { key: "hydrology", query: `forest hydrology riparian buffer biodiversity ${taxon}`, label: `skoghydrologi, kantsoner og ${taxon}` };
  if (/gammel|eldre|kontinuitet|skogklima|selektiv|tynning/.test(text)) return { key: "microclimate", query: `forest management microclimate continuity ${taxon}`, label: `skogbehandling, mikroklima og ${taxon}` };
  return { key: "forest-management", query: `forest management biodiversity ${taxon}`, label: `skogbehandling og ${taxon}` };
}

function nvaItem(hit: Record<string, unknown>): LiteratureItem | null {
  const entity = (hit.entityDescription ?? {}) as Record<string, unknown>;
  const reference = (entity.reference ?? {}) as Record<string, unknown>;
  const context = (reference.publicationContext ?? {}) as Record<string, unknown>;
  const publisher = (context.publisher ?? {}) as Record<string, unknown>;
  const date = (entity.publicationDate ?? {}) as Record<string, unknown>;
  const contributors = Array.isArray(entity.contributors) ? entity.contributors as Record<string, unknown>[] : [];
  const title = clean(entity.mainTitle, 400);
  const identifier = clean(hit.identifier);
  if (!title || !identifier) return null;
  return {
    id: `nva-${identifier}`,
    source: "NVA",
    title,
    year: Number(date.year) || null,
    authors: contributors.map(person => clean(((person.identity ?? {}) as Record<string, unknown>).name)).filter(Boolean).slice(0, 4),
    venue: clean(context.name || publisher.name || context.type || "Nasjonalt vitenarkiv"),
    url: `https://nva.sikt.no/registration/${encodeURIComponent(identifier)}`,
  };
}

function openAlexItem(work: Record<string, unknown>): LiteratureItem | null {
  const title = clean(work.display_name, 400);
  const id = clean(work.id);
  if (!title || !id || work.is_retracted === true) return null;
  const location = (work.primary_location ?? {}) as Record<string, unknown>;
  const source = (location.source ?? {}) as Record<string, unknown>;
  const authorships = Array.isArray(work.authorships) ? work.authorships as Record<string, unknown>[] : [];
  return {
    id: `oa-${id.split("/").pop()}`,
    source: "OpenAlex",
    title,
    year: Number(work.publication_year) || null,
    authors: authorships.map(entry => clean(((entry.author ?? {}) as Record<string, unknown>).display_name)).filter(Boolean).slice(0, 4),
    venue: clean(source.display_name || "OpenAlex"),
    url: clean(work.doi || location.landing_page_url || id),
    citedBy: Number(work.cited_by_count) || 0,
    openAccess: location.is_oa === true,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as ResearchRequest;
    const profile = searchProfile(body);
    const nvaParams = new URLSearchParams({ query: profile.query, size: "6", sort: "publicationDate:desc" });
    const openAlexParams = new URLSearchParams({
      search: profile.query,
      "per-page": "6",
      filter: "from_publication_date:2018-01-01",
      sort: "publication_date:desc",
      select: "id,display_name,publication_year,doi,primary_location,authorships,cited_by_count,is_retracted",
    });
    const headers = { Accept: "application/json", "User-Agent": "Skogfilter-pilot/1.0 (https://skogfilter-pilot.fmohus.chatgpt.site)" };
    const [nvaResult, openAlexResult] = await Promise.allSettled([
      fetch(`https://api.nva.unit.no/search/resources?${nvaParams}`, { headers, signal: AbortSignal.timeout(18000) }),
      fetch(`https://api.openalex.org/works?${openAlexParams}`, { headers, signal: AbortSignal.timeout(18000) }),
    ]);
    const results: LiteratureItem[] = [];
    const unavailable: string[] = [];
    if (nvaResult.status === "fulfilled" && nvaResult.value.ok) {
      const payload = await nvaResult.value.json() as { hits?: Record<string, unknown>[] };
      results.push(...(payload.hits ?? []).map(nvaItem).filter((item): item is LiteratureItem => Boolean(item)));
    } else unavailable.push("NVA");
    if (openAlexResult.status === "fulfilled" && openAlexResult.value.ok) {
      const payload = await openAlexResult.value.json() as { results?: Record<string, unknown>[] };
      results.push(...(payload.results ?? []).map(openAlexItem).filter((item): item is LiteratureItem => Boolean(item)));
    } else unavailable.push("OpenAlex");
    if (!results.length && unavailable.length === 2) return NextResponse.json({ error: "Begge litteraturtjenestene er midlertidig utilgjengelige." }, { status: 502 });
    return NextResponse.json({
      profile: profile.key,
      query: profile.query,
      label: profile.label,
      checkedAt: new Date().toISOString(),
      results,
      unavailable,
      note: "Søket finner kandidater. Treffene er ikke faglig kvalitetssikret og endrer ikke S-klassen eller evidensvurderingen.",
    });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json({ error: timedOut ? "Litteratursøket brukte for lang tid. Prøv igjen." : "Kunne ikke gjennomføre litteratursøket." }, { status: timedOut ? 504 : 500 });
  }
}
