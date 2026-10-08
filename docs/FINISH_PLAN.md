# Finish plan

Prioritized checklist for finishing the Armando Alkadi site. `[x]` = done, `[~]` = partly done before this run, `[ ]` = to do.
Status at the start of the run (2026-10-08) is noted per item. Live progress is in `docs/PROGRESS.md`, decisions in `docs/DECISIONS.md`.

Environment facts that shape the plan:
- No access to the real Supabase project or Netlify from this machine (network blocks both, no tokens). Everything is built and tested against a **local Supabase stack** (Docker, same Postgres/Auth/Storage/PostgREST services). Applying it to the real project is a handover step.
- The repo already had: schema + RLS + seed migrations (not applied anywhere), the catalog layer shaped like the tables with an in-memory backend, and a mobile-first dashboard (properties, home order, options).

## Priority 1: backend and public site on real data
- [~] Option tables (cities, areas with cover, property types, rental types with unit text, amenities; ar/en names, sort, active). Exists in `0001_schema.sql`.
- [~] Properties, prices, ordered images, status, published, new badge, show-on-home + order, settings.home_count. Exists in `0001_schema.sql`.
- [~] RLS: public reads published + active only, admins write; storage public read, admin write. Exists in `0002_security.sql`, never run.
- [ ] Apply the migrations to local Supabase, fix anything that breaks.
- [ ] Prove RLS with real anonymous/non-admin write attempts (`scripts/check-rls.ts` against local stack).
- [ ] Seed: Dubai only, demo properties `is_demo` (`scripts/seed-demo.ts`; needs images reachable, otherwise local placeholder images).
- [ ] `supabaseBackend()` implementing `CatalogBackend`; chosen automatically when `VITE_SUPABASE_URL` + anon key exist.
- [~] Public site reads from the catalog (done for local backend): home strip, filters from used active options, data-driven ranges, skeletons + error state.
- [ ] Verify public pages on Supabase data in the browser.

## Priority 2: dashboard
- [ ] Email + password login, `/admin/*` guarded, public sign-up disabled (config + check).
- [~] Properties list, search, status filter, quick toggles, full form (done, local).
- [~] Images: multi-upload, drag reorder, delete, in-browser WebP 640/1080/1600 (done, local). [ ] Real upload, srcset from storage, delete files + row together, orphan-file script.
- [~] Home management with drag order + limit, disabled toggle with message (done, local).
- [~] Options management: add/edit/reorder/deactivate, in-use cannot delete (done, local).
- [ ] Site settings (phone, WhatsApp, email, address, hours, social links) table + dashboard page, used everywhere instead of config.
- [ ] Inquiries table (anon insert only, honeypot), contact form saves, dashboard list with status.
- [ ] Backup: export properties, options, settings as JSON.
- [ ] Arabic help page inside the dashboard.
- [x] Fake pages (users, media, English) hidden — already removed in the last commit; English switcher off (`englishReady = false`).
- [ ] Document adding an admin via the Supabase dashboard.
- [ ] Dashboard comfortable on phone (check new pages at 390 px).

## Priority 3: sharing and SEO
- [ ] Netlify Edge Function injecting Open Graph tags for `/property/:id` from Supabase.
- [~] Per-page titles/descriptions (`useMeta` exists). [ ] Property-specific title/description/image.
- [ ] Sitemap generated from published properties (build script), site stays noindex.

## Priority 4: quality
- [ ] Code-split the dashboard (lazy routes; public bundle has no admin code).
- [ ] Playwright e2e (Chromium + WebKit iPhone): home, strip → gallery, filtering, property, WhatsApp link, contact form, dashboard flow with a temporary test admin.
- [ ] Hero scenarios still pass (existing smoke tests + e2e).
- [ ] axe on every public page + dashboard; fix serious issues.
- [ ] Lighthouse mobile: home + property page; report scores.
- [ ] No console errors, no horizontal overflow 360–430 px, palette/contrast audit.
- [ ] Screenshots of every page at 390x844, 390x664, 1440x900 in `docs/screens/final`.
- [ ] Service-role key never in the browser bundle (scan `dist/`).

## Priority 5: handover
- [ ] `docs/OWNER_GUIDE_AR.md`
- [ ] `README.md` rewrite (setup, env vars, deploy, admins, backup).
- [ ] Deploy to Netlify preview — skipped: Netlify not linked (needs login).
- [ ] `docs/FINAL_REPORT.md` in Arabic.
