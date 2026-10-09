# 組織共済 WEB 受付 — OneDrive 上の相対パス解決（PC 間でフルパス直書きしない）

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
    $jsonFolderName = Split-Path -Leaf $jsonDir
    if ($jsonFolderName -ne "json") {
        throw "JSON は受付\{格納月}\json\ 配下を想定しています。実際: $jsonDir"
    }

    $monthDir = Split-Path -Parent $jsonDir
    $receptionDir = Split-Path -Parent $monthDir
    $receptionFolderName = Split-Path -Leaf $receptionDir
    if ($receptionFolderName -ne "受付") {
        throw "受付 フォルダが見つかりません（親が '$receptionFolderName'）。パス: $jsonFull"
    }

    $webRoot = Split-Path -Parent $receptionDir
    if (-not $webRoot) {
        throw "組織共済WEB受付（受付の親フォルダ）を解決できません: $jsonFull"
    }

    return @{
        JsonFull      = $jsonFull
        JsonDir       = $jsonDir
        MonthDir      = $monthDir
        ReceptionDir  = $receptionDir
        WebRoot       = $webRoot
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
        throw "templateFileName が未設定です（data/soshiki-form-excel-cell-map.json）。"
    }

    $templatePath = Join-Path $layout.WebRoot $TemplateFileName
    if (-not (Test-Path -LiteralPath $templatePath)) {
        throw "Excel テンプレが見つかりません: $templatePath"
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
