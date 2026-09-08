import { publicCatalog } from "../../shared/catalog.js";
import { json } from "../../shared/http.js";

/**
 * GET /api/catalog -> { sites, patterns }
 *
 * The display half of the catalog: names, levers and the civic path for each
 * pattern. The prompt text and the site-fit rules stay on the server.
 */
export async function onRequestGet() {
  return json(publicCatalog(), 200, { "Cache-Control": "public, max-age=300" });
}
