import Anthropic from "@anthropic-ai/sdk";
import { analysisPrompt, IDEA_SCHEMA, PATTERNS } from "../../shared/catalog.js";
import { fail, json, readJson, validateImage } from "../../shared/http.js";

/**
 * POST /api/analyze  { image: <base64 jpeg> }  ->  { ok: true, idea }
 *
 * The browser sends a photo and nothing else. The prompt, the catalog and the
 * key all live here, so the client can neither steer the model nor see the key.
 */
export async function onRequestPost({ request, env }) {
  if (!env.ANTHROPIC_API_KEY) {
    return fail(503, "no_key", "The server has no Anthropic key configured.");
  }

  const body = await readJson(request);
  if (!body) return fail(400, "bad_body", "Send JSON.");

  const imageError = validateImage(body.image);
  if (imageError) return fail(400, "bad_image", imageError);

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  let response;
  try {
    response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      // Medium keeps the wait on a phone tolerable. Raise to "high" if the
      // pattern choices feel careless; drop to "low" if it feels slow.
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: IDEA_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: body.image } },
            { type: "text", text: analysisPrompt() },
          ],
        },
      ],
    });
  } catch (err) {
    const status = err?.status ?? 502;
    console.error("analyze failed", status, err?.message);
    if (status === 429) return fail(429, "rate_limited", "Too many ideas at once. Try again in a moment.");
    return fail(502, "upstream", "The model could not be reached.");
  }

  if (response.stop_reason === "refusal") {
    return fail(422, "refused", "The model declined to read this photo. Try a different spot.");
  }

  const idea = response.parsed_output;
  if (!idea) {
    return fail(502, "unparsed", "The idea came back malformed.");
  }

  // The schema constrains patternId to a real code, but an empty string is legal
  // for the null case — so only a "needed" result has to resolve to a pattern.
  if (idea.needed && !PATTERNS[idea.patternId]) {
    return fail(502, "unknown_pattern", "The idea came back without a usable pattern.");
  }

  return json({ ok: true, idea });
}
