# Local preview: start Jekyll (background), print URL, then exit
# Stop: .\scripts\serve-open.ps1 -Stop
param(
    [switch]$Stop
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot '_jekyll-common.ps1')

$repoRoot = Get-RepoRoot
Set-Location $repoRoot

if ($Stop) {
    Stop-JekyllServer -RepoRoot $repoRoot
    Write-Host 'Jekyll stopped (if it was running on port 4000).'
    return
}

$pageUrl = 'http://127.0.0.1:4000/soshiki-form-enter.html'
$healthUrl = 'http://127.0.0.1:4000/'

if (Test-JekyllUp -HealthUrl $healthUrl) {
    Write-Host 'Jekyll is already running.'
}
else {
    Write-Host 'Starting Jekyll (background)...'
    $proc = Start-JekyllBackground -RepoRoot $repoRoot
    Write-Host "  PID: $($proc.Id)"

    Write-Host 'Waiting for Jekyll (up to 60s)...'
    if (-not (Wait-ForJekyll -Url $healthUrl)) {
        Stop-JekyllServer -RepoRoot $repoRoot
        throw 'Jekyll did not respond on port 4000.'
    }
}

Write-Host ''
Write-Host $pageUrl
Write-Host ''
Write-Host 'Open in Cursor Browser: Ctrl+click the URL above.'
Write-Host ''
Write-Host 'Done.'
Write-Host 'Stop Jekyll: .\scripts\serve-open.ps1 -Stop'
