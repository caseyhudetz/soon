import { json } from "../../shared/http.js";

/**
 * GET /api/health -> which halves of the pipeline are actually wired up.
 * The About screen reads this so a missing key shows up as a plain sentence
 * instead of a failed snap.
 */
export async function onRequestGet({ env }) {
  return json({
    ok: true,
    analyze: Boolean(env.ANTHROPIC_API_KEY),
    render: Boolean(env.FAL_KEY),
  });
}
