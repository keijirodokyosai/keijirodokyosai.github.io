#Requires -Version 5.1
<#
  One submission JSON -> PDF (same stem under month\pdf\).
  Excel fill/export is implemented in csharp/ (SoshikiFormPdf).
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$JsonPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "Invoke-SoshikiFormPdf.ps1")
Invoke-SoshikiFormPdf -JsonPath $JsonPath
