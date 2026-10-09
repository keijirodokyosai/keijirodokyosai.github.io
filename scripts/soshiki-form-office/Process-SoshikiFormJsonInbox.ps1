#Requires -Version 5.1
<#
  Scan 受付\<month>\json\ and export PDF when pdf\<stem>.pdf is missing.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ReceptionRoot,

    [switch]$MoveToProcessed,

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
}

foreach ($monthDir in Get-ChildItem -LiteralPath $receptionFull -Directory -ErrorAction SilentlyContinue) {
    $jsonDir = Join-Path $monthDir.FullName "json"
    if (-not (Test-Path -LiteralPath $jsonDir)) {
        continue
    }

    foreach ($jsonFile in Get-ChildItem -LiteralPath $jsonDir -Filter "*.json" -File) {
        $pdfPath = Get-SoshikiFormPdfPathForJson -JsonPath $jsonFile.FullName
        if (Test-Path -LiteralPath $pdfPath) {
            $stats.skipped++
            continue
        }

        try {
            if ($PreviewReceiptMail) {
                $previewScript = Join-Path $PSScriptRoot "Preview-SoshikiFormReceiptEmail.ps1"
                & $previewScript -JsonPath $jsonFile.FullName
            }

            Invoke-SoshikiFormPdf -JsonPath $jsonFile.FullName
            $stats.exported++
            if ($LogToWebRoot) {
                Write-SoshikiFormOfficeLog -WebRoot $webRoot -Message ("OK " + $jsonFile.Name)
            }

            if ($MoveToProcessed) {
                $processedDir = Join-Path $monthDir.FullName "processed"
                if (-not (Test-Path -LiteralPath $processedDir)) {
                    New-Item -ItemType Directory -Path $processedDir | Out-Null
                }
                Move-Item -LiteralPath $jsonFile.FullName -Destination (Join-Path $processedDir $jsonFile.Name)
            }
        }
        catch {
            $stats.failed++
            $msg = $jsonFile.Name + ": " + $_.Exception.Message
            Write-Warning $msg
            if ($LogToWebRoot) {
                Write-SoshikiFormOfficeLog -WebRoot $webRoot -Message ("FAIL " + $msg)
            }
        }
    }
}

$summary = "exported={0} skipped={1} failed={2}" -f $stats.exported, $stats.skipped, $stats.failed
if ($LogToWebRoot) {
    Write-SoshikiFormOfficeLog -WebRoot $webRoot -Message ("Inbox done: " + $summary)
}
Write-Output $summary
