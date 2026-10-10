#Requires -Version 5.1
<#
  Register a logon task that runs Watch-SoshikiFormJsonInbox.ps1 (poll json -> PDF -> 処理済み).
  Run once per PC as the user who owns OneDrive.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ReceptionRoot,

    [string]$TaskName = "SoshikiFormJsonInboxWatcher",

    [int]$PollSeconds = 60
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$watchScript = Join-Path $PSScriptRoot "Watch-SoshikiFormJsonInbox.ps1"
if (-not (Test-Path -LiteralPath $watchScript)) {
    throw "Missing: $watchScript"
}

$receptionFull = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($ReceptionRoot)
$arg = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$watchScript`" -ReceptionRoot `"$receptionFull`" -PollSeconds $PollSeconds -LogToWebRoot"

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $arg
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
Write-Output "Registered logon task: $TaskName (poll every $PollSeconds s) -> $watchScript"
