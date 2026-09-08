/**
 * The Soon catalog: site types, the intervention patterns, the ward plan, and
 * the two prompts built from them.
 *
 * This is the single source of truth. The Worker builds every prompt from it so
 * the browser never supplies prompt text, and the browser fetches the display
 * half of it from /api/catalog so labels and copy can never drift apart.
 */

export const SITES = {
  wall: "Blank wall",
  alley: "Alley",
  parkway: "Parkway",
  corner: "Corner",
  viaduct: "Viaduct",
  transit: "Transit stop",
  frontage: "Storefront",
  leftover: "Leftover space",
};

export const PATTERNS = {
  S1: {
    n: "Daylighted corner",
    lever: "Safer",
    sites: ["corner"],
    r: "Clear the parked vehicles and visual obstructions from the twenty feet nearest the crosswalk on both approaches. Add a short row of bollards and a low planted bed in the reclaimed space.",
    path: "CDOT, through the 44th Ward office. Often a menu money line item.",
  },
  S2: {
    n: "Curb bumpout",
    lever: "Safer",
    sites: ["corner", "frontage"],
    r: "Extend the sidewalk outward into the parking lane at the corner, forming a curb bumpout with a granite curb, matching concrete, and two or three planted shrubs. Shorten the visible crosswalk accordingly.",
    path: "CDOT. Menu money. Ward office first.",
  },
  S4: {
    n: "Viaduct lighting",
    lever: "Safer",
    sites: ["viaduct"],
    r: "Add warm even LED lighting along the underside of the viaduct and repaint the columns and walls in a clean solid color.",
    light: "evening",
    path: "CDOT plus the railroad or CTA. The ward office coordinates.",
  },
  S5: {
    n: "Alley lighting",
    lever: "Safer",
    sites: ["alley"],
    r: "Add warm downward-facing wall-mounted lights on the garage and building walls along the alley, casting even pools of light on the pavement.",
    light: "dusk",
    path: "311 for city alley lights. Private wall fixtures need only the owner.",
  },
  S6: {
    n: "Cleared and cleaned",
    lever: "Safer",
    sites: ["wall", "alley", "parkway", "corner", "viaduct", "transit", "frontage", "leftover"],
    r: "Remove the litter, overgrowth, weeds and clutter from the scene. Repair and clean the visible surfaces. Change nothing structural and add nothing new.",
    path: "311, or one person with a bag and an hour.",
  },
  F1: {
    n: "Movable seating",
    lever: "Friendlier",
    sites: ["frontage", "leftover", "parkway"],
    r: "Add four or five lightweight movable metal chairs and one small round table, arranged casually and not in a row, on the existing paving.",
    path: "The property owner or the block club. No permit on private frontage.",
  },
  F2: {
    n: "A bench",
    lever: "Friendlier",
    sites: ["parkway", "transit", "frontage"],
    r: "Add a single simple wooden and cast-iron bench facing the street, positioned on the existing sidewalk with clear passage behind it.",
    path: "CDOT street furniture, menu money, or the local SSA on a commercial strip.",
  },
  F3: {
    n: "Bike corral",
    lever: "Friendlier",
    sites: ["frontage", "corner"],
    r: "Replace one parallel parking space at the curb with a bike corral: a low steel frame, six inverted-U racks, protective bollards and a few parked bicycles.",
    path: "CDOT bike parking program. A nearby business usually sponsors it.",
  },
  F4: {
    n: "People Spot",
    lever: "Friendlier",
    sites: ["frontage"],
    r: "Replace two parking spaces at the curb with a raised wooden platform level with the sidewalk, edged with planters and railing, holding a few tables and chairs.",
    path: "Make Way for People, CDOT. Needs a business or chamber sponsor.",
  },
  F5: {
    n: "Play street",
    lever: "Friendlier",
    sites: ["alley", "corner"],
    r: "Show the street closed to traffic at the near end with simple barricades, the pavement marked with painted hopscotch and game grids in bright colors, and a few chairs at the edges.",
    path: "A block party or play street permit through the ward office.",
  },
  F6: {
    n: "Shared apron",
    lever: "Friendlier",
    sites: ["alley", "wall", "leftover"],
    r: "Add two simple built-in wooden benches against the wall, a small planted bed, and a wall-mounted hook rail on the existing apron.",
    path: "The property owner. Nobody else.",
  },
  B1: {
    n: "Street tree",
    lever: "Beautiful",
    sites: ["parkway", "frontage", "corner"],
    r: "Add one mature honeylocust street tree in the existing parkway, with a mulched pit and a simple trunk guard, casting dappled shade on the sidewalk.",
    path: "311 tree planting request, Bureau of Forestry. Free, and slow.",
  },
  B2: {
    n: "Planted tree pit",
    lever: "Beautiful",
    sites: ["parkway"],
    r: "Fill the bare tree pit with layered perennial planting: low grasses, coneflowers and groundcover, edged with a simple low metal guard. Keep the existing tree.",
    path: "One person, one afternoon.",
  },
  B3: {
    n: "Corner planters",
    lever: "Beautiful",
    sites: ["corner", "frontage"],
    r: "Add three large planted containers in matte dark metal along the curb edge, filled with seasonal perennials and small shrubs.",
    path: "Block club or SSA. Someone has to commit to watering, which is the hard part.",
  },
  B4: {
    n: "Wall mural",
    lever: "Beautiful",
    sites: ["wall", "viaduct", "alley"],
    r: "Paint a large geometric abstract mural in three or four bold flat colors across the blank wall surface, following the wall's existing shape and openings. Do not add text, letters or signatures.",
    path: "Property owner consent first, then a muralist or the ward's public art contact.",
  },
  B5: {
    n: "Repair and paint",
    lever: "Beautiful",
    sites: ["wall", "alley", "frontage"],
    r: "Repair the cracked, stained and damaged surfaces and repaint them in a clean solid color appropriate to the building. Add nothing new.",
    path: "Property owner. 311 for city-owned surfaces.",
  },
};

export const WARD = [
  "Housing, affordability and smart density, including preserving three- and four-flats",
  "Revitalized commercial corridors, with Clark Street between Newport and Wellington as the first focus, plus the vacant parcels left by the CTA Red and Purple Modernization project",
  "Neighborhood amenities: parks, green space, dog-friendly areas and cultural attractions",
  "Public safety and infrastructure: walkability, outdoor dining, transit access and lower speed limits",
];

/** The display half of the catalog — everything the browser needs to render a result. */
export function publicCatalog() {
  const patterns = {};
  for (const [id, p] of Object.entries(PATTERNS)) {
    patterns[id] = { n: p.n, lever: p.lever, path: p.path };
  }
  return { sites: SITES, patterns };
}

function catalogText() {
  return Object.entries(PATTERNS)
    .map(([id, p]) => `${id} | ${p.n} | lever: ${p.lever} | fits: ${p.sites.join(", ")}`)
    .join("\n");
}

export function analysisPrompt() {
  return [
    "You are helping a neighbor in East Lakeview, Chicago see one small improvement that would help the exact spot in this photo.",
    "",
    "STEP 1. Classify the site as exactly one of:",
    Object.entries(SITES)
      .map(([k, v]) => `${k} = ${v}`)
      .join("\n"),
    "",
    "STEP 2. Decide whether this spot actually needs anything. If it already has mature trees, sound paving, working seating, adequate light and no visible neglect, it does not. Be honest. An app that always finds a problem is not looking.",
    "",
    "STEP 3. If it does need something, pick exactly ONE pattern from this catalog. It must fit the site type you chose. Pick the one that would most help the people who walk past this spot, preferring the cheapest intervention that would genuinely work.",
    catalogText(),
    "",
    "The 44th Ward 2025 Community Plan pillars:",
    WARD.map((w) => `- ${w}`).join("\n"),
    "",
    "Rules:",
    "- Describe only what you can actually see. Never invent an address, an owner or a business name.",
    "- No statistics, no cited studies. Reason from what the change does to how people behave here.",
    "- Plain language. Short sentences. No marketing tone.",
    "",
    "If needed is false: fill site and nullWhy only, and set every other field to an empty string or empty array.",
    "nullWhy: max 28 words, naming specifically what is already working here.",
    "",
    "If needed is true:",
    "patternId: the catalog code, exactly as written above.",
    "placeName: 2 to 5 words, a proper name for the finished thing, the way a neighbor would say it out loud. No quotation marks.",
    "where: what you can honestly tell about the location from the photo, max 8 words.",
    "lede: one sentence, max 24 words, present tense, describing what changes.",
    "why: two sentences, max 45 words, on why this changes how people use this spot.",
    "planTie: one sentence, max 25 words, naming which ward pillar this serves.",
    "placement: max 30 words, describing exactly where in this photograph the change goes, using what is visible. This is passed to an image model, so be concrete about position and scale.",
    "steps: exactly 3, in order. do is max 12 words, an action a person takes. who is max 7 words naming the office, program or role.",
  ].join("\n");
}

/** JSON Schema for the analysis, enforced by structured outputs so no parsing is needed. */
export const IDEA_SCHEMA = {
  type: "object",
  properties: {
    site: { type: "string", enum: Object.keys(SITES) },
    needed: { type: "boolean" },
    nullWhy: { type: "string" },
    patternId: { type: "string", enum: [...Object.keys(PATTERNS), ""] },
    placeName: { type: "string" },
    where: { type: "string" },
    lede: { type: "string" },
    why: { type: "string" },
    planTie: { type: "string" },
    placement: { type: "string" },
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: { do: { type: "string" }, who: { type: "string" } },
        required: ["do", "who"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "site",
    "needed",
    "nullWhy",
    "patternId",
    "placeName",
    "where",
    "lede",
    "why",
    "planTie",
    "placement",
    "steps",
  ],
  additionalProperties: false,
};

export function renderPrompt(patternId, placement) {
  const p = PATTERNS[patternId];
  const light =
    p.light === "evening" ? "Evening light." : p.light === "dusk" ? "Dusk light." : "Late afternoon light.";
  return [
    `Edit this photograph. ${p.r}`,
    placement ? `Placement: ${placement}` : "",
    "",
    "Absolute constraints:",
    "- Preserve the exact camera position, framing, perspective and crop.",
    "- Preserve every existing building, window, door, roofline, sign, utility pole, wire, curb line and pavement marking not named above.",
    "- Make one change only. Add nothing that was not asked for.",
    "- No crowds. At most two or three people, incidental, mid-distance.",
    "- No new text, lettering, logos or signage anywhere in the image.",
    `- Photographic, not illustrated. Real Chicago materials. ${light}`,
  ]
    .filter(Boolean)
    .join("\n");
}
