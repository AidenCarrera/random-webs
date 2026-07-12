[CmdletBinding(SupportsShouldProcess)]
param(
    [string]$BaseUrl = "http://localhost:3000"
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$websitesFile = Join-Path $repoRoot "src/lib/websites.ts"

if (-not (Test-Path $websitesFile)) {
    Write-Error "Could not find src/lib/websites.ts at $websitesFile"
    exit 1
}

$content = Get-Content $websitesFile -Raw
$routePaths = @(
    [regex]::Matches($content, 'path:\s*"([^"]+)"') |
        ForEach-Object { $_.Groups[1].Value }
) | Sort-Object -Unique

$base = $BaseUrl.TrimEnd("/")
Write-Host "Found $($routePaths.Count) website(s):"

foreach ($routePath in $routePaths) {
    $url = "$base$routePath"
    Write-Host "Opening $url..."

    if ($PSCmdlet.ShouldProcess($url, "Open in the default browser")) {
        Start-Process $url
    }
}
