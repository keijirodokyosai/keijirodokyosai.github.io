# Parse-check PowerShell scripts and build C# tool (no Excel required).
$ErrorActionPreference = "Stop"
$dir = $PSScriptRoot
$repo = Split-Path (Split-Path $dir -Parent) -Parent

$scripts = @(
    "SoshikiFormOfficePaths.ps1",
    "Invoke-SoshikiFormPdf.ps1",
    "Export-SoshikiFormPdfFromJson.ps1",
    "Process-SoshikiFormJsonInbox.ps1",
    "Register-SoshikiFormJsonInboxTask.ps1",
    "Build-SoshikiFormPdf.ps1"
)

foreach ($name in $scripts) {
    $path = Join-Path $dir $name
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Missing script: $name"
    }
    $tokens = $null
    $parseErrors = $null
    $null = [System.Management.Automation.Language.Parser]::ParseFile($path, [ref]$tokens, [ref]$parseErrors)
    if ($parseErrors -and $parseErrors.Count -gt 0) {
        throw "Parse errors in $name"
    }
    Write-Output "Parse OK: $name"
}

. (Join-Path $dir "SoshikiFormOfficePaths.ps1")
$name = Get-SoshikiReceptionFolderName
if ($name.Length -ne 2) {
    throw "Reception folder name length"
}
Write-Output "Paths OK"

$csproj = Join-Path $dir "csharp\SoshikiFormPdf.csproj"
if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    Write-Warning "dotnet not on PATH; skipping csharp build"
    exit 0
}

& dotnet build $csproj -c Release
if ($LASTEXITCODE -ne 0) {
    throw "dotnet build failed"
}
Write-Output "C# build OK"
