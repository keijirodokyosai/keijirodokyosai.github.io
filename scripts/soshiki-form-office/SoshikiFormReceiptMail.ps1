# Receipt confirmation mail draft. Dot-source after SoshikiFormOffice.ps1.

function Get-SoshikiFormReceiptMailLabel {
    param([Parameter(Mandatory = $true)][string]$Key)
    switch ($Key) {
        "unionDefault" { return -join @([char]0x7D44, [char]0x5408) }
        "managerDefault" { return -join @([char]0x62C5, [char]0x5F53, [char]0x8005) }
        "sama" { return -join @([char]0x69D8) }
        "subjectPrefix" {
            return -join @(
                [char]0x7D44, [char]0x7E54, [char]0x5171, [char]0x6E08, [char]0x57, [char]0x45, [char]0x42,
                [char]0x53D7, [char]0x4ED8, [char]0x5F
            )
        }
        "lineReceived" {
            return -join @(
                [char]0x7D44, [char]0x7E54, [char]0x5171, [char]0x6E08, [char]0x306E, [char]0x20,
                [char]0x57, [char]0x45, [char]0x42, [char]0x20,
                [char]0x7533, [char]0x8FBC, [char]0x3092, [char]0x53D7, [char]0x3051, [char]0x4ED8, [char]0x3051, [char]0x307E, [char]0x3057, [char]0x305F, [char]0x3002
            )
        }
        "labelReceiptId" { return -join @([char]0x53D7, [char]0x4ED8, [char]0x20, [char]0x49, [char]0x44, [char]0x3A) }
        "labelKyosaiName" { return -join @([char]0x5171, [char]0x6E08, [char]0x4F1A, [char]0x3A) }
        "labelAppDate" { return -join @([char]0x7533, [char]0x8FBC, [char]0x65E5, [char]0x3A) }
        "footerSignLine1" {
            return -join @(
                [char]0x4EAC, [char]0x6ECB, [char]0x52B4, [char]0x50CD, [char]0x7D44, [char]0x5408, [char]0x5171, [char]0x6E08, [char]0x4F1A
            )
        }
        "footerSignLine2" {
            return -join @([char]0x4E8B, [char]0x52D9, [char]0x5C40)
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

    $officeSettings = Get-SoshikiFormOfficeSettings -WebRoot $layout.WebRoot
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

    $fromEmail = $officeSettings.FromEmail
    $sama = Get-SoshikiFormReceiptMailLabel -Key "sama"
    $subject = "$(Get-SoshikiFormReceiptMailLabel -Key 'subjectPrefix')${dateForSubject}"
    $body = @(
        "$managerName $sama"
        ""
        (Get-SoshikiFormReceiptMailLabel -Key "lineReceived")
        ""
        "$(Get-SoshikiFormReceiptMailLabel -Key 'labelReceiptId') $receiptId"
        "$(Get-SoshikiFormReceiptMailLabel -Key 'labelKyosaiName') $unionName"
        "$(Get-SoshikiFormReceiptMailLabel -Key 'labelAppDate') $appDateText"
        ""
        (Get-SoshikiFormReceiptMailLabel -Key "footerSignLine1")
        (Get-SoshikiFormReceiptMailLabel -Key "footerSignLine2")
    ) -join "`r`n"

    return @{
        To            = $to
        Bcc           = $fromEmail
        FromEmail     = $fromEmail
        Subject       = $subject
        Body          = $body
        ReceiptId     = $receiptId
        KyosaikaiCode = $code
        ContactsPath  = (Get-SoshikiFormUnionContactsPath -WebRoot $layout.WebRoot)
        SettingsPath  = $officeSettings.SettingsPath
    }
}
