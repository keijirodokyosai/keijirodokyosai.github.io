#Requires -Version 5.1
<#
  Build receipt confirmation mail draft (does not send).
  Requires OneDrive settings/union-contacts.json and soshiki-form-office-settings.json under the WEB root.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$JsonPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "SoshikiFormOffice.ps1")
. (Join-Path $PSScriptRoot "SoshikiFormReceiptMail.ps1")

$draft = New-SoshikiFormReceiptMailDraft -JsonPath $JsonPath
if (-not $draft.To) {
    Write-Warning "No ManagerEmail for KyosaikaiCode=$($draft.KyosaikaiCode) (contacts: $($draft.ContactsPath))"
}

Write-Output "From: $($draft.FromEmail)"
Write-Output "To: $($draft.To)"
Write-Output "Bcc: $($draft.Bcc)"
Write-Output "Subject: $($draft.Subject)"
Write-Output "---"
Write-Output $draft.Body
