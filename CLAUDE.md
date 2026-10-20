# CLAUDE.md — Armando Alkadi Holiday Homes

Read this first. Then `docs/DECISIONS.md` (D1–D28, every decision with reasons and limits), `docs/PROGRESS.md` (dated log) and `README.md` (commands).

## Who and how
- Owner of this repo: Basem (basem.albittar@gmail.com). Client: Armando Alkadi Holiday Homes, Dubai (monthly/yearly rentals). Office contact on the client side: "رفيق سليم".
- **Talk to Basem in Levantine Arabic** (he asked for Arabic replies). Short, plain answers; he is not a developer. Arabic documents: put each English word/term on its own line under its sentence, never inline.
- Work on branch **`claude/github-repo-review-lg6a55`**. Never push to `main` (old, 28+ commits behind). Every push to this branch **auto-deploys to production** (Cloudflare Pages Git integration, ~1–2 min). So: test before pushing.
- Commit after each completed item; keep `docs/PROGRESS.md` (log) and `docs/DECISIONS.md` (decisions) updated.

## Hard rules (from the client brief)
- Keep the design and brand exactly: official palette only (CSS tokens in `client/src/index.css`: espresso, espresso-deep, almond, sandstone, date, terracotta…), fonts Castoro + Noto Kufi Arabic, official logo files in `client/public/brand/aahh/` untouched, the hero video story, the horizontal "available homes" strip, all layout decisions. No new colors/fonts/styles. WhatsApp buttons are espresso/almond, not green.
- Do not invent business facts (areas, prices, terms, legal text). Missing content = clearly marked placeholder + tell Basem.
- Site stays **noindex** until Basem says launch (4 switches: `client/public/_headers`, `<meta robots>` in `client/index.html`, `indexing` in `client/src/config/site.ts`, `INDEXING` in `wrangler.jsonc`).
- **Everything on free plans, no credit card** (client refuses paid subscriptions). No R2, no paid Workers.
- The service_role key must never reach the browser bundle (`npm run build:pages` runs `scripts/check-bundle.ts`). Never paste/print secrets; never ask Basem to paste keys in chat — he adds them as environment secrets.
- Irreversible actions (deleting projects/data, DNS changes) only when Basem explicitly asks.

## Live system (as of 2026-10-10)
| Part | Where |
| --- | --- |
| Site | https://alkadihomes.ae + https://www.alkadihomes.ae (custom domains since 2026-10-20), also https://armando-alkadi.pages.dev (Cloudflare Pages project `armando-alkadi`, Git-connected, build `npm run build:pages`, output `dist/public`) |
| Dashboard | https://armando-alkadi.pages.dev/admin — admins: `info@alkadihomes.ae` (office) and `basem.albittar@gmail.com`; passwords were given to Basem in chat, not stored in the repo |
| Database | Supabase free project `armando-alkadi-me`, ref `txlvfqpnurbtnjfagsge`, region ap-south-1 Mumbai, org "Armando". (Old Tokyo project deleted; Netlify site deleted.) |
| Ops Worker | `armando-ops` → https://armando-ops.basem-albittar.workers.dev — cron `41 3 * * *` daily anon read (prevents Supabase free-tier pause), `53 2 * * sun` weekly JSON backup of all tables to KV `armando-backups` (id `4b29983a151c491b84d07887f0a86dd6`), keeps last 8. Secrets: `SUPABASE_SERVICE_ROLE_KEY`, `OPS_TOKEN` (manual run `POST /run?task=ping|backup` with Bearer token; token value not stored — reset with `npx wrangler secret put OPS_TOKEN -c cloudflare/ops/wrangler.jsonc` if needed) |
| Cloudflare account | id `0223f769e18891f770454f63b5cba70e` (Basem.albittar@gmail.com's Account) |
| Images | `/img/<bucket>/<path>` Pages Function → Supabase Storage, 1-year Cache API cache (X-Img-Cache HIT/MISS), client fallback to Supabase on failure |

Public values (Supabase URL + anon key) are committed in `.env.production`, `wrangler.jsonc`, `cloudflare/ops/wrangler.jsonc` — that is intended (they are in the bundle anyway).

## Stack and layout
React 19 + Vite + wouter, Tailwind/`index.css`, GSAP ScrollTrigger + Lenis (hero + strip). Public reads via plain REST (`client/src/lib/supabaseConfig.ts`), supabase-js only in the lazy admin chunk.
- Pages: `client/src/pages`, dashboard `client/src/pages/admin`.
- Data layer: `client/src/lib/catalog/` (`store.tsx`, `backend.ts`, `supabaseAdmin.ts`, `view.ts`, `types.ts`, `demoSeed.ts`).
- i18n: Arabic at `/…`, English at `/en/…` (`client/src/i18n/lang.tsx`, `t(ar, en)`, LangSwitch button EN/عربي). Dashboard Arabic only. English hero/headings are translations approved with the rest of the texts.
- Config & texts: `client/src/config/site.ts` (brand, hero story ar/en, contact fallbacks, `payments.tabby`).
- Pages Functions: `functions/img/[[path]].ts`, `functions/property/[code].ts`, `functions/en/property/[code].ts` (WhatsApp/social link previews, `shared/og.ts`), routes limited by `client/public/_routes.json`.
- Migrations: `supabase/migrations/0001…0008` (apply new ones with the Supabase Management API `POST /v1/projects/<ref>/database/migrations` or `npx supabase db push`).
- Scripts: `scripts/` (seed-demo, check-rls, create-admin, restore-backup, orphan-files, sitemap, check-bundle, check-og, screens).

## Commands
```
npm run dev            # localhost:3000 (copy .env.production to .env.local for real data)
npm run check          # TypeScript (site + Cloudflare code)
npm test               # vitest smoke tests (28)
npm run test:e2e       # Playwright — only against the LOCAL Supabase stack, never production
npm run build:pages    # production build + sitemap + secret scan
npm run ops:deploy     # deploy the ops Worker
npm run db:restore -- --kv latest [--replace] --yes   # restore a backup (dry run without --yes)
npm run db:check-rls   # security check (42/42 expected)
npm run admin:create -- email "password"
```
Scripts needing the service_role key read it from `.env.local` (never committed).

## Done recently (see PROGRESS for detail)
English site + language switch; free-plan safeguards (image cache, keep-alive, weekly backups, restore); moved hosting Netlify → Cloudflare Pages and DB Tokyo → Mumbai; footer dashboard link; office feedback: landline `04 370 8077` (settings.landline, editable in dashboard), floating WhatsApp button (laptop/tablet; phones use the bottom bar), tabby icon in footer / property page / cards (official app icon; replace with full wordmark when the office gets the merchant kit).

## In progress / next
1. **Domain `alkadihomes.ae`** (registered at Tasjeel.ae). Status 2026-10-10: zone added to Cloudflare (Free), DNS records reviewed and fixed — all A/CNAME set to DNS only (cPanel host 51.210.18.170 serves email + old site), new `A mail → 51.210.18.170` (DNS only), MX now `mail.alkadihomes.ae` priority 0 (so moving the apex to Pages won't break email). Cloudflare nameservers `lilith.ns.cloudflare.com`, `yisroel.ns.cloudflare.com` set at Tasjeel on 2026-10-20 (public DNS confirmed). Next: when the zone is Active, add custom domains to Pages; keep all mail/cPanel records grey forever. Plan: Cloudflare → Add a domain → **Connect a domain** (not Transfer) → Free plan → Basem sends the scanned DNS records table → **verify MX/email records are all present** (office email `info@alkadihomes.ae` must keep working) → Basem replaces nameservers at Tasjeel with the two Cloudflare ones (.ae can take up to 24–48 h) → add custom domains `alkadihomes.ae` + `www` to the Pages project → update SITE_URL/sitemap, Supabase auth `site_url` + redirect list, check email still works. Keep noindex until Basem says launch.
2. Email service (free, e.g. Resend) after the domain: password reset + new-inquiry notification to the office.
3. Office content: real properties + photos (they add them in the dashboard), then delete the 5 demo homes (dashboard button); email / working hours / social links if wanted; area cover photos; tabby approved wording/full logo if they get it.
4. Watch the ops Worker CPU (dashboard showed P90 14 ms vs 10 ms free limit; runs succeed so far). If backups start failing, split the export across several runs.

## Environment notes (cloud sessions)
Secrets are proxy-injected for api.supabase.com, api.cloudflare.com (and formerly api.netlify.com). Node needs `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt`; wrangler needs `CLOUDFLARE_API_TOKEN=<any>` + `CLOUDFLARE_ACCOUNT_ID=0223f769e18891f770454f63b5cba70e`. On Basem's own laptop none of this applies: he uses `npx wrangler login` and the Supabase dashboard.
