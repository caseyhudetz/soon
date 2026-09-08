import { PATTERNS, renderPrompt } from "../../shared/catalog.js";
import { fail, json, readJson, validateImage } from "../../shared/http.js";

const FAL_ENDPOINT = "https://fal.run/fal-ai/flux-pro/kontext";
const MAX_PLACEMENT = 400;

/**
 * POST /api/render  { image, patternId, placement }  ->  { ok: true, url }
 *
 * The render prompt is built here from the pattern catalog. The client passes a
 * pattern code, not prose, so it cannot dictate what the image model draws.
 */
export async function onRequestPost({ request, env }) {
  if (!env.FAL_KEY) {
    return fail(503, "no_key", "The server has no fal key configured.");
  }

  const body = await readJson(request);
  if (!body) return fail(400, "bad_body", "Send JSON.");

  const imageError = validateImage(body.image);
  if (imageError) return fail(400, "bad_image", imageError);

  if (!PATTERNS[body.patternId]) return fail(400, "bad_pattern", "Unknown pattern.");

  const placement = typeof body.placement === "string" ? body.placement.slice(0, MAX_PLACEMENT) : "";

  let upstream;
  try {
    upstream = await fetch(FAL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${env.FAL_KEY}`,
      },
      body: JSON.stringify({
        prompt: renderPrompt(body.patternId, placement),
        image_url: `data:image/jpeg;base64,${body.image}`,
        guidance_scale: 3.5,
        num_images: 1,
        output_format: "jpeg",
        safety_tolerance: "2",
      }),
    });
  } catch (err) {
    console.error("render fetch failed", err?.message);
    return fail(502, "upstream", "The image model could not be reached.");
  }

  if (!upstream.ok) {
    console.error("render http", upstream.status, await upstream.text().catch(() => ""));
    if (upstream.status === 429) return fail(429, "rate_limited", "The image model is busy. Try again shortly.");
    return fail(502, "upstream", "The image model refused this edit.");
  }

  const data = await upstream.json().catch(() => null);
  const url = data?.images?.[0]?.url;
  if (!url) return fail(502, "no_image", "The image model returned nothing.");

  return json({ ok: true, url });
}
