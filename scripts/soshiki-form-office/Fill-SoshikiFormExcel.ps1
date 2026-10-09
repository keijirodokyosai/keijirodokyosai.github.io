#Requires -Version 5.1
<#
.SYNOPSIS
  組織共済 WEB 受付 JSON を Excel テンプレに流し込み、PDF を出力する。

.EXAMPLE
  .\Fill-SoshikiFormExcel.ps1 `
    -JsonPath "C:\...\合同互助会_20261109_abc12345.json" `
    -TemplatePath "C:\...\組織共済申込書.xlsx" `
    -OutputPdfPath "C:\...\pdf\合同互助会_20261109_abc12345.pdf"
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$JsonPath,

    [Parameter(Mandatory = $true)]
    [string]$TemplatePath,

    [Parameter(Mandatory = $true)]
    [string]$OutputPdfPath,

    [string]$UnionMasterPath = "",
    [string]$KyosaiMapPath = "",
    [string]$CellMapPath = "",
    [switch]$LeaveExcelOpen
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = $PSScriptRoot
$repoRoot = Split-Path (Split-Path $scriptDir -Parent) -Parent

if (-not $UnionMasterPath) {
    $UnionMasterPath = Join-Path $repoRoot "data\union-master.json"
}
if (-not $KyosaiMapPath) {
    $KyosaiMapPath = Join-Path $repoRoot "data\form-kyosai-map.json"
}
if (-not $CellMapPath) {
    $CellMapPath = Join-Path $repoRoot "data\soshiki-form-excel-cell-map.json"
}

. (Join-Path $scriptDir "SoshikiFormKuchi.ps1")

function Read-JsonFile {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        throw "File not found: $Path"
    }
    $raw = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
    return $raw | ConvertFrom-Json
}

function Get-IntNoLeadingZero {
    param([string]$Text)
    $t = "$Text".Trim()
    if (-not $t) { return "" }
    return [string][int]$t
}

function Set-CellValue {
    param(
        $Worksheet,
        [string]$Address,
        $Value
    )
    if ($null -eq $Value -or "$Value" -eq "") {
        return
    }
    $Worksheet.Range($Address).Value2 = $Value
}

function Set-ThreeCharCode {
    param(
        $Worksheet,
        [string[]]$Cols,
        [int]$Row,
        [string]$Code
    )
    $digits = ("$Code").Trim()
    if ($digits.Length -lt 3) {
        $digits = $digits.PadLeft(3, "0")
    }
    if ($digits.Length -gt 3) {
        $digits = $digits.Substring($digits.Length - 3)
    }
    for ($i = 0; $i -lt 3; $i++) {
        $addr = "{0}{1}" -f $Cols[$i], $Row
        Set-CellValue $Worksheet $addr $digits[$i]
    }
}

function Set-SixCharCode {
    param(
        $Worksheet,
        [string[]]$Cols,
        [int]$Row,
        [string]$Code
    )
    $digits = ("$Code").Trim() -replace "\D", ""
    if (-not $digits) { return }
    if ($digits.Length -lt 6) {
        $digits = $digits.PadLeft(6, "0")
    }
    if ($digits.Length -gt 6) {
        $digits = $digits.Substring($digits.Length - 6)
    }
    for ($i = 0; $i -lt 6; $i++) {
        $addr = "{0}{1}" -f $Cols[$i], $Row
        Set-CellValue $Worksheet $addr $digits[$i]
    }
}

function Get-MemberRowNumbers {
    param(
        [int]$RowIndex,
        $Map
    )
    $step = [int]$Map.memberRowStep
    $base = $Map.memberRowBase
    $offset = ($RowIndex - 1) * $step
    return @{
        Kana     = [int]$base.kana + $offset
        Main     = [int]$base.main + $offset
        Building = [int]$base.building + $offset
    }
}

function Get-TransferLabel {
    param([string]$Transfer)
    switch ("$Transfer".Trim()) {
        "New" { return "新規" }
        "Cancel" { return "解約" }
        "Change" { return "変更" }
        default { return "" }
    }
}

function Get-GenderLabel {
    param([string]$Gender)
    switch ("$Gender".Trim()) {
        "1" { return "男" }
        "2" { return "女" }
        default { return "" }
    }
}

function Format-AddressLine {
    param($Member)
    $pref = "$($Member.Prefecture)".Trim()
    $city = "$($Member.City)".Trim()
    $town = "$($Member.TownArea)".Trim()
    $area = "$($Member.AreaNumber)".Trim()

    if ($town -and $area -and $town.Length -lt 12) {
        return $pref + $city + $town + $area
    }
    return $pref + $city + $town + $area
}

function Parse-BirthDateParts {
    param([string]$BirthDate)
    $parts = ("$BirthDate").Trim().Split("/")
    if ($parts.Count -lt 3) {
        return @{ Year = ""; Month = ""; Day = "" }
    }
    return @{
        Year  = $parts[0].Trim()
        Month = Get-IntNoLeadingZero $parts[1]
        Day   = Get-IntNoLeadingZero $parts[2]
    }
}

function Get-CoverageMonthDisplay {
    param($ApplicationDate)
    $year = [int]$ApplicationDate.Year
    $month = [int]$ApplicationDate.Month
    if (-not $year -or -not $month) { return "" }
    if ($month -eq 12) { return "1" }
    return [string]($month + 1)
}

function Get-MonthTotalCount {
    param(
        [int]$Prior,
        $Members
    )
    $added = 0
    $removed = 0
    foreach ($m in @($Members)) {
        switch ("$($m.Transfer)".Trim()) {
            "New" { $added++ }
            "Cancel" { $removed++ }
        }
    }
    $total = $Prior + $added - $removed
    if ($total -lt 0) { $total = 0 }
    return [string]$total
}

$submission = Read-JsonFile $JsonPath
$unionMaster = Read-JsonFile $UnionMasterPath
$kyosaiMap = Read-JsonFile $KyosaiMapPath
$cellMap = Read-JsonFile $CellMapPath

$union = Find-UnionByKyosaikaiCode -UnionMaster $unionMaster -KyosaikaiCode $submission.KyosaikaiCode
if (-not $union) {
    throw "union-master に KyosaikaiCode=$($submission.KyosaikaiCode) がありません。"
}

$kuchiResult = Get-SoshikiFormKuchiResult -Union $union -KyosaiMap $kyosaiMap
if (-not $kuchiResult) {
    throw "口数の計算に失敗しました。"
}

$pdfDir = Split-Path -Parent $OutputPdfPath
if ($pdfDir -and -not (Test-Path -LiteralPath $pdfDir)) {
    New-Item -ItemType Directory -Path $pdfDir -Force | Out-Null
}

$excel = $null
$workbook = $null

try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = [bool]$LeaveExcelOpen
    $excel.DisplayAlerts = $false

    $workbook = $excel.Workbooks.Open($TemplatePath)
    $ws = $workbook.Worksheets.Item(1)

    $h = $cellMap.header
    $appDate = $submission.ApplicationDate
    Set-CellValue $ws $h.applicationYear $appDate.Year
    Set-CellValue $ws $h.applicationMonth (Get-IntNoLeadingZero $appDate.Month)
    Set-CellValue $ws $h.applicationDay (Get-IntNoLeadingZero $appDate.Day)

    Set-CellValue $ws $h.unionName $union.KyosaikaiName

    Set-ThreeCharCode $ws @($h.industryCode.cols) ([int]$h.industryCode.row) $submission.IndustryCode
    Set-ThreeCharCode $ws @($h.branchCode.cols) ([int]$h.branchCode.row) $submission.BranchCode
    Set-ThreeCharCode $ws @($h.subbranchCode.cols) ([int]$h.subbranchCode.row) $submission.SubbranchCode

    $unitsMap = $h.units
    foreach ($prop in $unitsMap.PSObject.Properties) {
        $formKey = $prop.Name
        $addr = $prop.Value
        $val = $kuchiResult.formKuchi[$formKey]
        Set-CellValue $ws $addr $val
    }

    Set-CellValue $ws $h.premiumPerPerson $kuchiResult.KakekinPerPerson

    $footer = $cellMap.footer
    $sheetFooter = $submission.SheetFooter
    Set-CellValue $ws $footer.pageCountCurrent $sheetFooter.PageCountCurrent
    Set-CellValue $ws $footer.pageCountTotal $sheetFooter.PageCountTotal
    Set-CellValue $ws $footer.priorMonthHeadcount $sheetFooter.PriorMonthHeadcount
    Set-CellValue $ws $footer.coverageMonth (Get-CoverageMonthDisplay $appDate)
    $prior = [int]$sheetFooter.PriorMonthHeadcount
    Set-CellValue $ws $footer.monthTotal (Get-MonthTotalCount -Prior $prior -Members $submission.Members)
    Set-CellValue $ws $footer.remarks $sheetFooter.Remarks

    $m = $cellMap.member
    foreach ($member in @($submission.Members)) {
        $rowIndex = [int]$member.Row
        if ($rowIndex -lt 1 -or $rowIndex -gt 5) { continue }

        $rows = Get-MemberRowNumbers -RowIndex $rowIndex -Map $cellMap
        $kanaRow = $rows.Kana
        $mainRow = $rows.Main
        $buildingRow = $rows.Building

        $transferAddr = "{0}{1}" -f $m.transferCol, $kanaRow
        Set-CellValue $ws $transferAddr (Get-TransferLabel $member.Transfer)

        Set-SixCharCode $ws @($m.unionMemberCodeCols) $mainRow $member.UnionMemberCode

        $addrKanaFamily = "{0}{1}" -f $m.familyNameKanaCol, $kanaRow
        $addrKanaGiven = "{0}{1}" -f $m.givenNameKanaCol, $kanaRow
        Set-CellValue $ws $addrKanaFamily $member.FamilyNameKana
        Set-CellValue $ws $addrKanaGiven $member.GivenNameKana

        $addrFamily = "{0}{1}" -f $m.familyNameCol, $mainRow
        $addrGiven = "{0}{1}" -f $m.givenNameCol, $mainRow
        Set-CellValue $ws $addrFamily $member.FamilyName
        Set-CellValue $ws $addrGiven $member.GivenName

        $birth = Parse-BirthDateParts $member.BirthDate
        Set-CellValue $ws ("{0}{1}" -f $m.birthYearCol, $mainRow) $birth.Year
        Set-CellValue $ws ("{0}{1}" -f $m.birthMonthCol, $mainRow) $birth.Month
        Set-CellValue $ws ("{0}{1}" -f $m.birthDayCol, $mainRow) $birth.Day

        Set-CellValue $ws ("{0}{1}" -f $m.postalCodeCol, $kanaRow) $member.PostalCode

        $genderAddr = "{0}{1}" -f $m.genderCol, $mainRow
        Set-CellValue $ws $genderAddr (Get-GenderLabel $member.Gender)

        Set-CellValue $ws ("{0}{1}" -f $m.addressLineCol, $mainRow) (Format-AddressLine $member)
        Set-CellValue $ws ("{0}{1}" -f $m.buildingCol, $buildingRow) $member.BuildingName
    }

    # xlTypePDF = 0
    $workbook.ExportAsFixedFormat(0, $OutputPdfPath)
    Write-Host "PDF: $OutputPdfPath"
}
finally {
    if ($workbook) {
        $workbook.Close($false)
        [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($workbook)
    }
    if ($excel) {
        if (-not $LeaveExcelOpen) {
            $excel.Quit()
        }
        [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel)
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
