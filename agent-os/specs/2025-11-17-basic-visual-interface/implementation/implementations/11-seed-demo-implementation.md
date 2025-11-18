# Implementation: Seed Demo Data for Achievements

## What I implemented

- Added a small, portable seed script at `scripts/seed-achievements.js`.
  - If `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set, the script will insert sample rows into the `achievement_log` table using the Supabase client.
  - If environment variables are missing, the script writes a local fallback file at `agent-os/specs/2025-11-17-basic-visual-interface/implementation/seed-demo.json` containing sample achievements for UI testing.

## How to run

1. Without Supabase (local demo file):

```powershell
node scripts/seed-achievements.js
```

This will create `agent-os/specs/2025-11-17-basic-visual-interface/implementation/seed-demo.json`.

2. With Supabase configured:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL = 'https://your-supabase-url'
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = 'your-anon-key'
node scripts/seed-achievements.js
```

This will attempt to insert two sample rows into the `achievement_log` table. Ensure the table exists with compatible columns (`id`, `text`, `points`, `completed_at`).

## Acceptance

- Developers can run the script to get demo achievement data for UI testing.
- The app's `AchievementsPlaceholder` will show an empty state when there is no data; with the local fallback file present, developers can inspect the JSON when Supabase is not available.
