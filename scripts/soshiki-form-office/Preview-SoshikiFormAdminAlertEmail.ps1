#Requires -Version 5.1
<#
  Admin alert mail draft (e.g. PDF export failure). Does not send.
  Requires 設定/soshiki-form-office-settings.json (AdminEmail, FromEmail).
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$JsonPath,

    [string]$ErrorMessage = "Test error message (preview only).",

    [string]$FailureStage = "PdfExport"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "SoshikiFormOffice.ps1")
. (Join-Path $PSScriptRoot "SoshikiFormAdminMail.ps1")

$draft = New-SoshikiFormAdminAlertMailDraft -JsonPath $JsonPath -ErrorMessage $ErrorMessage -FailureStage $FailureStage
if (-not $draft.To) {
    Write-Warning "AdminEmail missing (settings: $($draft.SettingsPath))"
}

Write-Output "From: $($draft.FromEmail)"
Write-Output "To: $($draft.To)"
Write-Output "Subject: $($draft.Subject)"
Write-Output "---"
Write-Output $draft.Body
