# Start local Supabase using the Supabase CLI
# Run from the repo root: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\start-local-supabase.ps1`

# Check prerequisites
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is required but was not found. Install Docker Desktop and ensure it's running."
    exit 1
}

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "Supabase CLI not found."
    Write-Host "Install: https://supabase.com/docs/guides/cli#installation"
    Write-Host "On Windows you can use: npm i -g supabase or scoop/chocolatey if preferred."
    exit 1
}

Write-Host "Starting local Supabase (this will start Docker containers). Logs will stream to this console." -ForegroundColor Cyan
Write-Host "If you need to stop, press Ctrl+C and run: supabase stop" -ForegroundColor Yellow

# Start Supabase (delegates to Docker Compose managed by the CLI)
supabase start
