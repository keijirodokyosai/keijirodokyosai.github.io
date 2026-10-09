#Requires -Version 5.1
<#
  json と同じファイル名 stem で、同じ受付フォルダ配下の pdf\ に PDF を出力する。
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$JsonPath,

    [Parameter(Mandatory = $true)]
    [string]$TemplatePath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$jsonFull = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($JsonPath)
if (-not (Test-Path -LiteralPath $jsonFull)) {
    throw "JSON not found: $jsonFull"
}

$jsonDir = Split-Path -Parent $jsonFull
$receptionDir = Split-Path -Parent $jsonDir
$pdfDir = Join-Path $receptionDir "pdf"
$stem = [System.IO.Path]::GetFileNameWithoutExtension($jsonFull)
$pdfPath = Join-Path $pdfDir ($stem + ".pdf")

$fillScript = Join-Path $PSScriptRoot "Fill-SoshikiFormExcel.ps1"
& $fillScript -JsonPath $jsonFull -TemplatePath $TemplatePath -OutputPdfPath $pdfPath
