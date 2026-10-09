#Requires -Version 5.1
<#
  Send admin alert via Outlook. Use -Send to actually send; default opens draft in Outlook.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$JsonPath,

    [Parameter(Mandatory = $true)]
    [string]$ErrorMessage,

    [string]$FailureStage = "PdfExport",

    [switch]$Send
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "SoshikiFormOffice.ps1")
. (Join-Path $PSScriptRoot "SoshikiFormAdminMail.ps1")
. (Join-Path $PSScriptRoot "Invoke-SoshikiFormOutlook.ps1")

$draft = New-SoshikiFormAdminAlertMailDraft -JsonPath $JsonPath -ErrorMessage $ErrorMessage -FailureStage $FailureStage
Send-SoshikiFormOutlookMessage -To $draft.To -Subject $draft.Subject -Body $draft.Body -Send:$Send
