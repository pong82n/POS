$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$content = [System.IO.File]::ReadAllText("$PSScriptRoot\index.html")

$target = @"
      navigator.serviceWorker.addEventListener("controllerchange", function () { window.dispatchEvent(new CustomEvent("swRefreshed")); });
      });
"@

$replacement = @"
      navigator.serviceWorker.addEventListener("controllerchange", function () { window.dispatchEvent(new CustomEvent("swRefreshed")); });
"@

$content = $content.Replace($target, $replacement)
[System.IO.File]::WriteAllText("$PSScriptRoot\index.html", $content, $utf8NoBom)
Write-Output "Cleaned up"

