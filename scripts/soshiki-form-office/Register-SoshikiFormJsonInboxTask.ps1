#Requires -Version 5.1
<#
  Register a scheduled task that runs Process-SoshikiFormJsonInbox.ps1 (default every 1 min).
  ReceptionRoot omitted when 設定/soshiki-form-office-settings.json has ReceptionRoot or WebRoot.
#>
[CmdletBinding()]
param(
    [string]$ReceptionRoot = "",

    [string]$TaskName = "SoshikiFormJsonInbox",

    [int]$IntervalMinutes = 1
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "SoshikiFormOffice.ps1")

$processScript = Join-Path $PSScriptRoot "Process-SoshikiFormJsonInbox.ps1"
if (-not (Test-Path -LiteralPath $processScript)) {
    throw "Missing: $processScript"
}

$arg = "-NoProfile -ExecutionPolicy Bypass -File `"$processScript`""
if ($ReceptionRoot -and $ReceptionRoot.Trim()) {
    $receptionFull = Resolve-SoshikiFormReceptionRoot -ReceptionRoot $ReceptionRoot
    $arg += " -ReceptionRoot `"$receptionFull`""
}
else {
    $null = Resolve-SoshikiFormReceptionRoot
}
$arg += " -LogToWebRoot"

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $arg
$trigger = New-SoshikiFormInboxRepetitionTrigger -IntervalMinutes $IntervalMinutes
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-SoshikiFormInboxScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings
Write-Output "Registered task: $TaskName (every $IntervalMinutes min) -> $processScript"
