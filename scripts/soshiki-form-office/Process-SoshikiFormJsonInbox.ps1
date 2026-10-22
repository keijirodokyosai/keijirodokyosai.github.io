#Requires -Version 5.1
<#
  Scan 受付\*\json\ (recursive) and export PDF when PDF\<stem>.pdf is missing.
  On success, move JSON to 処理済\ (unless -KeepInJson).
#>
[CmdletBinding()]
param(
    [string]$ReceptionRoot = "",

    [switch]$KeepInJson,

    [switch]$LogToWebRoot,

    [switch]$PreviewReceiptMail
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "SoshikiFormOffice.ps1")

$receptionFull = Resolve-SoshikiFormReceptionRoot -ReceptionRoot $ReceptionRoot

if (-not (Test-Path -LiteralPath $receptionFull)) {
    throw "Reception folder not found: $receptionFull"
}

$webRoot = Split-Path -Parent $receptionFull
if ($LogToWebRoot) {
    Write-SoshikiFormOfficeLog -WebRoot $webRoot -Message "Inbox start: $receptionFull"
}

$stats = @{
    exported = 0
    skipped  = 0
    failed   = 0
    missing  = 0
}

$monthDirs = @(Get-ChildItem -LiteralPath $receptionFull -Directory -ErrorAction SilentlyContinue)
$jsonFiles = @(Get-SoshikiFormInboxJsonFiles -ReceptionFull $receptionFull)
$pendingJsonCount = $jsonFiles.Count

foreach ($jsonFile in $jsonFiles) {
    try {
        $result = Invoke-SoshikiFormJsonInboxFile `
            -JsonPath $jsonFile.FullName `
            -PreviewReceiptMail:$PreviewReceiptMail `
            -KeepInJson:$KeepInJson `
            -LogToWebRoot:$LogToWebRoot

        switch ($result) {
            "exported" { $stats.exported++ }
            "skipped" { $stats.skipped++ }
            "missing" { $stats.missing++ }
            default { $stats.skipped++ }
        }
    }
    catch {
        $stats.failed++
        Write-Warning $_.Exception.Message
    }
}

$summary = "exported={0} skipped={1} failed={2} missing={3}" -f $stats.exported, $stats.skipped, $stats.failed, $stats.missing
$detail = "reception={0} monthDirs={1} jsonInInbox={2} {3}" -f $receptionFull, $monthDirs.Count, $pendingJsonCount, $summary
if ($LogToWebRoot) {
    Write-SoshikiFormOfficeLog -WebRoot $webRoot -Message ("Inbox done: " + $detail)
}
if ($pendingJsonCount -eq 0 -and $stats.exported -eq 0 -and $stats.skipped -eq 0 -and $stats.failed -eq 0) {
    $settingsHint = Get-SoshikiFormSettingsFolderName
    Write-Warning (@(
            "No *.json under reception\*\json\."
            " ReceptionRoot=$receptionFull"
            " monthDirs=$($monthDirs.Count) (if 0, sync OneDrive or use 'Always keep on this device' on 受付)."
            " Or fix ReceptionRoot in ${settingsHint}/soshiki-form-office-settings.json."
            " Diagnose: .\Show-SoshikiFormReceptionLayout.ps1"
        ) -join " ")
}
Write-Output $detail
