$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$content = [System.IO.File]::ReadAllText("$PSScriptRoot\index.html")

$pattern = '(?m)^\s*<span>\{isCheckingUpdate \? .*Sync & Check for Updates Now"\}\</span>'
$replacement = '                <span>{isCheckingUpdate ? "Checking Webpage for Changes..." : "Sync & Check for Updates Now"}</span>'

if ($content -match $pattern) {
    Write-Output "Matched regex"
    $content = [System.Text.RegularExpressions.Regex]::Replace($content, $pattern, $replacement)
} else {
    Write-Output "Did not match regex"
}

[System.IO.File]::WriteAllText("$PSScriptRoot\index.html", $content, $utf8NoBom)
Write-Output "Done"
