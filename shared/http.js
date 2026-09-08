/** Small helpers shared by the API routes. */

export const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

export function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...headers } });
}

export function fail(status, code, message) {
  return json({ ok: false, code, message }, status);
}

/** The client sends a bare base64 JPEG. Nothing else about the request is trusted. */
const MAX_IMAGE_B64 = 3_000_000; // ~2.2MB decoded; the app caps its long edge at 1024px
const B64 = /^[A-Za-z0-9+/]+={0,2}$/;

export function validateImage(image) {
  if (typeof image !== "string" || !image) return "Send the photo as a base64 string.";
  if (image.length > MAX_IMAGE_B64) return "That photo is too large. Retake it.";
  if (!B64.test(image)) return "That photo is not valid base64.";
  return null;
}

export async function readJson(request) {
  if (request.headers.get("content-type")?.includes("application/json") !== true) return null;
  try {
    return await request.json();
  } catch {
    return null;
  }
}
