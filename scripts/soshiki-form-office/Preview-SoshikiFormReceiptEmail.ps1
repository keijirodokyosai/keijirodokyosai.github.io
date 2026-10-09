#Requires -Version 5.1
<#
  Build receipt confirmation mail draft (does not send).
  Requires OneDrive settings/union-contacts.json under the WEB root.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$JsonPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-SoshikiFormReceiptMailLabel {
    param([Parameter(Mandatory = $true)][string]$Key)
    switch ($Key) {
        "unionDefault" { return -join @([char]0x7D44, [char]0x5408) }
        "managerDefault" { return -join @([char]0x62C5, [char]0x5F53, [char]0x8005) }
        "sama" { return -join @([char]0x69D8) }
        "subjectPrefix" {
            return -join @(
                [char]0x7D44, [char]0x7E54, [char]0x5171, [char]0x6E08, 0x57, 0x45, 0x42,
                [char]0x7533, [char]0x8FBC, 0x5F
            )
        }
        "lineReceived" {
            return -join @(
                [char]0x7D44, [char]0x7E54, [char]0x5171, [char]0x6E08, [char]0x306E, 0x20,
                0x57, 0x45, 0x42, 0x20,
                [char]0x7533, [char]0x8FBC, [char]0x3092, [char]0x53D7, [char]0x3051, [char]0x4ED8, [char]0x3051, [char]0x307E, [char]0x3057, [char]0x305F, [char]0x3002
            )
        }
        "labelReceiptId" { return -join @([char]0x53D7, [char]0x4ED8, 0x20, 0x49, 0x44, 0x3A) }
        "labelUnion" { return -join @([char]0x7D44, [char]0x5408, 0x3A) }
        "labelAppDate" { return -join @([char]0x7533, [char]0x8FBC, [char]0x65E5, 0x3A) }
        "footerNoPdf" {
            return -join @(
                0x28,
                [char]0x672C, [char]0x30E1, [char]0x30FC, [char]0x30EB, [char]0x306B, 0x20, 0x50, 0x44, 0x46, 0x20,
                [char]0x306F, [char]0x6DFB, [char]0x4ED8, [char]0x3057, [char]0x307E, [char]0x305B, [char]0x3093, [char]0x3002,
                [char]0x4E8B, [char]0x52D9, [char]0x7528, 0x20, 0x50, 0x44, 0x46, 0x20,
                [char]0x306F, 0x20, 0x4F, 0x6E, 0x65, 0x44, 0x72, 0x69, 0x76, 0x65, 0x20,
                [char]0x4E0A, [char]0x306E, 0x20, 0x70, 0x64, 0x66, 0x20,
                [char]0x30D5, [char]0x30A9, [char]0x30EB, [char]0x30C0, [char]0x306B, [char]0x4FDD, [char]0x5B58, [char]0x3055, [char]0x308C, [char]0x307E, [char]0x3059, [char]0x3002, 0x29
            )
        }
        default { throw "Unknown mail label: $Key" }
    }
}

function New-SoshikiFormReceiptMailDraft {
    param([Parameter(Mandatory = $true)][string]$JsonPath)

    $layout = Get-SoshikiFormWebRootFromJsonPath -JsonPath $JsonPath
    $fileInfo = Get-SoshikiFormJsonFileInfo -JsonPath $JsonPath
    $submission = Get-Content -LiteralPath $layout.JsonFull -Raw -Encoding UTF8 | ConvertFrom-Json
    $code = [string]$submission.KyosaikaiCode
    if (-not $code) {
        throw "submission.KyosaikaiCode is missing"
    }

    $contact = Get-SoshikiFormUnionContact -WebRoot $layout.WebRoot -KyosaikaiCode $code
    $receiptId = $fileInfo.ReceiptId
    if (-not $receiptId) {
        throw "Cannot parse receipt id from json file name"
    }

    $appDate = $submission.ApplicationDate
    $appDateText = ""
    if ($appDate) {
        $appDateText = ("{0}/{1}/{2}" -f $appDate.Year, $appDate.Month, $appDate.Day)
    }

    $unionName = $fileInfo.UnionFileSegment
    if (-not $unionName) {
        $unionName = Get-SoshikiFormReceiptMailLabel -Key "unionDefault"
    }

    $dateForSubject = $fileInfo.FileNameDate
    if (-not $dateForSubject) {
        $dateForSubject = (Get-Date -Format "yyyyMMdd")
    }

    $managerName = Get-SoshikiFormReceiptMailLabel -Key "managerDefault"
    $to = $null
    if ($null -ne $contact) {
        if ($contact.ManagerFamilyName) {
            $managerName = [string]$contact.ManagerFamilyName
        }
        $to = $contact.ManagerEmail
    }

    $sama = Get-SoshikiFormReceiptMailLabel -Key "sama"
    $subject = "$(Get-SoshikiFormReceiptMailLabel -Key 'subjectPrefix')${unionName}_${dateForSubject}"
    $body = @(
        "$managerName $sama"
        ""
        (Get-SoshikiFormReceiptMailLabel -Key "lineReceived")
        ""
        "$(Get-SoshikiFormReceiptMailLabel -Key 'labelReceiptId') $receiptId"
        "$(Get-SoshikiFormReceiptMailLabel -Key 'labelUnion') $unionName"
        "$(Get-SoshikiFormReceiptMailLabel -Key 'labelAppDate') $appDateText"
        ""
        (Get-SoshikiFormReceiptMailLabel -Key "footerNoPdf")
    ) -join "`r`n"

    return @{
        To            = $to
        Subject       = $subject
        Body          = $body
        ReceiptId     = $receiptId
        KyosaikaiCode = $code
        ContactsPath  = (Get-SoshikiFormUnionContactsPath -WebRoot $layout.WebRoot)
    }
}

. (Join-Path $PSScriptRoot "SoshikiFormOffice.ps1")

$draft = New-SoshikiFormReceiptMailDraft -JsonPath $JsonPath
if (-not $draft.To) {
    Write-Warning "No ManagerEmail for KyosaikaiCode=$($draft.KyosaikaiCode) (contacts: $($draft.ContactsPath))"
}

Write-Output "To: $($draft.To)"
Write-Output "Subject: $($draft.Subject)"
Write-Output "---"
Write-Output $draft.Body
