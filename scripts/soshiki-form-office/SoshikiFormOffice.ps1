# Shared helpers for scripts/soshiki-form-office (paths, logging, C# launcher).
# Dot-source: . (Join-Path $PSScriptRoot "SoshikiFormOffice.ps1")

function Get-SoshikiReceptionFolderName {
    return -join @([char]0x53D7, [char]0x4ED8)
}

function Get-SoshikiFormSettingsFolderName {
    return -join @([char]0x8A2D, [char]0x5B9A)
}

function Parse-SoshikiFormJsonFileStem {
    param([Parameter(Mandatory = $true)][string]$Stem)

    $parts = $Stem -split '_'
    if ($parts.Length -lt 3) {
        return @{
            Stem             = $Stem
            UnionFileSegment = $null
            FileNameDate     = $null
            ReceiptId        = $null
        }
    }

    $receiptId = $parts[$parts.Length - 1]
    $fileNameDate = $parts[$parts.Length - 2]
    $unionSegment = ($parts[0..($parts.Length - 3)] -join '_')
    return @{
        Stem             = $Stem
        UnionFileSegment = $unionSegment
        FileNameDate     = $fileNameDate
        ReceiptId        = $receiptId
    }
}

function Get-SoshikiFormJsonFileInfo {
    param(
        [Parameter(Mandatory = $true)]
        [string]$JsonPath
    )

    $layout = Get-SoshikiFormWebRootFromJsonPath -JsonPath $JsonPath
    $stem = [System.IO.Path]::GetFileNameWithoutExtension($layout.JsonFull)
    $parsed = Parse-SoshikiFormJsonFileStem -Stem $stem
    return @{
        JsonFull         = $layout.JsonFull
        WebRoot          = $layout.WebRoot
        Stem             = $parsed.Stem
        UnionFileSegment = $parsed.UnionFileSegment
        FileNameDate     = $parsed.FileNameDate
        ReceiptId        = $parsed.ReceiptId
    }
}

function Get-SoshikiFormUnionContactsPath {
    param([Parameter(Mandatory = $true)][string]$WebRoot)

    $settings = Get-SoshikiFormSettingsFolderName
    return Join-Path $WebRoot ($settings + "\union-contacts.json")
}

function Get-SoshikiFormUnionContact {
    param(
        [Parameter(Mandatory = $true)]
        [string]$WebRoot,

        [Parameter(Mandatory = $true)]
        [string]$KyosaikaiCode
    )

    $path = Get-SoshikiFormUnionContactsPath -WebRoot $WebRoot
    if (-not (Test-Path -LiteralPath $path)) {
        return $null
    }

    $raw = Get-Content -LiteralPath $path -Raw -Encoding UTF8 | ConvertFrom-Json
    $list = @()
    if ($null -ne $raw.contacts) {
        $list = @($raw.contacts)
    }
    elseif ($raw -is [System.Array]) {
        $list = @($raw)
    }
    elseif ($null -ne $raw) {
        $list = @($raw)
    }

    foreach ($item in $list) {
        if ($item.KyosaikaiCode -eq $KyosaikaiCode) {
            return $item
        }
    }

    return $null
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

function Get-SoshikiFormOfficeLogPath {
    param([Parameter(Mandatory = $true)][string]$WebRoot)
    $logDir = Join-Path $WebRoot "logs"
    return Join-Path $logDir "soshiki-form-pdf.log"
}

function Write-SoshikiFormOfficeLog {
    param(
        [Parameter(Mandatory = $true)]
        [string]$WebRoot,

        [Parameter(Mandatory = $true)]
        [string]$Message
    )

    $logPath = Get-SoshikiFormOfficeLogPath -WebRoot $WebRoot
    $logDir = Split-Path -Parent $logPath
    if (-not (Test-Path -LiteralPath $logDir)) {
        New-Item -ItemType Directory -Path $logDir | Out-Null
    }
    $line = ("{0:yyyy-MM-dd HH:mm:ss} {1}" -f (Get-Date), $Message)
    Add-Content -LiteralPath $logPath -Value $line -Encoding UTF8
}

function Invoke-SoshikiFormPdf {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$JsonPath
    )

    $jsonFull = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($JsonPath)
    if (-not (Test-Path -LiteralPath $jsonFull)) {
        throw "JSON not found: $jsonFull"
    }

    $officeDir = $PSScriptRoot
    $repoRoot = Get-SoshikiFormRepoRoot -ScriptRoot $officeDir
    $exe = Join-Path $officeDir "dist\SoshikiFormPdf.exe"
    $csproj = Join-Path $officeDir "csharp\SoshikiFormPdf.csproj"
    $toolArgs = @("--repo", $repoRoot, $jsonFull)
    $ran = $false

    if (Test-Path -LiteralPath $exe) {
        & $exe @toolArgs
        $ran = $true
    }
    else {
        . (Join-Path $officeDir "Get-DotNetCli.ps1")
        $dotnet = Get-DotNetCli
        if ($dotnet) {
            & $dotnet run --project $csproj -c Release -- @toolArgs
            $ran = $true
        }
    }

    if (-not $ran) {
        throw "Install .NET 8 SDK or run .\Build-SoshikiFormPdf.ps1 to create dist\SoshikiFormPdf.exe"
    }

    if ($LASTEXITCODE -ne 0) {
        throw "SoshikiFormPdf exited with code $LASTEXITCODE"
    }
}
