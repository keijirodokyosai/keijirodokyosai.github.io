# Shared helpers for scripts/soshiki-form-office (paths, logging, C# launcher).
# Dot-source: . (Join-Path $PSScriptRoot "SoshikiFormOffice.ps1")

function Get-SoshikiReceptionFolderName {
    return -join @([char]0x53D7, [char]0x4ED8)
}

function Get-SoshikiFormWebRootFolderName {
    return -join @(
        [char]0x7D44, [char]0x7E54, [char]0x5171, [char]0x6E08,
        "WEB",
        [char]0x53D7, [char]0x4ED8
    )
}

function Get-SoshikiFormOneDriveCandidateRoots {
    $roots = New-Object System.Collections.Generic.List[string]
    foreach ($name in @("OneDrive", "OneDriveCommercial", "OneDriveConsumer")) {
        $value = [Environment]::GetEnvironmentVariable($name, "Process")
        if (-not $value) {
            continue
        }
        if (-not (Test-Path -LiteralPath $value)) {
            continue
        }
        if (-not $roots.Contains($value)) {
            $roots.Add($value)
        }
    }

    if ($env:USERPROFILE) {
        $profileDirs = Get-ChildItem -LiteralPath $env:USERPROFILE -Directory -ErrorAction SilentlyContinue
        foreach ($dir in $profileDirs) {
            if ($dir.Name -notlike "OneDrive*") {
                continue
            }
            if (-not $roots.Contains($dir.FullName)) {
                $roots.Add($dir.FullName)
            }
        }
    }

    return $roots
}

function Get-SoshikiFormDiscoveredReceptionRootCandidates {
    $webFolder = Get-SoshikiFormWebRootFolderName
    $receptionName = Get-SoshikiReceptionFolderName
    $found = New-Object System.Collections.Generic.List[string]

    foreach ($driveRoot in Get-SoshikiFormOneDriveCandidateRoots) {
        $receptionPath = Join-Path $driveRoot ($webFolder + "\" + $receptionName)
        if (-not (Test-Path -LiteralPath $receptionPath)) {
            continue
        }
        $resolved = (Resolve-Path -LiteralPath $receptionPath).Path
        if (-not $found.Contains($resolved)) {
            $found.Add($resolved)
        }
    }

    return $found
}

function Get-SoshikiFormReceptionRootFromSettingsFileLocation {
    $settingsPath = Find-SoshikiFormOfficeSettingsFilePath
    if (-not $settingsPath) {
        return $null
    }

    $settingsDir = Split-Path -Parent $settingsPath
    if ((Split-Path -Leaf $settingsDir) -ne (Get-SoshikiFormSettingsFolderName)) {
        return $null
    }

    $webRoot = Split-Path -Parent $settingsDir
    $receptionPath = Join-Path $webRoot (Get-SoshikiReceptionFolderName)
    if (-not (Test-Path -LiteralPath $receptionPath)) {
        return $null
    }

    $receptionFull = (Resolve-Path -LiteralPath $receptionPath).Path
    Assert-SoshikiFormReceptionRootPath -ReceptionFull $receptionFull
    return $receptionFull
}

function Resolve-SoshikiFormReceptionRootFromDiscovery {
    $fromSettingsDir = Get-SoshikiFormReceptionRootFromSettingsFileLocation
    if ($fromSettingsDir) {
        return $fromSettingsDir
    }

    $candidates = @(Get-SoshikiFormDiscoveredReceptionRootCandidates)
    if ($candidates.Count -eq 0) {
        return $null
    }

    $best = $null
    $bestJsonCount = -1
    foreach ($candidate in $candidates) {
        $jsonCount = @(Get-SoshikiFormInboxJsonFiles -ReceptionFull $candidate).Count
        if ($jsonCount -gt $bestJsonCount) {
            $bestJsonCount = $jsonCount
            $best = $candidate
        }
    }

    if ($best) {
        return $best
    }

    return $candidates[0]
}

function Find-SoshikiFormOfficeSettingsFilePath {
    $webFolder = Get-SoshikiFormWebRootFolderName
    $settingsDir = Get-SoshikiFormSettingsFolderName
    $fileName = "soshiki-form-office-settings.json"

    foreach ($driveRoot in Get-SoshikiFormOneDriveCandidateRoots) {
        $path = Join-Path $driveRoot ($webFolder + "\" + $settingsDir + "\" + $fileName)
        if (Test-Path -LiteralPath $path) {
            return (Resolve-Path -LiteralPath $path).Path
        }
    }

    return $null
}

function Read-SoshikiFormOfficeSettingsJson {
    param(
        [string]$SettingsFilePath = ""
    )

    if (-not $SettingsFilePath) {
        $SettingsFilePath = Find-SoshikiFormOfficeSettingsFilePath
    }

    if (-not $SettingsFilePath) {
        return $null
    }

    if (-not (Test-Path -LiteralPath $SettingsFilePath)) {
        return $null
    }

    try {
        return (Get-Content -LiteralPath $SettingsFilePath -Raw -Encoding UTF8 | ConvertFrom-Json)
    }
    catch {
        Write-Warning ("Invalid office settings JSON: " + $SettingsFilePath + " — use / or \\ in paths. " + $_.Exception.Message)
        return $null
    }
}

function Get-SoshikiFormInboxJsonFiles {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ReceptionFull
    )

    $found = New-Object System.Collections.Generic.List[System.IO.FileInfo]
    $items = Get-ChildItem -LiteralPath $ReceptionFull -Recurse -Filter "*.json" -File -ErrorAction SilentlyContinue
    foreach ($item in $items) {
        $parentDir = Split-Path -Parent $item.FullName
        if ((Split-Path -Leaf $parentDir) -ne "json") {
            continue
        }
        if (-not $found.Contains($item)) {
            $found.Add($item)
        }
    }

    return $found
}

function Assert-SoshikiFormReceptionRootPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ReceptionFull
    )

    $expected = Get-SoshikiReceptionFolderName
    if ((Split-Path -Leaf $ReceptionFull) -ne $expected) {
        throw "ReceptionRoot must be the folder named $expected (got: $(Split-Path -Leaf $ReceptionFull))"
    }
}

function Resolve-SoshikiFormReceptionRootIfExists {
    param(
        [Parameter(Mandatory = $true)]
        [string]$CandidatePath
    )

    if (-not $CandidatePath.Trim()) {
        return $null
    }

    $receptionFull = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($CandidatePath.Trim())
    Assert-SoshikiFormReceptionRootPath -ReceptionFull $receptionFull
    if (-not (Test-Path -LiteralPath $receptionFull)) {
        return $null
    }

    return (Resolve-Path -LiteralPath $receptionFull).Path
}

function Resolve-SoshikiFormReceptionRoot {
    param(
        [string]$ReceptionRoot = ""
    )

    $envOverride = [Environment]::GetEnvironmentVariable("SOSHIKI_OFFICE_RECEPTION_ROOT")
    if ($envOverride -and $envOverride.Trim()) {
        $fromEnv = Resolve-SoshikiFormReceptionRootIfExists -CandidatePath $envOverride
        if ($fromEnv) {
            return $fromEnv
        }
        throw "SOSHIKI_OFFICE_RECEPTION_ROOT folder not found: $envOverride"
    }

    if ($ReceptionRoot -and $ReceptionRoot.Trim()) {
        $fromArg = Resolve-SoshikiFormReceptionRootIfExists -CandidatePath $ReceptionRoot
        if ($fromArg) {
            return $fromArg
        }
        throw "ReceptionRoot folder not found: $ReceptionRoot"
    }

    $fromSettingsDir = Get-SoshikiFormReceptionRootFromSettingsFileLocation
    if ($fromSettingsDir) {
        return $fromSettingsDir
    }

    $raw = Read-SoshikiFormOfficeSettingsJson

    $fromJson = ""
    if ($raw) {
        $fromJson = [string]$raw.ReceptionRoot
    }
    if ($fromJson.Trim()) {
        $fromJsonPath = Resolve-SoshikiFormReceptionRootIfExists -CandidatePath $fromJson
        if ($fromJsonPath) {
            return $fromJsonPath
        }
    }

    $webRootValue = ""
    if ($raw) {
        $webRootValue = [string]$raw.WebRoot
    }
    if ($webRootValue.Trim()) {
        $webFull = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($webRootValue.Trim())
        $receptionCandidate = Join-Path $webFull (Get-SoshikiReceptionFolderName)
        $fromWebRoot = Resolve-SoshikiFormReceptionRootIfExists -CandidatePath $receptionCandidate
        if ($fromWebRoot) {
            return $fromWebRoot
        }
    }

    $discovered = Resolve-SoshikiFormReceptionRootFromDiscovery
    if ($discovered) {
        return $discovered
    }

    throw @(
        "ReceptionRoot not found. Set ReceptionRoot or WebRoot in"
        " 設定/soshiki-form-office-settings.json (paths: use / or \\),"
        " pass -ReceptionRoot, set SOSHIKI_OFFICE_RECEPTION_ROOT,"
        " or ensure $(Get-SoshikiFormWebRootFolderName)\受付 exists under OneDrive."
    ) -join " "
}

function Get-SoshikiFormScheduledTaskPrincipal {
    $userId = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    return New-ScheduledTaskPrincipal -UserId $userId -LogonType Interactive -RunLevel Limited
}

function New-SoshikiFormInboxRepetitionTrigger {
    param(
        [int]$IntervalMinutes = 1
    )

    # Task Scheduler rejects [TimeSpan]::MaxValue (P99999999DT…).
    $duration = New-TimeSpan -Days 3650
    return New-ScheduledTaskTrigger -Once -At (Get-Date) `
        -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) `
        -RepetitionDuration $duration
}

function Register-SoshikiFormInboxScheduledTask {
    param(
        [Parameter(Mandatory = $true)]
        [string]$TaskName,

        [Parameter(Mandatory = $true)]
        [CimInstance]$Action,

        [Parameter(Mandatory = $true)]
        [CimInstance]$Trigger,

        [Parameter(Mandatory = $true)]
        [CimInstance]$Settings
    )

    $principal = Get-SoshikiFormScheduledTaskPrincipal
    Register-ScheduledTask `
        -TaskName $TaskName `
        -Action $Action `
        -Trigger $Trigger `
        -Settings $Settings `
        -Principal $principal `
        -Force `
        -ErrorAction Stop | Out-Null
}

function Get-SoshikiFormSettingsFolderName {
    return -join @([char]0x8A2D, [char]0x5B9A)
}

function Get-SoshikiFormProcessedFolderName {
    return -join @([char]0x51E6, [char]0x7406, [char]0x6E08)
}

function Get-SoshikiFormPdfFolderName {
    return "PDF"
}

function Get-SoshikiFormOfficeSettingsPath {
    param([Parameter(Mandatory = $true)][string]$WebRoot)

    $settingsDir = Get-SoshikiFormSettingsFolderName
    return Join-Path $WebRoot ($settingsDir + "\soshiki-form-office-settings.json")
}

function Get-SoshikiFormOfficeSettings {
    param([Parameter(Mandatory = $true)][string]$WebRoot)

    $path = Get-SoshikiFormOfficeSettingsPath -WebRoot $WebRoot
    $raw = $null
    if (Test-Path -LiteralPath $path) {
        $raw = Get-Content -LiteralPath $path -Raw -Encoding UTF8 | ConvertFrom-Json
    }

    $adminOverride = [Environment]::GetEnvironmentVariable("SOSHIKI_OFFICE_ADMIN_EMAIL")
    $fromOverride = [Environment]::GetEnvironmentVariable("SOSHIKI_OFFICE_FROM_EMAIL")

    if (-not $raw -and -not $adminOverride -and -not $fromOverride) {
        throw "Office settings not found: $path"
    }

    $adminEmail = $adminOverride
    if (-not $adminEmail -and $raw) {
        $adminEmail = [string]$raw.AdminEmail
    }
    if (-not $adminEmail) {
        throw "AdminEmail missing (file: $path or SOSHIKI_OFFICE_ADMIN_EMAIL)"
    }

    $fromEmail = $fromOverride
    if (-not $fromEmail -and $raw) {
        $fromEmail = [string]$raw.FromEmail
    }
    if (-not $fromEmail) {
        throw "FromEmail missing (file: $path or SOSHIKI_OFFICE_FROM_EMAIL)"
    }

    $settingsPath = $path
    if ($adminOverride -or $fromOverride) {
        $envKeys = @()
        if ($adminOverride) { $envKeys += "SOSHIKI_OFFICE_ADMIN_EMAIL" }
        if ($fromOverride) { $envKeys += "SOSHIKI_OFFICE_FROM_EMAIL" }
        $settingsPath = "(environment:" + ($envKeys -join ",") + ")"
    }

    return @{
        AdminEmail   = $adminEmail
        FromEmail    = $fromEmail
        SettingsPath = $settingsPath
    }
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
    if ($raw -is [System.Array]) {
        $list = @($raw)
    }
    elseif (($raw.PSObject.Properties.Name -contains "contacts") -and $null -ne $raw.contacts) {
        $list = @($raw.contacts)
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
    $leaf = Split-Path -Leaf $jsonDir
    $allowed = @("json", (Get-SoshikiFormProcessedFolderName))
    if ($allowed -notcontains $leaf) {
        throw "JSON must be under .../MONTH/json/ or .../MONTH/処理済/ (got: $jsonDir)"
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
    $pdfDir = Join-Path $layout.MonthDir (Get-SoshikiFormPdfFolderName)
    $stem = [System.IO.Path]::GetFileNameWithoutExtension($layout.JsonFull)
    return Join-Path $pdfDir ($stem + ".pdf")
}

function Test-SoshikiFormJsonInInboxFolder {
    param(
        [Parameter(Mandatory = $true)]
        [string]$JsonPath
    )

    $jsonFull = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($JsonPath)
    if (-not (Test-Path -LiteralPath $jsonFull)) {
        return $false
    }

    $jsonDir = Split-Path -Parent $jsonFull
    return (Split-Path -Leaf $jsonDir) -eq "json"
}

function Move-SoshikiFormJsonToProcessedFolder {
    param(
        [Parameter(Mandatory = $true)]
        [string]$JsonPath
    )

    $layout = Get-SoshikiFormWebRootFromJsonPath -JsonPath $JsonPath
    $processedName = Get-SoshikiFormProcessedFolderName
    if ((Split-Path -Leaf $layout.JsonDir) -eq $processedName) {
        return
    }

    $processedDir = Join-Path $layout.MonthDir $processedName
    if (-not (Test-Path -LiteralPath $processedDir)) {
        New-Item -ItemType Directory -Path $processedDir | Out-Null
    }

    $dest = Join-Path $processedDir (Split-Path -Leaf $layout.JsonFull)
    if (Test-Path -LiteralPath $dest) {
        throw "Processed JSON already exists: $dest"
    }

    Move-Item -LiteralPath $layout.JsonFull -Destination $dest
}

function Invoke-SoshikiFormJsonInboxFile {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$JsonPath,

        [switch]$PreviewReceiptMail,

        [switch]$KeepInJson,

        [switch]$LogToWebRoot
    )

    $jsonFull = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($JsonPath)
    if (-not (Test-Path -LiteralPath $jsonFull)) {
        return "missing"
    }

    if (-not (Test-SoshikiFormJsonInInboxFolder -JsonPath $jsonFull)) {
        return "skipped"
    }

    $layout = Get-SoshikiFormWebRootFromJsonPath -JsonPath $jsonFull
    $pdfPath = Get-SoshikiFormPdfPathForJson -JsonPath $jsonFull
    if (Test-Path -LiteralPath $pdfPath) {
        if (-not $KeepInJson) {
            Move-SoshikiFormJsonToProcessedFolder -JsonPath $jsonFull
        }
        return "skipped"
    }

    try {
        if ($PreviewReceiptMail) {
            $previewScript = Join-Path $PSScriptRoot "Preview-SoshikiFormReceiptEmail.ps1"
            & $previewScript -JsonPath $jsonFull
        }

        Invoke-SoshikiFormPdf -JsonPath $jsonFull
        if (-not $KeepInJson) {
            Move-SoshikiFormJsonToProcessedFolder -JsonPath $jsonFull
        }

        if ($LogToWebRoot) {
            Write-SoshikiFormOfficeLog -WebRoot $layout.WebRoot -Message ("OK " + (Split-Path -Leaf $jsonFull))
        }

        return "exported"
    }
    catch {
        $msg = (Split-Path -Leaf $jsonFull) + ": " + $_.Exception.Message
        if ($LogToWebRoot) {
            Write-SoshikiFormOfficeLog -WebRoot $layout.WebRoot -Message ("FAIL " + $msg)
        }
        throw
    }
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
