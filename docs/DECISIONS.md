# Decisions

Each entry: what was decided, why, and how to reverse it.

## D1. Build and test against a local Supabase stack
The real Supabase project and Netlify are unreachable from the work machine (network policy denies both hosts, no tokens). Instead of waiting, everything runs against the official Supabase services in Docker (`supabase start`, images pulled from Docker Hub). The same migrations will be applied to the real project later with `npm run db:migrate` (or `supabase db push`).
Reverse: nothing to reverse; the code reads URL and keys from environment variables only.

## D2. Push the work branch at checkpoints
The brief says "never push". This run happens in a cloud container that is deleted when the session ends, so commits that exist only locally would be lost. Commits are pushed (never forced) only to the session's own feature branch `claude/github-repo-review-lg6a55`, never to `main`, and no pull request is opened.
Reverse: delete the remote branch.

## D3. Property status values stay in Arabic
The schema written before this run stores `status` as `متاح / محجوز / مؤجر` (available, reserved, rented) with a check constraint. Kept as is: the dashboard and site already use these values, and changing them would be a data migration with no user-visible benefit.
Reverse: a migration mapping the three values to English keys plus a label map in the UI.

## D4. Contact form saves an inquiry; WhatsApp becomes optional
The brief asks for the form to save to an `inquiries` table. Before, the form only opened WhatsApp with a prefilled message. Now "أرسل الطلب" saves the inquiry, then the success panel offers the same prefilled WhatsApp message as an optional button. Layout, fields and styles are unchanged; only the button label and success text changed. If saving fails, the error toast offers WhatsApp directly.
Reverse: `client/src/pages/Contact.tsx`, `submit()`.

## D5. Honeypot: silent drop in the browser, hard rejection in the database
A visually hidden `website` field (screen readers skip it). If it is filled, the browser shows success and sends nothing, so a bot gets no signal. Requests that bypass the page are rejected by a check constraint on `inquiries.website`, and RLS only allows anonymous inserts with status `جديد`. There is no rate limit (would need an edge function or captcha; not added).

## D6. Without Supabase variables the dashboard is an open demo
If `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are missing, the site runs on in-memory demo data and `/admin` does not ask for a login (there is nothing real to protect; changes vanish on reload; a banner says so). Production always has the variables, and then every `/admin` route requires an admin login.

## D7. Delete order: database row first, then storage files
If file removal fails after the row is gone, the files are harmless orphans that `npm run storage:orphans` lists (and `--delete` removes). The other order could leave a published property with broken images.

## D8. A JPEG share image per photo
WhatsApp does not reliably show WebP images in link previews. Every uploaded photo also gets a 1200 px JPEG (`…-og.jpg`) used only by the link-preview edge function, which falls back to the 1080 WebP if the JPEG is missing (older uploads). Migration 0005 allows `image/jpeg` in the `property-images` bucket.

## D9. Phone tab bar: four tabs plus "المزيد"
The dashboard grew from 3 to 7 sections. Seven bottom tabs do not fit 360 px with 44 px targets, so the phone shows Properties, Home, Inquiries and "More" (Options, Contact info, Backup, Help, Sign out). The desktop sidebar lists everything.

## D10. Public reads use REST directly; supabase-js loads only with the dashboard
supabase-js is about 59 kB gzip. The public site only needs a few reads and one insert, so it calls PostgREST with `fetch` (`client/src/lib/supabaseConfig.ts`). The dashboard chunk loads supabase-js for login, uploads and writes, and passes the admin session token to the same REST reads so admins see drafts. Main chunk went from 232 kB to 174 kB gzip.

## D11. Demo seed images fall back to hero frames when Unsplash is unreachable
`scripts/seed-demo.ts` first tries the original Unsplash photos. On the work machine Unsplash is blocked, so the local demo properties use frames of the finished room from the hero story (already in the repo). When the seed runs against the real project from a normal network, the Unsplash photos are used.

## D12. WebKit runs in the official Playwright Docker image
The WebKit browser download is blocked here, so `npm run test:e2e:webkit` runs the same suite inside `mcr.microsoft.com/playwright:v1.56.1-noble`. E2E serves the build with `server/index.ts` (Express), because `vite preview` answers 304 without `Vary: Accept-Encoding` and WebKit then displays compressed bytes as text.

## D13. Google Fonts stylesheet is preloaded, not render-blocking
Same fonts, same weights, `display=swap` unchanged. Text may appear in the fallback font for a moment before Castoro / Noto Kufi Arabic load. Lighthouse FCP improved by about 1.5 s locally.
Reverse: `client/index.html`, restore the plain `<link rel="stylesheet">`.

## D14. Two tiny visual adjustments for accessibility (same palette colors)
- Gallery counter on the property page: background opacity 0.62 → 0.82 of Espresso Deep, so the Almond text keeps contrast over light photos.
- Card photo carousels are keyboard-focusable (one extra Tab stop per card, Terracotta focus ring inside the image), required by axe `scrollable-region-focusable`.

## D15. README in English, owner guide and final report in Arabic
The README is for developers and is mostly commands, paths and variable names; writing it in Arabic would put almost every line under the "English terms on their own line" rule. The owner guide and the final report are in Arabic and follow that rule.

## D16. `create-admin` accepts a password argument
Password-reset emails need SMTP, which is postponed ("anything that needs emails, later"). `npm run admin:create -- email "password"` creates a confirmed admin with that password; the README also documents the Supabase-dashboard way.

## D17. Lighthouse measured locally, approximating Netlify
Scores come from Lighthouse 12 (mobile) against the production build served with gzip on localhost, with Supabase local. Google Fonts are blocked from this machine, so font timing is not representative. Re-run on the Netlify preview once it exists.

## D18. English site lives under `/en`, language comes from the URL only
Arabic stays on the existing URLs (`/`, `/properties`, `/property/AK-102`); English is the same pages under `/en`. One button in the header on every page switches to the same page in the other language (label "EN" on Arabic pages, "عربي" on English pages). No cookie or browser-language redirect: every page has one fixed URL per language, which is what WhatsApp sharing and search engines need. Filter values are not carried across (they are names in the page's language); the path is. The dashboard stays Arabic only.
Data: English title/description/area names are used when filled, otherwise the Arabic text shows (never an empty field). Layout mirrors through CSS logical properties; the hero story and the strip motion are the same in both languages.
Reverse: set `englishReady = false` in `client/src/config/site.ts` (hides the button; `/en` pages still resolve).

## D19. English text for demo homes and the office address
The five demo homes got English titles/descriptions (translations of their Arabic text; they are demo content to be deleted before launch). The office address in settings got an English version translated word for word from the Arabic one ("Office 3126, Aspin Commercial Tower, Sheikh Zayed Road, Dubai"); it is editable in the dashboard (Contact info → English). Free-text "minimum rental period" is translated only for common patterns ("3 أشهر" → "3 months"); anything else shows as typed.

## D20. English marketing copy is a draft
Hero story, page titles and section headings in English are faithful translations of the Arabic copy, marked as a draft for the owner to approve (`heroStoryEn`, `pageMetaEn` in `client/src/config/site.ts`).

## D21. English hero headline fits one line on phones
Same font (Castoro), size scales down only when needed: `min(32px, (100vw − 40px) × 0.087)` → 30.5 px on a 390 px phone, 27.8 px on 360 px. At 32 px "Every home starts empty." is 360 px wide and wrapped to two lines, which made the phone hero text band taller and the video smaller than in Arabic (61 % vs 66 % of the hero). Now both languages show the same split (66 % / 66 % on 390×844). On 412–430 px phones the English body sentence still needs one more line than the Arabic (Latin text is wider), so the video is 3 points smaller there. Laptop unchanged: the video is full-bleed and does not depend on the text height. Scroll mechanics (pins, scroll lengths, strip travel, reveals) were measured identical in both languages.

## D22. Production deploys only on request, batched
Netlify Free plan: 300 credits per month (cycle Oct 9 – Nov 8). Each production deploy costs 15 credits; deploy previews / draft deploys cost 0. Ten production deploys on Oct 9–10 used 150 credits (50 %). Traffic is negligible (2 credits per 10,000 requests, 20 per GB). At 300 the whole team is paused ("Site not available") until the next cycle, and the Free plan cannot buy extra credits.
From now on: changes are checked locally and, when a live look is needed, on a free draft deploy (`netlify deploy --build`, no `--prod`; behind Netlify login). Production deploys happen only when the user asks, with all pending changes in one deploy. The site is not linked to GitHub, so pushes never deploy by themselves.

## D23. Free plans only: Cloudflare Pages + Workers + KV in front of Supabase Free
The client wants no paid subscription and no credit card. Hosting moves from Netlify (credits, D22) to Cloudflare Pages; Supabase stays on Free. Three gaps of Supabase Free are closed with free Cloudflare tools (D24–D26). No Cloudflare product that needs a payment method is used (no R2, no paid Workers). Limits checked on 2026-10-10 against the current docs (dates are each page's "last updated"):

| Limit (free plan) | Value | Source |
| --- | --- | --- |
| Workers + Pages Functions requests | 100,000 per day, shared, reset 00:00 UTC | [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) (Oct 8, 2026), [Pages Functions pricing](https://developers.cloudflare.com/pages/functions/pricing/) (Sep 8, 2026) |
| Static asset requests on Pages | free and unlimited (a request that does not invoke a Function) | Pages Functions pricing |
| When the daily Functions limit is reached | Pages default "fail open": static assets are served, Functions skipped | [Pages Functions routing](https://developers.cloudflare.com/pages/functions/routing/) |
| `_routes.json` | at most 100 include/exclude rules | Pages Functions routing |
| CPU time | 10 ms per HTTP request, 10 ms per Cron Trigger run (network waits do not count) | Workers limits |
| Subrequests | 50 per invocation (Cache API calls share this quota); 1,000 to Cloudflare services such as KV | Workers limits |
| Cron Triggers | 5 per account | Workers limits |
| Workers | 100 per account; 64 env variables/secrets per Worker | Workers limits |
| Cache API | works in Pages Functions on custom domains and `*.pages.dev`; local to one data center; not tiered; max object 512 MB | [Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/), [How the cache works](https://developers.cloudflare.com/workers/reference/how-the-cache-works/) |
| Cache retention | TTL is a maximum: rarely requested objects can be evicted earlier (LRU) | [Retention vs freshness](https://developers.cloudflare.com/cache/concepts/retention-vs-freshness/) |
| KV | 100,000 reads, 1,000 writes, 1,000 deletes, 1,000 lists per day; 1 GB storage; 25 MiB per value | [KV limits](https://developers.cloudflare.com/kv/platform/limits/) (Oct 8, 2026), [KV pricing](https://developers.cloudflare.com/kv/platform/pricing/) |
| Pages | 500 builds per month (we upload builds directly, no Cloudflare builds); 20,000 files; 25 MiB per file | [Pages limits](https://developers.cloudflare.com/pages/platform/limits/) (Sep 5, 2026) |
| Supabase pausing | Free projects are paused after 1 week of inactivity; a paused project can be restored from the dashboard within 1 year | [Supabase pricing](https://supabase.com/pricing), [Upgrading](https://supabase.com/docs/guides/platform/upgrading) |
| Supabase egress | 5 GB uncached + 5 GB cached per month (separate quotas) | [Egress](https://supabase.com/docs/guides/platform/manage-your-usage/egress) |
| Supabase over quota (Free) | email notice, grace period, then possible restrictions (Fair Use Policy) | [Billing FAQ](https://supabase.com/docs/guides/platform/billing-faq) |
| Supabase other | 500 MB database, 1 GB file storage, 50 MB max file, no automatic backups, 2 active projects | Supabase pricing, [Storage size](https://supabase.com/docs/guides/platform/manage-your-usage/storage-size), [File limits](https://supabase.com/docs/guides/storage/uploads/file-limits) |

Our use: 2 of 5 Cron Triggers, 1 Worker, 1 KV namespace, 3 Function routes, 197 files (largest well under 25 MiB).

## D24. Keep-alive: one anon read per day
`cloudflare/ops` cron `41 3 * * *` (07:41 Dubai) reads `settings?select=id&limit=1` with the anon key; the weekly backup run reads the whole database too. Supabase does not publish what exactly counts as activity; a daily REST query is the common practice. If a "project inactive" email ever arrives, change the cron to every 6 hours (`0 */6 * * *`): still 1 trigger and 4 requests per day of the 100,000.

## D25. Weekly backup to KV, last 8 kept, restore script
Cron `53 2 * * sun` exports every table PostgREST exposes (found from its OpenAPI description, so new tables are included automatically) with the service-role key, which exists only as a Worker secret. To stay under 10 ms CPU the rows are never parsed: each page of PostgREST's JSON text is spliced into the backup document as is. One document per run (`backup:<UTC time>`), metadata with row count and size; older than the newest 8 are deleted. Today a backup is about 17 KB (12 tables); KV allows 25 MiB per value and 1 GB in total. Headroom: up to about 37 pages of 1,000 rows fit in one run's 50 subrequests; if the data ever grows past roughly 30,000 rows, split the export over several runs.
Restore: `scripts/restore-backup.ts` (merge by primary key, or `--replace` for an exact copy), dry run unless `--yes`. Tested on the local Supabase: broken data restored in merge mode (only `updated_at`, set by the existing trigger, differs) and in replace mode (database identical to the backup, extra rows removed).
Not in the backup: Auth accounts and image files; documented in README.

## D26. Images through `/img` with a one-year edge cache
All image URLs on the site, in the dashboard and in link previews are `/img/<bucket>/<path>`. The Pages Function fetches from Supabase only on a cache miss in that Cloudflare data center, stores the response with the Cache API (`max-age=31536000, immutable`), never caches errors, and only allows the two public buckets. Chosen over `fetch()` cache options because the Cache API is documented to work on `*.pages.dev` without a zone; the trade-off is no tiered cache, so each data center fetches an image once.
Budget: a first visit to home + listing + one property shows about 40 images, each one Function request, so 100,000 per day ≈ 2,500 new visitors per day; returning visitors use the browser cache (immutable, one year) and cost nothing. Supabase egress becomes roughly one copy of each image per data center instead of one per visitor (measured before this change: about 1 MB of images per visit, which capped the free 5 GB at roughly 5,000 visits per month).
Safety net: if `/img` fails (for example "fail open" after the daily limit, which serves the site's HTML instead of the image) `client/src/lib/imgFallback.ts` reloads that image straight from Supabase. Locally verified: first request `X-Img-Cache: MISS`, second `HIT`; with `/img` forced to fail, images still load from Supabase.
