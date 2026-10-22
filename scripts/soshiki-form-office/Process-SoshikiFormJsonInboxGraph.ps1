#Requires -Version 5.1
<#
  Graph delta poll: new json under 受付\*\json\ on OneDrive (cloud) -> download -> PDF -> 処理済.
  Receipt mail is sent by the Worker (not here). Requires Graph app secrets in environment variables.
#>
[CmdletBinding()]
param(
    [string]$ReceptionRoot = "",

    [switch]$LogToWebRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "SoshikiFormOffice.ps1")
. (Join-Path $PSScriptRoot "SoshikiFormGraph.ps1")

$receptionFull = Resolve-SoshikiFormReceptionRoot -ReceptionRoot $ReceptionRoot
$webRoot = Split-Path -Parent $receptionFull
$graphEnv = Get-SoshikiFormGraphEnv
$token = Get-SoshikiFormGraphAccessToken -GraphEnv $graphEnv

$statePath = Get-SoshikiFormGraphDeltaStatePath -ScriptRoot $PSScriptRoot
$deltaUrl = Get-SoshikiFormGraphDeltaLink -ScriptRoot $PSScriptRoot
if (-not $deltaUrl) {
    $deltaUrl = Get-SoshikiFormGraphReceptionDeltaStartUrl -GraphEnv $graphEnv
}

if ($LogToWebRoot) {
    Write-SoshikiFormOfficeLog -WebRoot $webRoot -Message "Graph inbox delta start"
}

$isBaseline = -not (Test-Path -LiteralPath $statePath)

$stats = @{
    exported = 0
    skipped  = 0
    failed   = 0
}

while ($deltaUrl) {
    $page = Invoke-SoshikiFormGraphDeltaPage -Token $token -Url $deltaUrl
    foreach ($item in @($page.value)) {
        if ($isBaseline) {
            continue
        }

        if (-not (Test-SoshikiFormGraphDeltaItemIsInboxJson -Item $item)) {
            continue
        }

        $storageFolder = Get-SoshikiFormGraphItemStorageFolderFromParent -ParentPath ([string]$item.parentReference.path)
        if (-not $storageFolder) {
            continue
        }

        $fileName = [string]$item.name
        $jsonDir = Join-Path (Join-Path $receptionFull $storageFolder) "json"
        $localJson = Join-Path $jsonDir $fileName

        if (-not (Test-Path -LiteralPath $jsonDir)) {
            New-Item -ItemType Directory -Path $jsonDir -Force | Out-Null
        }

        try {
            $response = Get-SoshikiFormGraphDriveItemContentBytes `
                -Token $token `
                -DriveUserId $graphEnv.DriveUserId `
                -ItemId ([string]$item.id)
            [System.IO.File]::WriteAllBytes($localJson, $response.Content)
        }
        catch {
            $stats.failed++
            Write-Warning ("Graph download failed: " + $fileName + " " + $_.Exception.Message)
            continue
        }

        try {
            $result = Invoke-SoshikiFormJsonInboxFile `
                -JsonPath $localJson `
                -LogToWebRoot:$LogToWebRoot

            switch ($result) {
                "exported" { $stats.exported++ }
                "skipped" { $stats.skipped++ }
                default { $stats.skipped++ }
            }

            if ($result -eq "exported" -or $result -eq "skipped") {
                try {
                    Move-SoshikiFormGraphDriveItemToProcessed `
                        -Token $token `
                        -GraphEnv $graphEnv `
                        -ItemId ([string]$item.id) `
                        -StorageFolder $storageFolder `
                        -FileName $fileName
                }
                catch {
                    Write-Warning ("Graph move to processed failed (local PDF may exist): " + $_.Exception.Message)
                }
            }
        }
        catch {
            $stats.failed++
            Write-Warning ($fileName + ": " + $_.Exception.Message)
        }
    }

    if ($page."@odata.deltaLink") {
        $deltaUrl = [string]$page."@odata.deltaLink"
        Set-SoshikiFormGraphDeltaLink -DeltaLink $deltaUrl -ScriptRoot $PSScriptRoot
        if ($isBaseline) {
            Write-Output "graph baseline delta saved (no PDF on first run)"
            return
        }
        break
    }

    if ($page."@odata.nextLink") {
        $deltaUrl = [string]$page."@odata.nextLink"
        continue
    }

    break
}

$detail = "graph exported={0} skipped={1} failed={2}" -f $stats.exported, $stats.skipped, $stats.failed
if ($LogToWebRoot) {
    Write-SoshikiFormOfficeLog -WebRoot $webRoot -Message ("Graph inbox done: " + $detail)
}
Write-Output $detail
