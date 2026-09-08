# Soon

Point your phone at a neglected spot on your block. Soon reads what kind of
place it is, picks one small improvement from a fixed catalog of real Chicago
interventions, renders it onto your photo, and tells you who to ask.

Built for East Lakeview and the 44th Ward.

## How it runs

A static page plus two API routes, deployed together on Cloudflare Pages.

```
public/index.html        the whole app
functions/api/analyze    photo  -> the idea       (Claude, structured output)
functions/api/render     photo  -> the render     (fal, Flux Kontext)
functions/api/catalog    the display half of the pattern catalog
functions/api/health     which keys are configured
shared/catalog.js        patterns, ward plan, both prompts — single source of truth
```

Both API keys live in Cloudflare secrets and are read only inside the Worker.
The browser sends a photo and a pattern code; it never sends prompt text and
never sees a key.

## Local development

```bash
npm install
cp .dev.vars.example .dev.vars   # then paste your keys into .dev.vars
npm run dev                      # http://127.0.0.1:8788
```

`.dev.vars` is git-ignored. The camera needs `localhost` or https — on
`127.0.0.1` it works; over a LAN IP it will fall back to the photo picker.

## Deploy

```bash
npx wrangler pages project create soon      # once
npx wrangler pages secret put ANTHROPIC_API_KEY
npx wrangler pages secret put FAL_KEY
npm run deploy
```

Without `ANTHROPIC_API_KEY` the app cannot produce an idea. Without `FAL_KEY`
it still produces the idea, the reasoning and the civic steps, and shows your
original photo instead of a render. The About screen reports both.

## Notes for later

- `/api/render` calls fal synchronously and a Kontext edit runs 10–20s. If that
  starts timing out, switch to fal's queue endpoint and poll.
- Nothing rate-limits the routes yet. Before this is public, add a per-IP limit
  (Workers KV, keyed on `cf-connecting-ip`).
- Saved ideas keep fal's image URL, which expires. To make saves durable, copy
  the render into R2 on save and store that key instead.
- Model settings are in `functions/api/analyze.js`: `claude-opus-5`, adaptive
  thinking, effort `medium`. Raise effort if pattern choices feel careless;
  lower it if the wait feels long.
