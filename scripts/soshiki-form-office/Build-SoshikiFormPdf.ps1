#Requires -Version 5.1
# Publish SoshikiFormPdf.exe to dist\ (win-x64, self-contained).

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    throw ".NET SDK required. https://dotnet.microsoft.com/download"
}

$csproj = Join-Path $PSScriptRoot "csharp\SoshikiFormPdf.csproj"
$outDir = Join-Path $PSScriptRoot "dist"

& dotnet publish $csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o $outDir
if ($LASTEXITCODE -ne 0) {
    throw "dotnet publish failed"
}

Write-Output "Published: $(Join-Path $outDir 'SoshikiFormPdf.exe')"
