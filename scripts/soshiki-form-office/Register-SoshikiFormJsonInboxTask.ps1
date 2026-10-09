#Requires -Version 5.1
<#
  Register a scheduled task that runs Process-SoshikiFormJsonInbox.ps1 every 5 minutes.
  Run once per PC as the user who owns OneDrive.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ReceptionRoot,

    [string]$TaskName = "SoshikiFormJsonInbox",

    [int]$IntervalMinutes = 5
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$processScript = Join-Path $PSScriptRoot "Process-SoshikiFormJsonInbox.ps1"
if (-not (Test-Path -LiteralPath $processScript)) {
    throw "Missing: $processScript"
}

$receptionFull = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($ReceptionRoot)
$arg = "-NoProfile -ExecutionPolicy Bypass -File `"$processScript`" -ReceptionRoot `"$receptionFull`""

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $arg
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) -RepetitionDuration ([TimeSpan]::MaxValue)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
Write-Output "Registered task: $TaskName (every $IntervalMinutes min) -> $processScript"
