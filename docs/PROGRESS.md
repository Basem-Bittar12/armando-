# Progress

Resume guide: read `docs/FINISH_PLAN.md` (checklist), this file (what happened last), `docs/DECISIONS.md`.

Local Supabase: `cd /home/user/armando- && npx supabase start` (needs `SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io` here; dockerd must be running: `nohup dockerd &`).

## Log
- Pre-flight: checkpoint commit `d765460` pushed. Supabase/Netlify unreachable (see D1).
- Local Supabase stack running (Docker). Plan written.
- P1 done: migrations 0001-0004 apply on local stack; RLS attack check passes (docs/test-results/rls-local.txt); seed works offline (hero frames as fallback images); public site reads Supabase.
- P2 mostly done: login + guard + lazy admin chunk, inquiries, contact settings, backup, help. Remaining P2: orphan-files script, verify image upload/delete end-to-end in a real browser (covered by e2e next).
- Next: Playwright e2e (chromium on host; webkit via docker image mcr.microsoft.com/playwright:v1.56.1-noble, already pulled).
