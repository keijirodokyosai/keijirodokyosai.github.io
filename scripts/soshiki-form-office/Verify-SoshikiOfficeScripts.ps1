# Parse-check PowerShell scripts; build C# and run kuchi unit tests (no Excel).
$ErrorActionPreference = "Stop"
$dir = $PSScriptRoot

$scripts = @(
    "SoshikiFormOffice.ps1",
    "SoshikiFormOfficePaths.ps1",
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

. (Join-Path $dir "SoshikiFormOffice.ps1")
$name = Get-SoshikiReceptionFolderName
if ($name.Length -ne 2) {
    throw "Reception folder name length"
}
Write-Output "Paths OK"

if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    Write-Warning "dotnet not on PATH; skipping csharp build/test"
    exit 0
}

$testProj = Join-Path $dir "tests\SoshikiFormPdf.Tests\SoshikiFormPdf.Tests.csproj"
& dotnet test $testProj -c Release
if ($LASTEXITCODE -ne 0) {
    throw "dotnet test failed"
}
Write-Output "C# build + tests OK"
