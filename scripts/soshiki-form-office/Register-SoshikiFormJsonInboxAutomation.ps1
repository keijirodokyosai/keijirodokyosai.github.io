#Requires -Version 5.1
<#
  Register inbox automation on this PC:
    - Logon watcher (poll 60s, PDF + 処理済み)
    - Scheduled task every 1 min (same inbox, backup if watcher stopped)
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ReceptionRoot,

    [string]$WatcherTaskName = "SoshikiFormJsonInboxWatcher",

    [string]$ScheduledTaskName = "SoshikiFormJsonInbox",

    [int]$PollSeconds = 60,

    [int]$IntervalMinutes = 1
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$dir = $PSScriptRoot
& (Join-Path $dir "Register-SoshikiFormJsonInboxWatcherTask.ps1") `
    -ReceptionRoot $ReceptionRoot `
    -TaskName $WatcherTaskName `
    -PollSeconds $PollSeconds

& (Join-Path $dir "Register-SoshikiFormJsonInboxTask.ps1") `
    -ReceptionRoot $ReceptionRoot `
    -TaskName $ScheduledTaskName `
    -IntervalMinutes $IntervalMinutes

Write-Output "Registered watcher + $IntervalMinutes min scheduled inbox tasks."
