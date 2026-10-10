#Requires -Version 5.1
<#
  Export PDF for the first (or -All) json under 受付\*\json\ without typing OneDrive paths.
  Same as Export-SoshikiFormPdfFromJson.ps1 after resolving ReceptionRoot.
#>
[CmdletBinding()]
param(
    [string]$ReceptionRoot = "",

    [switch]$All
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "SoshikiFormOffice.ps1")

$receptionFull = Resolve-SoshikiFormReceptionRoot -ReceptionRoot $ReceptionRoot
$jsonFiles = @(Get-SoshikiFormInboxJsonFiles -ReceptionFull $receptionFull)
if ($jsonFiles.Count -eq 0) {
    throw "No json under inbox: $receptionFull\*\json\ (run .\Show-SoshikiFormReceptionLayout.ps1)"
}

$targets = if ($All) { $jsonFiles } else { @($jsonFiles[0]) }
foreach ($j in $targets) {
    Write-Output ("PDF from: " + $j.FullName)
    Invoke-SoshikiFormPdf -JsonPath $j.FullName
}
