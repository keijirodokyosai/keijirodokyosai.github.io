# Shared helpers for Jekyll preview scripts
Set-StrictMode -Version Latest

function Get-RepoRoot {
    return (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
}

function Get-JekyllPidFile {
    param([string]$RepoRoot)
    return Join-Path $RepoRoot '.jekyll-serve.pid'
}

function Test-JekyllUp {
    param([string]$HealthUrl = 'http://127.0.0.1:4000/')

    try {
        $null = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 2
        return $true
    }
    catch {
        return $false
    }
}

function Wait-ForJekyll {
    param(
        [string]$Url = 'http://127.0.0.1:4000/',
        [int]$MaxSeconds = 60
    )

    for ($i = 1; $i -le $MaxSeconds; $i++) {
        if (Test-JekyllUp -HealthUrl $Url) {
            return $true
        }
        Start-Sleep -Seconds 1
    }

    return $false
}

function Start-JekyllBackground {
    param([string]$RepoRoot)

    if (-not (Get-Command jekyll -ErrorAction SilentlyContinue)) {
        throw 'jekyll not found. Install Ruby and Jekyll first.'
    }

    $pidFile = Get-JekyllPidFile -RepoRoot $RepoRoot
    $proc = Start-Process -FilePath 'jekyll' -ArgumentList 'serve' -WorkingDirectory $RepoRoot -PassThru -WindowStyle Hidden
    $proc.Id | Set-Content -Path $pidFile -Encoding ascii
    return $proc
}

function Stop-JekyllServer {
    param([string]$RepoRoot)

    $pidFile = Get-JekyllPidFile -RepoRoot $RepoRoot
    if (Test-Path $pidFile) {
        $storedPid = Get-Content -Path $pidFile -ErrorAction SilentlyContinue
        if ($storedPid) {
            Stop-Process -Id $storedPid -Force -ErrorAction SilentlyContinue
        }
        Remove-Item -Path $pidFile -Force -ErrorAction SilentlyContinue
    }

    $conn = Get-NetTCPConnection -LocalPort 4000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}
