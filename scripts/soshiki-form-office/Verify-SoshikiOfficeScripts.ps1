# Parse-check PowerShell scripts; build C# and run kuchi unit tests (no Excel).
$ErrorActionPreference = "Stop"
$dir = $PSScriptRoot

$scripts = @(
    "SoshikiFormOffice.ps1",
    "SoshikiFormOfficePaths.ps1",
    "Export-SoshikiFormPdfFromJson.ps1",
    "Process-SoshikiFormJsonInbox.ps1",
    "Register-SoshikiFormJsonInboxTask.ps1",
    "Build-SoshikiFormPdf.ps1",
    "Get-DotNetCli.ps1",
    "SoshikiFormReceiptMail.ps1",
    "Preview-SoshikiFormReceiptEmail.ps1",
    "Send-SoshikiFormReceiptEmail.ps1",
    "SoshikiFormAdminMail.ps1",
    "Invoke-SoshikiFormOutlook.ps1",
    "Preview-SoshikiFormAdminAlertEmail.ps1",
    "Send-SoshikiFormAdminAlertEmail.ps1"
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

$p = Parse-SoshikiFormJsonFileStem -Stem "UnionName_20261009_7a4bb6ce"
if ($p.ReceiptId -ne "7a4bb6ce" -or $p.FileNameDate -ne "20261009") {
    throw "Json file stem parse failed"
}
Write-Output "Json stem parse OK"

. (Join-Path $dir "Get-DotNetCli.ps1")
$dotnet = Get-DotNetCli
if (-not $dotnet) {
    Write-Warning "dotnet SDK not found; skipping csharp build/test"
    exit 0
}

$sln = Join-Path $dir "SoshikiFormPdf.sln"
& $dotnet test $sln -c Release
if ($LASTEXITCODE -ne 0) {
    throw "dotnet test failed"
}
Write-Output "C# build + tests OK"
