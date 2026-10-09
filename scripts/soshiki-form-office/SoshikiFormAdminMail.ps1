# Admin alert mail draft (PDF failure etc.). Dot-source after SoshikiFormOffice.ps1.

function Get-SoshikiFormAdminMailLabel {
    param([Parameter(Mandatory = $true)][string]$Key)
    switch ($Key) {
        "subjectPrefix" {
            return -join @(
                [char]0x7D44, [char]0x7E54, [char]0x5171, [char]0x6E08, 0x57, 0x45, 0x42,
                [char]0x7533, [char]0x8FBC, 0x5F, [char]0x30A8, [char]0x30E9, [char]0x30FC, 0x5F
            )
        }
        "headlinePdf" {
            return -join @(
                [char]0x4E8B, [char]0x52D9, [char]0x7528, 0x20, 0x50, 0x44, 0x46, 0x20,
                [char]0x306E, [char]0x4F5C, [char]0x6210, [char]0x306B, [char]0x5931, [char]0x6557, [char]0x3057, [char]0x307E, [char]0x3057, [char]0x305F, [char]0x3002
            )
        }
        "noteReceiptSent" {
            return -join @(
                [char]0xFF08,
                [char]0x7D44, [char]0x5408, [char]0x62C5, [char]0x5F53, [char]0x8005, [char]0x5411, [char]0x3051, [char]0x306E, [char]0x53D7, [char]0x4ED8, [char]0x5B8C, [char]0x4E86, [char]0x30E1, [char]0x30FC, [char]0x30EB, [char]0x306F, [char]0x9001, [char]0x4FE1, [char]0x6E08, [char]0x306E, [char]0x53EF, [char]0x80FD, [char]0x6027, [char]0x304C, [char]0x3042, [char]0x308A, [char]0x307E, [char]0x3059, [char]0x3002,
                [char]0xFF09
            )
        }
        "labelReceiptId" { return -join @([char]0x53D7, [char]0x4ED8, 0x20, 0x49, 0x44, 0x3A) }
        "labelUnion" { return -join @([char]0x7D44, [char]0x5408, 0x3A) }
        "labelAppDate" { return -join @([char]0x7533, [char]0x8FBC, [char]0x65E5, 0x3A) }
        "labelKyosaiCode" { return -join @([char]0x5354, [char]0x540C, [char]0x30B3, [char]0x30FC, [char]0x30C9, 0x3A) }
        "labelError" { return -join @([char]0x30A8, [char]0x30E9, [char]0x30FC, 0x3A) }
        "labelStage" { return -join @([char]0x51E6, [char]0x7406, 0x3A) }
        default { throw "Unknown admin mail label: $Key" }
    }
}

function New-SoshikiFormAdminAlertMailDraft {
    param(
        [Parameter(Mandatory = $true)]
        [string]$JsonPath,

        [Parameter(Mandatory = $true)]
        [string]$ErrorMessage,

        [string]$FailureStage = "PdfExport"
    )

    $layout = Get-SoshikiFormWebRootFromJsonPath -JsonPath $JsonPath
    $fileInfo = Get-SoshikiFormJsonFileInfo -JsonPath $JsonPath
    $submission = Get-Content -LiteralPath $layout.JsonFull -Raw -Encoding UTF8 | ConvertFrom-Json
    $code = [string]$submission.KyosaikaiCode

    $officeSettings = Get-SoshikiFormOfficeSettings -WebRoot $layout.WebRoot
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
        $unionName = -join @([char]0x7D44, [char]0x5408)
    }

    $dateForSubject = $fileInfo.FileNameDate
    if (-not $dateForSubject) {
        $dateForSubject = (Get-Date -Format "yyyyMMdd")
    }

    $subject = "$(Get-SoshikiFormAdminMailLabel -Key 'subjectPrefix')${FailureStage}_${unionName}_${dateForSubject}"
    $body = @(
        (Get-SoshikiFormAdminMailLabel -Key "headlinePdf")
        (Get-SoshikiFormAdminMailLabel -Key "noteReceiptSent")
        ""
        "$(Get-SoshikiFormAdminMailLabel -Key 'labelStage') $FailureStage"
        "$(Get-SoshikiFormAdminMailLabel -Key 'labelReceiptId') $receiptId"
        "$(Get-SoshikiFormAdminMailLabel -Key 'labelUnion') $unionName"
        "$(Get-SoshikiFormAdminMailLabel -Key 'labelAppDate') $appDateText"
        "$(Get-SoshikiFormAdminMailLabel -Key 'labelKyosaiCode') $code"
        ""
        "$(Get-SoshikiFormAdminMailLabel -Key 'labelError')"
        $ErrorMessage
    ) -join "`r`n"

    return @{
        To           = $officeSettings.AdminEmail
        Subject      = $subject
        Body         = $body
        ReceiptId    = $receiptId
        SettingsPath = $officeSettings.SettingsPath
        FailureStage = $FailureStage
    }
}
