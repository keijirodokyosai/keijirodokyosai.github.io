# Outlook desktop send (dynamic COM). Dot-source from send scripts.

function Send-SoshikiFormOutlookMessage {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$To,

        [Parameter(Mandatory = $true)]
        [string]$Subject,

        [Parameter(Mandatory = $true)]
        [string]$Body,

        [switch]$Send
    )

    if (-not $To) {
        throw "To address is empty"
    }

    $outlook = $null
    $mail = $null
    try {
        $outlook = [Activator]::CreateInstance([type]::GetTypeFromProgID("Outlook.Application"))
        if (-not $outlook) {
            throw "Outlook.Application is not registered (install Classic Outlook)."
        }

        $mail = $outlook.CreateItem(0)
        $mail.To = $To
        $mail.Subject = $Subject
        $mail.Body = $Body

        if ($Send) {
            $mail.Send()
            Write-Output "Outlook: sent to $To"
        }
        else {
            $mail.Display()
            Write-Output "Outlook: display draft (not sent; pass -Send to send)"
        }
    }
    finally {
        if ($mail) {
            [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($mail)
        }
        if ($outlook) {
            [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($outlook)
        }
    }
}
