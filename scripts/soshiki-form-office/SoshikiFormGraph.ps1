#Requires -Version 5.1
# Microsoft Graph (app-only) for OneDrive inbox delta. Secrets via environment variables.

Set-StrictMode -Version Latest

function Get-SoshikiFormGraphEnv {
    $tenantId = [Environment]::GetEnvironmentVariable("SOSHIKI_GRAPH_TENANT_ID")
    $clientId = [Environment]::GetEnvironmentVariable("SOSHIKI_GRAPH_CLIENT_ID")
    $clientSecret = [Environment]::GetEnvironmentVariable("SOSHIKI_GRAPH_CLIENT_SECRET")
    $driveUserId = [Environment]::GetEnvironmentVariable("SOSHIKI_GRAPH_DRIVE_USER_ID")
    $basePath = [Environment]::GetEnvironmentVariable("SOSHIKI_GRAPH_BASE_PATH")

    if (-not $tenantId) { $tenantId = [Environment]::GetEnvironmentVariable("AZURE_TENANT_ID") }
    if (-not $clientId) { $clientId = [Environment]::GetEnvironmentVariable("AZURE_CLIENT_ID") }
    if (-not $clientSecret) { $clientSecret = [Environment]::GetEnvironmentVariable("AZURE_CLIENT_SECRET") }
    if (-not $driveUserId) { $driveUserId = [Environment]::GetEnvironmentVariable("GRAPH_DRIVE_USER_ID") }
    if (-not $basePath) { $basePath = [Environment]::GetEnvironmentVariable("GRAPH_BASE_PATH") }

    if (-not $tenantId -or -not $clientId -or -not $clientSecret -or -not $driveUserId -or -not $basePath) {
        throw @(
            "Graph env missing. Set SOSHIKI_GRAPH_* or AZURE_* + GRAPH_DRIVE_USER_ID + GRAPH_BASE_PATH"
            " (same values as Cloudflare Worker secrets)."
        ) -join " "
    }

    return @{
        TenantId     = $tenantId.Trim()
        ClientId     = $clientId.Trim()
        ClientSecret = $clientSecret.Trim()
        DriveUserId  = $driveUserId.Trim()
        BasePath     = $basePath.Trim()
    }
}

function Get-SoshikiFormGraphAccessToken {
    param($GraphEnv = (Get-SoshikiFormGraphEnv))

    $body = @{
        client_id     = $GraphEnv.ClientId
        client_secret = $GraphEnv.ClientSecret
        scope         = "https://graph.microsoft.com/.default"
        grant_type    = "client_credentials"
    }

    $response = Invoke-RestMethod `
        -Method Post `
        -Uri "https://login.microsoftonline.com/$($GraphEnv.TenantId)/oauth2/v2.0/token" `
        -Body $body `
        -ErrorAction Stop

    return [string]$response.access_token
}

function Invoke-SoshikiFormGraphApi {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Method,

        [Parameter(Mandatory = $true)]
        [string]$Uri,

        [string]$Token,

        $Body = $null,

        [string]$ContentType = "application/json"
    )

    $headers = @{ Authorization = "Bearer $Token" }
    $params = @{
        Method      = $Method
        Uri         = $Uri
        Headers     = $headers
        ErrorAction = "Stop"
    }

    if ($null -ne $Body) {
        if ($Body -is [string] -or $Body -is [byte[]]) {
            $params["Body"] = $Body
            if ($ContentType) {
                $params["ContentType"] = $ContentType
            }
        }
        else {
            $params["Body"] = ($Body | ConvertTo-Json -Depth 20 -Compress)
            $params["ContentType"] = "application/json"
        }
    }

    return Invoke-RestMethod @params
}

function Get-SoshikiFormGraphDeltaStatePath {
    param([string]$ScriptRoot = $PSScriptRoot)
    $dir = Join-Path $ScriptRoot "state"
    if (-not (Test-Path -LiteralPath $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
    }
    return Join-Path $dir "graph-inbox-delta.json"
}

function Get-SoshikiFormGraphDeltaLink {
    param([string]$ScriptRoot = $PSScriptRoot)
    $path = Get-SoshikiFormGraphDeltaStatePath -ScriptRoot $ScriptRoot
    if (-not (Test-Path -LiteralPath $path)) {
        return $null
    }
    $raw = Get-Content -LiteralPath $path -Raw -Encoding UTF8 | ConvertFrom-Json
    return [string]$raw.deltaLink
}

function Set-SoshikiFormGraphDeltaLink {
    param(
        [Parameter(Mandatory = $true)]
        [string]$DeltaLink,

        [string]$ScriptRoot = $PSScriptRoot
    )

    $path = Get-SoshikiFormGraphDeltaStatePath -ScriptRoot $ScriptRoot
    (@{ deltaLink = $DeltaLink; updatedUtc = (Get-Date).ToUniversalTime().ToString("o") } | ConvertTo-Json) |
        Set-Content -LiteralPath $path -Encoding UTF8
}

function Get-SoshikiFormGraphReceptionDeltaStartUrl {
    param($GraphEnv = (Get-SoshikiFormGraphEnv))

    $receptionName = Get-SoshikiReceptionFolderName
    $segments = @(
        $GraphEnv.BasePath
        $receptionName
    ) | ForEach-Object { [Uri]::EscapeDataString($_) }

    $path = ($segments -join "/")
    return "https://graph.microsoft.com/v1.0/users/$($GraphEnv.DriveUserId)/drive/root:/${path}:/delta"
}

function Invoke-SoshikiFormGraphDeltaPage {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Token,

        [Parameter(Mandatory = $true)]
        [string]$Url
    )

    return Invoke-SoshikiFormGraphApi -Method Get -Uri $Url -Token $Token
}

function Get-SoshikiFormGraphDriveItemContentBytes {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Token,

        [Parameter(Mandatory = $true)]
        [string]$DriveUserId,

        [Parameter(Mandatory = $true)]
        [string]$ItemId
    )

    $uri = "https://graph.microsoft.com/v1.0/users/$DriveUserId/drive/items/$ItemId/content"
    return Invoke-WebRequest -Method Get -Uri $uri -Headers @{ Authorization = "Bearer $Token" } -UseBasicParsing
}

function Move-SoshikiFormGraphDriveItemToProcessed {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Token,

        [Parameter(Mandatory = $true)]
        $GraphEnv,

        [Parameter(Mandatory = $true)]
        [string]$ItemId,

        [Parameter(Mandatory = $true)]
        [string]$StorageFolder,

        [Parameter(Mandatory = $true)]
        [string]$FileName
    )

    $receptionName = Get-SoshikiReceptionFolderName
    $processedName = Get-SoshikiFormProcessedFolderName
    $parentPath = "/drive/root:/$($GraphEnv.BasePath)/$receptionName/$StorageFolder/$processedName"

    $body = @{
        parentReference = @{ path = $parentPath }
        name            = $FileName
    }

    $uri = "https://graph.microsoft.com/v1.0/users/$($GraphEnv.DriveUserId)/drive/items/$ItemId"
    Invoke-SoshikiFormGraphApi -Method Patch -Uri $uri -Token $Token -Body $body | Out-Null
}

function Test-SoshikiFormGraphDeltaItemIsInboxJson {
    param(
        [Parameter(Mandatory = $true)]
        $Item
    )

    if ($Item.file -eq $null -and -not $Item.name) {
        return $false
    }
    $name = [string]$Item.name
    if (-not $name.EndsWith(".json", [StringComparison]::OrdinalIgnoreCase)) {
        return $false
    }
    if ($Item.deleted) {
        return $false
    }

    $parentPath = ""
    if ($Item.parentReference -and $Item.parentReference.path) {
        $parentPath = [string]$Item.parentReference.path
    }
    return ($parentPath -match "/json$" -or $parentPath -match "/json/")
}

function Get-SoshikiFormGraphItemStorageFolderFromParent {
    param([string]$ParentPath)

    if (-not $ParentPath) {
        return $null
    }
    $receptionName = Get-SoshikiReceptionFolderName
    $pattern = "/$receptionName/([^/]+)/json"
    if ($ParentPath -match $pattern) {
        return $Matches[1]
    }
    return $null
}
