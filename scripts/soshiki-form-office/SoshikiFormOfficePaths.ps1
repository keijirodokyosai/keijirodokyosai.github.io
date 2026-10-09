# OneDrive layout: .../WEB_ROOT/受付/<month>/json|pdf

function Get-SoshikiReceptionFolderName {
    return -join @([char]0x53D7, [char]0x4ED8)
}

function Get-SoshikiFormRepoRoot {
    param([string]$ScriptRoot = $PSScriptRoot)
    return Split-Path (Split-Path $ScriptRoot -Parent) -Parent
}

function Get-SoshikiFormExcelCellMap {
    param([string]$ScriptRoot = $PSScriptRoot)
    $repoRoot = Get-SoshikiFormRepoRoot -ScriptRoot $ScriptRoot
    $path = Join-Path $repoRoot "data\soshiki-form-excel-cell-map.json"
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Cell map not found: $path"
    }
    return (Get-Content -LiteralPath $path -Raw -Encoding UTF8 | ConvertFrom-Json)
}

function Get-SoshikiFormWebRootFromJsonPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$JsonPath
    )

    $jsonFull = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($JsonPath)
    if (-not (Test-Path -LiteralPath $jsonFull)) {
        throw "JSON not found: $jsonFull"
    }

    $jsonDir = Split-Path -Parent $jsonFull
    if ((Split-Path -Leaf $jsonDir) -ne "json") {
        throw "JSON must be under .../MONTH/json/ (got: $jsonDir)"
    }

    $monthDir = Split-Path -Parent $jsonDir
    $receptionDir = Split-Path -Parent $monthDir
    $expected = Get-SoshikiReceptionFolderName
    if ((Split-Path -Leaf $receptionDir) -ne $expected) {
        throw "Expected parent folder $expected (got: $(Split-Path -Leaf $receptionDir)). Path: $jsonFull"
    }

    $webRoot = Split-Path -Parent $receptionDir
    if (-not $webRoot) {
        throw "Cannot resolve WEB root above reception folder: $jsonFull"
    }

    return @{
        JsonFull     = $jsonFull
        JsonDir      = $jsonDir
        MonthDir     = $monthDir
        ReceptionDir = $receptionDir
        WebRoot      = $webRoot
    }
}

function Get-SoshikiFormExcelTemplatePath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$JsonPath,

        [string]$TemplateFileName = "",

        [string]$ScriptRoot = $PSScriptRoot
    )

    $layout = Get-SoshikiFormWebRootFromJsonPath -JsonPath $JsonPath
    if (-not $TemplateFileName) {
        $cellMap = Get-SoshikiFormExcelCellMap -ScriptRoot $ScriptRoot
        $TemplateFileName = $cellMap.templateFileName
    }
    if (-not $TemplateFileName) {
        throw "templateFileName missing in data/soshiki-form-excel-cell-map.json"
    }

    $templatePath = Join-Path $layout.WebRoot $TemplateFileName
    if (-not (Test-Path -LiteralPath $templatePath)) {
        throw "Excel template not found: $templatePath"
    }

    return (Resolve-Path -LiteralPath $templatePath).Path
}

function Get-SoshikiFormPdfPathForJson {
    param(
        [Parameter(Mandatory = $true)]
        [string]$JsonPath
    )

    $layout = Get-SoshikiFormWebRootFromJsonPath -JsonPath $JsonPath
    $pdfDir = Join-Path $layout.MonthDir "pdf"
    $stem = [System.IO.Path]::GetFileNameWithoutExtension($layout.JsonFull)
    return Join-Path $pdfDir ($stem + ".pdf")
}
