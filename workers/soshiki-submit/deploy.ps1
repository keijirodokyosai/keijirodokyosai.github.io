# Requires: CLOUDFLARE_API_TOKEN (user env)
# Requires: Node.js (npm). See README if npm is missing.
Set-Location $PSScriptRoot
$ErrorActionPreference = "Stop"

$nodeDirs = @(
    "$env:ProgramFiles\nodejs"
    "$env:LOCALAPPDATA\Programs\node"
)
foreach ($dir in $nodeDirs) {
    if (Test-Path -LiteralPath "$dir\node.exe") {
        if ($env:Path -notlike "*$dir*") {
            $env:Path = "$dir;$env:Path"
        }
        break
    }
}

$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
    foreach ($dir in $nodeDirs) {
        $npmCmd = Join-Path $dir "npm.cmd"
        if (Test-Path -LiteralPath $npmCmd) {
            $npm = @{ Source = $npmCmd }
            break
        }
    }
}

if (-not $npm) {
    Write-Host ""
    Write-Host "npm not found. Install Node.js LTS, then restart the terminal." -ForegroundColor Yellow
    Write-Host "  winget install OpenJS.NodeJS.LTS"
    Write-Host ""
    exit 1
}

$npmPath = if ($npm.Source) { $npm.Source } else { $npm }

if (-not (Test-Path "node_modules\wrangler")) {
    & $npmPath install
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

& $npmPath run deploy
exit $LASTEXITCODE
