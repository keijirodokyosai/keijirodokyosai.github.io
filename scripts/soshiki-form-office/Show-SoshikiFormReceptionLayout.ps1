#Requires -Version 5.1
<#
  Show resolved ReceptionRoot and where *.json files are (under *\json\).
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "SoshikiFormOffice.ps1")

Write-Output "--- Resolved ---"
try {
    $reception = Resolve-SoshikiFormReceptionRoot
    Write-Output "ReceptionRoot=$reception"
    Write-Output ("Exists=" + (Test-Path -LiteralPath $reception))
    if (Test-Path -LiteralPath $reception) {
        $monthDirs = @(Get-ChildItem -LiteralPath $reception -Directory -Force -ErrorAction SilentlyContinue)
        Write-Output ("monthDirs=" + $monthDirs.Count)
        $jsonFiles = @(Get-SoshikiFormInboxJsonFiles -ReceptionFull $reception)
        Write-Output ("jsonInInbox=" + $jsonFiles.Count)
        foreach ($j in $jsonFiles) {
            Write-Output ("  " + $j.FullName)
        }
    }
}
catch {
    Write-Output ("Resolve failed: " + $_.Exception.Message)
}

Write-Output "--- All candidates ---"
foreach ($candidate in Get-SoshikiFormDiscoveredReceptionRootCandidates) {
    $exists = Test-Path -LiteralPath $candidate
    $jsonCount = 0
    if ($exists) {
        $jsonCount = @(Get-SoshikiFormInboxJsonFiles -ReceptionFull $candidate).Count
    }
    Write-Output ("candidate exists=$exists json=$jsonCount $candidate")
}

$settingsPath = Find-SoshikiFormOfficeSettingsFilePath
if ($settingsPath) {
    Write-Output "settingsFile=$settingsPath"
}
