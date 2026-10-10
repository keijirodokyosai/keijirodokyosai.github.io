#Requires -Version 5.1
<#
  Scan 受付\<month>\json\ and export PDF when pdf\<stem>.pdf is missing.
  On success, move JSON to 処理済み\ (unless -KeepInJson).
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ReceptionRoot,

    [switch]$KeepInJson,

    [switch]$LogToWebRoot,

    [switch]$PreviewReceiptMail
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "SoshikiFormOffice.ps1")

$receptionFull = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($ReceptionRoot)
$expected = Get-SoshikiReceptionFolderName
if ((Split-Path -Leaf $receptionFull) -ne $expected) {
    throw "ReceptionRoot must be the folder named $expected (got: $(Split-Path -Leaf $receptionFull))"
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

foreach ($monthDir in Get-ChildItem -LiteralPath $receptionFull -Directory -ErrorAction SilentlyContinue) {
    $jsonDir = Join-Path $monthDir.FullName "json"
    if (-not (Test-Path -LiteralPath $jsonDir)) {
        continue
    }

    foreach ($jsonFile in Get-ChildItem -LiteralPath $jsonDir -Filter "*.json" -File) {
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
}

$summary = "exported={0} skipped={1} failed={2} missing={3}" -f $stats.exported, $stats.skipped, $stats.failed, $stats.missing
if ($LogToWebRoot) {
    Write-SoshikiFormOfficeLog -WebRoot $webRoot -Message ("Inbox done: " + $summary)
}
Write-Output $summary
