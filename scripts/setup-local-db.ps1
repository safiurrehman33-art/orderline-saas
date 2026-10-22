# Creates the OrderLine role + database on a local PostgreSQL install.
# Usage (from repo root):
#   .\scripts\setup-local-db.ps1
#   .\scripts\setup-local-db.ps1 -PostgresPassword "your-postgres-password"

param(
  [string]$PostgresUser = "postgres",
  [string]$PostgresPassword,
  [string]$AppUser = "orderline",
  [string]$AppPassword = "orderline",
  [string]$AppDb = "orderline",
  [string]$HostName = "localhost",
  [int]$Port = 5432
)

$ErrorActionPreference = "Stop"

$psqlCandidates = @(
  "C:\Program Files\PostgreSQL\18\bin\psql.exe",
  "C:\Program Files\PostgreSQL\17\bin\psql.exe",
  "C:\Program Files\PostgreSQL\16\bin\psql.exe"
)
$psql = $psqlCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $psql) {
  throw "psql.exe not found. Install PostgreSQL or add psql to PATH."
}

if (-not $PostgresPassword) {
  $secure = Read-Host "Enter password for PostgreSQL user '$PostgresUser'" -AsSecureString
  $BSTR = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  $PostgresPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

$env:PGPASSWORD = $PostgresPassword

function Invoke-Psql([string]$Sql) {
  & $psql -v ON_ERROR_STOP=1 -U $PostgresUser -h $HostName -p $Port -d postgres -c $Sql
  if ($LASTEXITCODE -ne 0) {
    throw "psql failed while running: $Sql"
  }
}

Write-Host "Using $psql"
Write-Host "Ensuring role '$AppUser' and database '$AppDb' exist..."

$roleExists = & $psql -U $PostgresUser -h $HostName -p $Port -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname = '$AppUser'"
if ($roleExists -ne "1") {
  Invoke-Psql "CREATE ROLE $AppUser LOGIN PASSWORD '$AppPassword';"
  Write-Host "Created role $AppUser"
} else {
  Invoke-Psql "ALTER ROLE $AppUser WITH LOGIN PASSWORD '$AppPassword';"
  Write-Host "Updated password for role $AppUser"
}

$dbExists = & $psql -U $PostgresUser -h $HostName -p $Port -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$AppDb'"
if ($dbExists -ne "1") {
  Invoke-Psql "CREATE DATABASE $AppDb OWNER $AppUser;"
  Write-Host "Created database $AppDb"
} else {
  Write-Host "Database $AppDb already exists"
}

Invoke-Psql "GRANT ALL PRIVILEGES ON DATABASE $AppDb TO $AppUser;"
& $psql -v ON_ERROR_STOP=1 -U $PostgresUser -h $HostName -p $Port -d $AppDb -c "GRANT ALL ON SCHEMA public TO $AppUser; ALTER SCHEMA public OWNER TO $AppUser;"
if ($LASTEXITCODE -ne 0) {
  throw "Failed granting schema privileges"
}

$env:PGPASSWORD = $AppPassword
& $psql -U $AppUser -h $HostName -p $Port -d $AppDb -c "SELECT current_user, current_database();"
if ($LASTEXITCODE -ne 0) {
  throw "App user login test failed"
}

Write-Host ""
Write-Host "Success. Your .env should use:"
Write-Host "DATABASE_URL=`"postgresql://${AppUser}:${AppPassword}@${HostName}:${Port}/${AppDb}?schema=public`""
Write-Host ""
Write-Host "Next: npm run db:push"
