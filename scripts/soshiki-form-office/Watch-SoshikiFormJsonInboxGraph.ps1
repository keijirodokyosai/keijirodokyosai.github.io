#Requires -Version 5.1
<#
  Poll Graph delta for new json -> PDF (no receipt mail). Default 30s.
#>
[CmdletBinding()]
param(
    [string]$ReceptionRoot = "",

    [int]$PollSeconds = 30,

    [switch]$LogToWebRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "SoshikiFormOffice.ps1")

$receptionFull = Resolve-SoshikiFormReceptionRoot -ReceptionRoot $ReceptionRoot
$webRoot = Split-Path -Parent $receptionFull
$processScript = Join-Path $PSScriptRoot "Process-SoshikiFormJsonInboxGraph.ps1"

if ($LogToWebRoot) {
    Write-SoshikiFormOfficeLog -WebRoot $webRoot -Message "Graph watcher start (poll ${PollSeconds}s)"
}

while ($true) {
    try {
        & $processScript -ReceptionRoot $receptionFull -LogToWebRoot:$LogToWebRoot
    }
    catch {
        $msg = "Graph watcher poll failed: " + $_.Exception.Message
        Write-Warning $msg
        if ($LogToWebRoot) {
            Write-SoshikiFormOfficeLog -WebRoot $webRoot -Message $msg
        }
    }

    Start-Sleep -Seconds $PollSeconds
}
