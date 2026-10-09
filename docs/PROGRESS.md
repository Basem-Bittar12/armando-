# Progress

Resume guide: read `docs/FINISH_PLAN.md` (checklist), this file (what happened last), `docs/DECISIONS.md`.

Local Supabase: `cd /home/user/armando- && npx supabase start` (needs `SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io` here; dockerd must be running: `nohup dockerd &`).

## Log
- Pre-flight: checkpoint commit `d765460` pushed. Supabase/Netlify unreachable (see D1).
- Local Supabase stack running (Docker). Plan written.
- P1 done: migrations 0001-0004 apply on local stack; RLS attack check passes (docs/test-results/rls-local.txt); seed works offline (hero frames as fallback images); public site reads Supabase.
- P2 mostly done: login + guard + lazy admin chunk, inquiries, contact settings, backup, help. Remaining P2: orphan-files script, verify image upload/delete end-to-end in a real browser (covered by e2e next).
- Next: Playwright e2e (chromium on host; webkit via docker image mcr.microsoft.com/playwright:v1.56.1-noble, already pulled).
- P3 done: edge function OG tags (+ JPEG share image per photo), sitemap/robots at build, indexing flag; bundle check script.
- P4 done: e2e 17/17 Chromium + 8/8 WebKit; audit 8/8; Lighthouse home 87 / property 85; screenshots (45).
- P5 done: README (English, D15), OWNER_GUIDE_AR, FINAL_REPORT. Netlify deploy skipped (not linked).
- State: all items complete except those needing the user's login (see FINAL_REPORT "ما يحتاجك أنت").
- 2026-10-09: real Supabase project `armando-alkadi` (fgpnasnmirfcxmjlvpey, region ap-northeast-1) reached via a proxy-injected Management API token.
  Migrations 0001-0005 applied through the Management API (recorded in supabase_migrations with API timestamps), public sign-up disabled (disable_signup=true, min password 8), demo seed done (hero-frame images, Unsplash blocked here), RLS check 41/41 (docs/test-results/rls-production.txt).
  Node scripts need NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt in this sandbox. Real keys in .env.local (gitignored); local stack keys moved to .env.localstack.
  Not done: e2e against the real project (blocked by the session's permission policy: it writes test data to production), first admin (waiting for the owner's email), Netlify (no token yet).
- 2026-10-09: Netlify site `armando-alkadi` (f65bc8d0-30ab-4ad2-be56-762dca122b58) created via API; env VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY set (public keys only); draft deploy with edge function: https://6ac8b38d9beaada0657a0da3--armando-alkadi.netlify.app (behind Netlify login: drafts are protected by default). Production URL not deployed yet — waiting for the user's go-ahead.
  CLI: netlify-cli in scratch, NETLIFY_AUTH_TOKEN=any (the proxy injects the real token), `netlify link --id …` then `netlify deploy --build`.
- 2026-10-09: production deploy https://armando-alkadi.netlify.app (Netlify login protection limited to non-production via sso_login_context=non_production). Live checks: all pages 200, noindex header + meta, OG tags + JPEG cover, sitemap with real URL, brotli + immutable assets, no secrets in JS. Fixed live CLS on property page (skeleton min-height) and LCP priority on first listing cards; live Lighthouse home 91 / properties 73 / property 73 (a11y 100). Supabase latency ~0.8 s/request from here (Tokyo region).
- 2026-10-09: live review on phone (390x844, 360x740) and laptop (1440x900), scrolled through home, listing and property pages: no horizontal scroll, no console errors. Fixed: Netlify "Powered by Netlify" badge covering the phone WhatsApp bar (built_with_badge_enabled=false); footer address split into columns on phones (inline-flex) → block text. Redeployed.
- 2026-10-09: home strip: when every featured card fits on screen (laptops with 3 homes) the row is centered exactly and the sideways pinned motion is skipped; with more cards than fit (phones, or more homes) the original motion is unchanged. Deployed.
- 2026-10-09: home strip now has 5 cards: two demo properties added on the real project (AK-110 townhouse Al Barsha yearly, AK-118 1BR Business Bay monthly+yearly, is_demo, Unsplash photos), settings.home_count = 5. With 5 cards the row is wider than every screen, so the pinned sideways motion runs on laptops and phones (as requested). seed-demo appends new homes to the end of the home order.
- 2026-10-09: strip edge margin capped at 40px on wide screens (was the content-column margin, up to 341px at 1890 wide); phones unchanged. Deployed.
