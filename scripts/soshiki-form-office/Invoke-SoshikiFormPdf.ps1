# Shared entry: run SoshikiFormPdf (published exe or dotnet run).

function Get-SoshikiFormOfficeRepoRoot {
    param([string]$OfficeScriptRoot = $PSScriptRoot)
    return Split-Path (Split-Path $OfficeScriptRoot -Parent) -Parent
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
    $repoRoot = Get-SoshikiFormOfficeRepoRoot -OfficeScriptRoot $officeDir
    $exe = Join-Path $officeDir "dist\SoshikiFormPdf.exe"
    $csproj = Join-Path $officeDir "csharp\SoshikiFormPdf.csproj"
    $toolArgs = @("--repo", $repoRoot, $jsonFull)

    if (Test-Path -LiteralPath $exe) {
        & $exe @toolArgs
    }
    elseif (Get-Command dotnet -ErrorAction SilentlyContinue) {
        & dotnet run --project $csproj -c Release -- @toolArgs
    }
    else {
        throw "Install .NET 8 SDK or run .\Build-SoshikiFormPdf.ps1 to create dist\SoshikiFormPdf.exe"
    }

    if ($LASTEXITCODE -ne 0) {
        throw "SoshikiFormPdf exited with code $LASTEXITCODE"
    }
}
