# Finish plan

Prioritized checklist for finishing the Armando Alkadi site. `[x]` done and verified, `[-]` skipped (reason given).
Details: `docs/PROGRESS.md` (log), `docs/DECISIONS.md` (decisions), `docs/FINAL_REPORT.md` (Arabic report).

Environment: the real Supabase project and Netlify are unreachable from the work machine (network policy, no tokens). Everything was built and tested against a local Supabase stack (same services, Docker). Applying it to the real project is a handover step.

## Priority 1: backend and public site on real data
- [x] Option tables (cities, areas with cover, property types, rental types with unit text, amenities; ar/en, sort, active) — `0001_schema.sql`
- [x] Properties, prices, ordered images, status, published, new badge, show-on-home + order, settings.home_count — `0001`
- [x] Contact settings + inquiries + save/reorder RPCs — `0004`; JPEG share images allowed — `0005`
- [x] RLS (public reads published/active only, admin writes; storage public read, admin write) — `0002`, `0004`
- [x] Proven with real anonymous and non-admin attacks: 41/41 rejected (`npm run db:check-rls`)
- [x] Seed: Dubai only, demo properties `is_demo`
- [x] Public site reads Supabase (REST); strip = published + featured + not rented, ordered, limited; filters from used active options; ranges from data; skeletons and error states in palette colors

## Priority 2: dashboard
- [x] Email + password login, `/admin/*` guarded, non-admins refused, public sign-up disabled (local config; real project = manual toggle, see report)
- [x] Properties list, search, status filter, quick toggles, full form with prices, amenities, images
- [x] Images: multi-upload, drag reorder, delete; browser WebP 640/1080/1600 (+ JPEG for previews); srcset; delete removes row + files; `npm run storage:orphans`
- [x] Home management: drag order, limit, disabled toggle with message
- [x] Options: add, edit, reorder, deactivate, in-use cannot delete; area cover upload
- [x] Site settings (phone, WhatsApp, email, address, hours, social) edited in the dashboard, used site-wide
- [x] Inquiries: anonymous insert only + honeypot; dashboard list with status
- [x] Backup JSON export
- [x] Arabic help page
- [x] No fake pages (users, media, English)
- [x] How to add an admin via the Supabase dashboard (README → Admins)
- [x] Comfortable on phone (4 tabs + More; audited 360–430 px)

## Priority 3: sharing and SEO
- [x] Netlify Edge Function: Open Graph title, price, location, cover image for `/property/:code` (verified locally with `scripts/check-og.ts`)
- [x] Per-page titles/descriptions; sitemap + robots generated at build; site stays noindex

## Priority 4: quality
- [x] Dashboard code-split (lazy chunk incl. supabase-js and writes); enforced by `scripts/check-bundle.ts`
- [x] Service-role key never in the bundle (scanned after every Netlify build)
- [x] Playwright e2e on Chromium desktop, Chromium iPhone, WebKit iPhone — all pass
- [x] Hero scenarios: nine phone sizes, sofa/table never cut, starts at top
- [x] axe on every public page and dashboard page: no serious/critical issues
- [x] Lighthouse mobile: home 87, property 85 (a11y 100, best practices 100, SEO 69 because noindex)
- [x] No console errors, no horizontal overflow 360–430 px, palette-only colors
- [x] Screenshots at 390x844, 390x664, 1440x900 in `docs/screens/final`

## Priority 5: handover
- [x] `docs/OWNER_GUIDE_AR.md`
- [x] `README.md` (setup, env vars, deploy, admins, backup)
- [-] Deploy to Netlify preview — Netlify not linked (needs login)
- [x] `docs/FINAL_REPORT.md`
