$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$content = [System.IO.File]::ReadAllText("$PSScriptRoot\index.html")

$pattern = '(?s)navigator\.serviceWorker\.addEventListener\("controllerchange", function \(\) \{ window\.dispatchEvent\(new CustomEvent\("swRefreshed"\)\); \}\);\s*\}\);'
$replacement = 'navigator.serviceWorker.addEventListener("controllerchange", function () { window.dispatchEvent(new CustomEvent("swRefreshed")); });'

if ($content -match $pattern) {
    Write-Output "Matched regex"
    $content = [System.Text.RegularExpressions.Regex]::Replace($content, $pattern, $replacement)
} else {
    Write-Output "Did not match regex"
}

[System.IO.File]::WriteAllText("$PSScriptRoot\index.html", $content, $utf8NoBom)
Write-Output "Done"

