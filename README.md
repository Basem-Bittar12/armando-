# Armando Alkadi Holiday Homes

Website and office dashboard for monthly and yearly rentals in Dubai.
React + Vite on Netlify, data in Supabase (Postgres, Auth, Storage).

- Public site: `/`, `/properties`, `/property/:code`, `/contact`
- Dashboard: `/admin` (email + password, admins only)
- Arabic guide for the site owner: [`docs/OWNER_GUIDE_AR.md`](docs/OWNER_GUIDE_AR.md)
- Final report of the finishing run: [`docs/FINAL_REPORT.md`](docs/FINAL_REPORT.md)

## How it fits together

| Part | Where |
| --- | --- |
| Pages | `client/src/pages`, dashboard in `client/src/pages/admin` (one lazy chunk) |
| Data layer | `client/src/lib/catalog` — `store.tsx` (rules), `backend.ts` (read + inquiries), `supabaseAdmin.ts` (writes, lazy) |
| Database | `supabase/migrations/0001…0005` — tables, RLS, storage buckets, RPCs |
| Link previews | `netlify/edge-functions/property-og.ts` + `shared/og.ts` |
| Brand, texts, defaults | `client/src/config/site.ts` (contact details now live in the dashboard) |
| Styles | `client/src/index.css` (site), `client/src/styles/dashboard.css` (dashboard) |

Without `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` the site runs on in-memory demo data (`lib/catalog/demoSeed.ts`); unit tests always do.

## Environment variables

See `.env.example`.

| Variable | Used by | Secret |
| --- | --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | website, Netlify build, edge function | no (public, RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | local scripts and e2e only | **yes**, never on Netlify |
| `SUPABASE_DB_PASSWORD` or `SUPABASE_DB_URL` | `npm run db:migrate` | yes |
| `SITE_URL` | sitemap/robots (optional) | no |

`npm run build:netlify` ends with `scripts/check-bundle.ts`, which fails the build if a service-role key (value, `sb_secret_…`, or a JWT with role `service_role`) appears anywhere in `dist/public`, or if dashboard code leaks into the public entry chunk.

## Local development

```bash
npm install
npm run dev                # http://localhost:3000 (demo data if no .env.local)
```

With a local Supabase (needs Docker):

```bash
npm run db:start           # starts Postgres/Auth/Storage/REST and applies supabase/migrations
npx supabase status -o env # copy API_URL / ANON_KEY / SERVICE_ROLE_KEY / DB_URL into .env.local
npm run db:seed            # three Dubai demo properties (is_demo), with images
npm run admin:create -- you@example.com "a-strong-password"
```

## Tests

| Command | What |
| --- | --- |
| `npm run check` | TypeScript |
| `npm test` | smoke tests (jsdom, demo data) |
| `npm run test:e2e` | Playwright on Chromium desktop + Chromium iPhone, against a production build and the Supabase in `.env.local` |
| `npm run test:e2e:webkit` | same suite on WebKit (iPhone 13), inside the official Playwright Docker image; start the build first: `npx vite build && PORT=4173 npx tsx server/index.ts` |
| `npm run test:audit` | axe (serious/critical), no horizontal scroll at 360–430 px, palette-only colors, no console errors — every public page and every dashboard page |
| `npm run db:check-rls` | real anonymous and non-admin write attempts against Supabase; all must fail |
| `npm run check:bundle` | service-role key scan + dashboard code split check on `dist/public` |
| `npx tsx scripts/check-og.ts AK-102` | runs the link-preview edge function locally |
| `npx tsx scripts/screens.ts` | screenshots of every page into `docs/screens/final` |

E2E creates a temporary admin with the service-role key and deletes it afterwards. Point it at a local or staging Supabase, not production.

## Deploy (Netlify + Supabase)

1. **Supabase project** (once): create it, then apply the schema
   `SUPABASE_DB_PASSWORD=… VITE_SUPABASE_URL=… npm run db:migrate` (or `npx supabase link` + `npx supabase db push`).
2. **Auth settings** in the Supabase dashboard: Authentication → Sign In / Providers → turn off "Allow new users to sign up". Keep Email provider on.
3. **Demo data** (optional): `npm run db:seed`. Remove it later from the dashboard ("delete all demo properties").
4. **Check security**: `npm run db:check-rls` — every line must be ✓.
5. **Netlify**: connect the repo; `netlify.toml` already sets the build (`npm run build:netlify`), publish dir and the edge function. In Site configuration → Environment variables add only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
6. Deploy. The site stays **noindex** (`client/public/_headers`, `<meta name="robots">` in `client/index.html`, `indexing = false` in `config/site.ts`). At launch, flip all three.

## Admins

Public sign-up is off; admins are Supabase Auth users that also have a row in `public.admins`.

**From the Supabase dashboard**

1. Authentication → Users → Add user → Create new user: email + password, tick "Auto Confirm User".
2. SQL Editor → run:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'name@example.com';
   ```
3. The person signs in at `/admin`.

**From a terminal**: `npm run admin:create -- name@example.com "a-strong-password"` (creates the confirmed user and the admins row; without a password a random one is set and you change it in the Supabase dashboard). Needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

Remove an admin: `delete from public.admins where user_id = (select id from auth.users where email = '…');` (or delete the user).

## Backup

- **From the dashboard**: "نسخة احتياطية" (sidebar, or "المزيد" on a phone) downloads one JSON file with all properties (prices, images, amenities), options and settings.
- **Full database**: Supabase dashboard → Database → Backups (daily on paid plans), or `npx supabase db dump --db-url "$SUPABASE_DB_URL" -f backup.sql`.
- **Images**: stored in the `property-images` and `area-covers` buckets; the JSON backup lists their paths. `npm run storage:orphans` lists files that no row points to (add `--delete` to remove them).

## Notes

- Official logo files in `client/public/brand/aahh/` are copies from the brand package — do not redraw, recolor or edit them.
- Palette and fonts (Castoro + Noto Kufi Arabic) are defined in `client/src/index.css`; `npm run test:audit` fails on any color outside the palette.
- Images: the dashboard resizes in the browser to WebP 640/1080/1600 (plus a 1200 px JPEG used only for link previews) before upload.
