# Apply SQL migrations to the local Supabase/Postgres instance
# Usage: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\apply-local-migrations.ps1`

# Default connection string used by Supabase CLI locally (override with SUPABASE_DB_URL env var)
$envConn = $env:SUPABASE_DB_URL
if ([string]::IsNullOrWhiteSpace($envConn)) {
    $conn = "postgresql://postgres:postgres@localhost:54322/postgres"
} else {
    $conn = $envConn
}

$migrationFile = Join-Path $PSScriptRoot "..\supabase\migrations\001_initial_schema.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Error "Migration file not found: $migrationFile"
    exit 1
}

# Check for psql
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Warning "psql command-line client not found. You can either install psql (Postgres client) or run the SQL inside the running Supabase DB container."
    Write-Host "If you have Docker, you can run:" -ForegroundColor Cyan
    Write-Host "  docker exec -i <db-container> psql '$conn' -f - < $migrationFile" -ForegroundColor Yellow
    Write-Host "(Replace <db-container> with the name of the Postgres container created by the Supabase CLI, e.g. \`supabase-db\`.)" -ForegroundColor Yellow
    exit 1
}

# Wait for DB to be available
$max = 30
$connected = $false
for ($i=1; $i -le $max; $i++) {
    Write-Host "Checking DB connection ($i/$max)..."
    & psql $conn -c "SELECT 1;" > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        $connected = $true
        break
    }
    Start-Sleep -Seconds 2
}

if (-not $connected) {
    Write-Error "Unable to connect to database at $conn. Ensure Supabase is running and ports are accessible."
    exit 1
}

Write-Host "Applying migration file: $migrationFile" -ForegroundColor Cyan
psql $conn -f $migrationFile
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to apply migrations (psql exit code $LASTEXITCODE)"
    exit $LASTEXITCODE
}

Write-Host "Migrations applied successfully." -ForegroundColor Green
