#Requires -Version 5.1
<#
  Poll 受付\*\json\ and export PDF + move to 処理済み (same as Process-SoshikiFormJsonInbox).
  OneDrive の同期完了待ちに向いた簡易ウォッチ（既定 60 秒間隔）。
  ログオン常駐: Register-SoshikiFormJsonInboxWatcherTask.ps1
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ReceptionRoot,

    [int]$PollSeconds = 60,

    [switch]$LogToWebRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "SoshikiFormOffice.ps1")

$receptionFull = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($ReceptionRoot)
$expected = Get-SoshikiReceptionFolderName
if ((Split-Path -Leaf $receptionFull) -ne $expected) {
    throw "ReceptionRoot must be the folder named $expected (got: $(Split-Path -Leaf $receptionFull))"
}

$webRoot = Split-Path -Parent $receptionFull
$processScript = Join-Path $PSScriptRoot "Process-SoshikiFormJsonInbox.ps1"

if ($LogToWebRoot) {
    Write-SoshikiFormOfficeLog -WebRoot $webRoot -Message "Watcher start (poll ${PollSeconds}s): $receptionFull"
}

while ($true) {
    try {
        & $processScript -ReceptionRoot $receptionFull -LogToWebRoot:$LogToWebRoot
    }
    catch {
        $msg = "Watcher poll failed: " + $_.Exception.Message
        Write-Warning $msg
        if ($LogToWebRoot) {
            Write-SoshikiFormOfficeLog -WebRoot $webRoot -Message $msg
        }
    }

    Start-Sleep -Seconds $PollSeconds
}
