import { fail, json } from "../../shared/http.js";

/**
 * GET /api/crashes?lat&lng[&r=200][&years=5]  ->  { ok, center, radius, since, truncated, crashes }
 *
 * Reported crashes around a point, from the Chicago Police Department's
 * Traffic Crashes dataset on the City of Chicago Data Portal. The rows are
 * trimmed to what the lens draws so a phone on a weak signal gets a small body.
 */

const DATASET = "https://data.cityofchicago.org/resource/85ca-t3if.json";
const CHICAGO = { s: 41.64, n: 42.03, w: -87.95, e: -87.52 };
const MAX_ROWS = 2000;
const SELECT = [
  "crash_record_id", "crash_date", "latitude", "longitude",
  "first_crash_type", "most_severe_injury", "injuries_total", "injuries_fatal", "injuries_incapacitating",
  "prim_contributory_cause", "lighting_condition", "street_no", "street_direction", "street_name",
].join(",");

// Causes the dataset uses to mean "no cause recorded".
const NO_CAUSE = new Set(["UNABLE TO DETERMINE", "NOT APPLICABLE"]);

export async function onRequestGet({ request, env, waitUntil }) {
  const q = new URL(request.url).searchParams;
  // Rounding to ~10 m keeps the cache useful without blurring anything the lens can show.
  const lat = round(Number(q.get("lat")), 4);
  const lng = round(Number(q.get("lng")), 4);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !q.get("lat") || !q.get("lng")) {
    return fail(400, "bad_point", "Send lat and lng.");
  }
  if (lat < CHICAGO.s || lat > CHICAGO.n || lng < CHICAGO.w || lng > CHICAGO.e) {
    return fail(422, "outside", "Crash records cover the City of Chicago only.");
  }
  const radius = clamp(Math.round(Number(q.get("r")) || 200), 25, 400);
  const years = clamp(Math.round(Number(q.get("years")) || 5), 1, 10);

  const cacheKey = new Request(`https://soon.cache/crashes?lat=${lat}&lng=${lng}&r=${radius}&y=${years}`);
  const cache = globalThis.caches?.default;
  const hit = await cache?.match(cacheKey).catch(() => null);
  if (hit) return hit;

  const since = new Date();
  since.setUTCFullYear(since.getUTCFullYear() - years, 0, 1);
  const sinceDay = since.toISOString().slice(0, 10);

  const params = new URLSearchParams({
    $select: SELECT,
    $where: `within_circle(location, ${lat}, ${lng}, ${radius}) AND crash_date >= '${sinceDay}T00:00:00'`,
    $order: "crash_date DESC",
    $limit: String(MAX_ROWS),
  });
  const headers = { Accept: "application/json" };
  if (env.SOCRATA_APP_TOKEN) headers["X-App-Token"] = env.SOCRATA_APP_TOKEN;

  let upstream;
  try {
    upstream = await fetch(`${DATASET}?${params}`, { headers });
  } catch (err) {
    console.error("crashes fetch failed", err?.message);
    return fail(502, "upstream", "The city data portal could not be reached.");
  }
  if (!upstream.ok) {
    console.error("crashes http", upstream.status, await upstream.text().catch(() => ""));
    if (upstream.status === 429) return fail(429, "rate_limited", "The city data portal is busy. Try again shortly.");
    return fail(502, "upstream", "The city data portal returned an error.");
  }

  const rows = await upstream.json().catch(() => null);
  if (!Array.isArray(rows)) return fail(502, "unparsed", "The crash records came back malformed.");

  const res = json(
    {
      ok: true,
      center: { lat, lng },
      radius,
      since: sinceDay,
      truncated: rows.length === MAX_ROWS,
      crashes: rows.map(normalize).filter(Boolean),
    },
    200,
    { "Cache-Control": "public, max-age=3600" }
  );
  if (cache) waitUntil(cache.put(cacheKey, res.clone()).catch(() => {}));
  return res;
}

function normalize(row) {
  const lat = Number(row.latitude), lng = Number(row.longitude);
  // Unlocated crashes come through as 0,0 or blank.
  if (!lat || !lng || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const type = row.first_crash_type;
  const worst = row.most_severe_injury || "";
  const hurt = Number(row.injuries_total) || 0;
  const sev =
    worst === "FATAL" || Number(row.injuries_fatal) > 0 ? "fatal"
    : worst.startsWith("INCAPACITATING") || Number(row.injuries_incapacitating) > 0 ? "serious"
    : hurt > 0 || worst.startsWith("NONINCAPACITATING") || worst.startsWith("REPORTED") ? "hurt"
    : "none";

  return {
    id: row.crash_record_id,
    t: (row.crash_date || "").slice(0, 10),
    lat: round(lat, 6),
    lng: round(lng, 6),
    kind: type === "PEDESTRIAN" ? "ped" : type === "PEDALCYCLIST" ? "bike" : "car",
    sev,
    hurt,
    cause: NO_CAUSE.has(row.prim_contributory_cause) ? null : tidy(row.prim_contributory_cause),
    light: tidy(row.lighting_condition),
    at: address(row),
  };
}

/** "3100 N CLARK ST" -> "3100 N Clark St". The dataset rounds addresses to the block. */
function address(row) {
  const parts = [row.street_no, row.street_direction, row.street_name].filter(Boolean).join(" ");
  return parts ? parts.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()) : null;
}

function tidy(s) {
  if (!s || s === "UNKNOWN") return null;
  const t = s.toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const round = (n, d) => Math.round(n * 10 ** d) / 10 ** d;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
