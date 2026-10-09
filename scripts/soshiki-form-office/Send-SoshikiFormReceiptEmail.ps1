#Requires -Version 5.1
<#
  Send receipt confirmation via Outlook. Use -Send to actually send; default opens draft in Outlook.
  BCC is the same as FromEmail (office settings) so the sender gets a copy.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$JsonPath,

    [switch]$Send
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "SoshikiFormOffice.ps1")
. (Join-Path $PSScriptRoot "SoshikiFormReceiptMail.ps1")
. (Join-Path $PSScriptRoot "Invoke-SoshikiFormOutlook.ps1")

$draft = New-SoshikiFormReceiptMailDraft -JsonPath $JsonPath
if (-not $draft.To) {
    throw "No ManagerEmail for KyosaikaiCode=$($draft.KyosaikaiCode) (contacts: $($draft.ContactsPath))"
}

Send-SoshikiFormOutlookMessage `
    -To $draft.To `
    -Subject $draft.Subject `
    -Body $draft.Body `
    -FromEmail $draft.FromEmail `
    -Bcc $draft.Bcc `
    -Send:$Send
