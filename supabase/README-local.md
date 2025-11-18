# Local Supabase Setup (for development)

This project includes SQL migrations under `supabase/migrations/`.
These instructions will help you run a local Supabase instance and apply the existing SQL schema.

Prerequisites
- Docker Desktop (running)
- Supabase CLI (`supabase`) installed. Installation docs: https://supabase.com/docs/guides/cli#installation
- Optionally: `psql` Postgres client (used by the migration script). If you don't have `psql`, you can run SQL via Docker exec into the DB container.

Quickstart
1. Start Supabase

   From the repo root run:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\start-local-supabase.ps1
   ```

   This runs `supabase start` which brings up the local Supabase stack in Docker.

2. Apply migrations

   Open a new terminal (keep the `supabase start` logs running) and run:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\apply-local-migrations.ps1
   ```

   By default this script assumes the local Postgres is reachable at:
   `postgresql://postgres:postgres@localhost:54322/postgres` (Supabase CLI default).

   If your local DB uses a different connection string, set the `SUPABASE_DB_URL` environment variable before running the script.

How it works
- `supabase start` (Supabase CLI) runs a Docker Compose stack that contains Postgres and Supabase services.
- The migration script attempts to use `psql` to connect to the DB and run `supabase/migrations/001_initial_schema.sql`.
- If you don't have `psql`, you can instead exec into the DB container and run psql there. The container name is typically `supabase-db` when using the CLI, but verify with `docker ps`.

Troubleshooting
- If `supabase` CLI is not found: install via `npm i -g supabase` or follow the Supabase docs for other installers.
- If Docker containers fail to start: open Docker Desktop and check logs; ensure virtualization is enabled.
- If migrations fail: inspect the SQL file `supabase/migrations/001_initial_schema.sql` and the `supabase start` logs for any DB errors.

Notes
- These scripts aim to be helpful for Windows/PowerShell users. Adjust the commands if using Bash/macOS.
- After you're done, stop the local Supabase stack with `supabase stop` (in the same terminal where you ran `supabase start`, or run it separately if the CLI is installed).
