#Requires -Version 5.1
<#
  json と同じファイル名 stem で、同じ受付フォルダ配下の pdf\ に PDF を出力する。
  -TemplatePath 省略時: json から 受付 の親フォルダを求め、templateFileName（cell-map）を読む。
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$JsonPath,

    [string]$TemplatePath = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "SoshikiFormOfficePaths.ps1")

$jsonFull = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($JsonPath)
if (-not (Test-Path -LiteralPath $jsonFull)) {
    throw "JSON not found: $jsonFull"
}

if ($TemplatePath) {
    $templateFull = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($TemplatePath)
    if (-not (Test-Path -LiteralPath $templateFull)) {
        throw "Template not found: $templateFull"
    }
} else {
    $templateFull = Get-SoshikiFormExcelTemplatePath -JsonPath $jsonFull -ScriptRoot $PSScriptRoot
    Write-Host "Template (auto): $templateFull"
}

$pdfPath = Get-SoshikiFormPdfPathForJson -JsonPath $jsonFull

$fillScript = Join-Path $PSScriptRoot "Fill-SoshikiFormExcel.ps1"
& $fillScript -JsonPath $jsonFull -TemplatePath $templateFull -OutputPdfPath $pdfPath
