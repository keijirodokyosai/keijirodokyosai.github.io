#Requires -Version 5.1
<#
  Register a logon task that runs Watch-SoshikiFormJsonInbox.ps1 (poll json -> PDF -> 処理済).
  Run once per PC as the user who owns OneDrive.
#>
[CmdletBinding()]
param(
    [string]$ReceptionRoot = "",

    [string]$TaskName = "SoshikiFormJsonInboxWatcher",

    [int]$PollSeconds = 60
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "SoshikiFormOffice.ps1")

$watchScript = Join-Path $PSScriptRoot "Watch-SoshikiFormJsonInbox.ps1"
if (-not (Test-Path -LiteralPath $watchScript)) {
    throw "Missing: $watchScript"
}

$arg = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$watchScript`""
if ($ReceptionRoot -and $ReceptionRoot.Trim()) {
    $receptionFull = Resolve-SoshikiFormReceptionRoot -ReceptionRoot $ReceptionRoot
    $arg += " -ReceptionRoot `"$receptionFull`""
}
else {
    $null = Resolve-SoshikiFormReceptionRoot
}
$arg += " -PollSeconds $PollSeconds -LogToWebRoot"

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $arg
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-SoshikiFormInboxScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings
Write-Output "Registered logon task: $TaskName (poll every $PollSeconds s) -> $watchScript"
