#Requires -Version 5.1
# Publish self-contained SoshikiFormPdf.exe to dist\ (no .NET runtime required on target PC).

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    throw ".NET SDK required. https://dotnet.microsoft.com/download"
}

$csproj = Join-Path $PSScriptRoot "csharp\SoshikiFormPdf.csproj"
$outDir = Join-Path $PSScriptRoot "dist"

& dotnet publish $csproj -c Release -o $outDir
if ($LASTEXITCODE -ne 0) {
    throw "dotnet publish failed"
}

Write-Output "Published: $(Join-Path $outDir 'SoshikiFormPdf.exe')"
