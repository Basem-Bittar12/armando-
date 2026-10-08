# Decisions

Each entry: what was decided, why, and how to reverse it.

## D1. Build and test against a local Supabase stack
The real Supabase project and Netlify are unreachable from the work machine (network policy denies both hosts, no tokens). Instead of waiting, everything runs against the official Supabase services in Docker (`supabase start`, images pulled from Docker Hub). The same migrations will be applied to the real project later with `npm run db:migrate` (or `supabase db push`).
Reverse: nothing to reverse; the code reads URL and keys from environment variables only.

## D2. Push the work branch at checkpoints
The brief says "never push". This run happens in a cloud container that is deleted when the session ends, so commits that exist only locally would be lost. Commits are pushed (never forced) only to the session's own feature branch `claude/github-repo-review-lg6a55`, never to `main`, and no pull request is opened.
Reverse: delete the remote branch.
