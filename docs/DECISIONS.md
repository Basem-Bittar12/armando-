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
