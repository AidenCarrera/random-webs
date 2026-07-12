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

& git -C $repoRoot rev-parse --verify HEAD *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Could not find a Git commit to compare against."
    exit 1
}

# Include staged and unstaged changes to tracked files, plus untracked files.
$trackedChanges = @(& git -C $repoRoot diff --name-only --diff-filter=ACMRTUXB HEAD --)
if ($LASTEXITCODE -ne 0) {
    Write-Error "Could not read changed files from Git."
    exit 1
}

$untrackedChanges = @(& git -C $repoRoot ls-files --others --exclude-standard)
if ($LASTEXITCODE -ne 0) {
    Write-Error "Could not read untracked files from Git."
    exit 1
}

$changedFiles = @($trackedChanges + $untrackedChanges) |
    ForEach-Object { $_.Replace("\", "/") } |
    Sort-Object -Unique

$content = Get-Content $websitesFile -Raw
$routePaths = @(
    [regex]::Matches($content, 'path:\s*"([^"]+)"') |
        ForEach-Object { $_.Groups[1].Value }
) | Sort-Object -Unique

$modifiedRoutes = @(
    foreach ($routePath in $routePaths) {
        $siteDirectory = "src/app$routePath"
        $isModified = $changedFiles | Where-Object {
            $_ -eq $siteDirectory -or $_.StartsWith("$siteDirectory/", [System.StringComparison]::OrdinalIgnoreCase)
        } | Select-Object -First 1

        if ($isModified) {
            $routePath
        }
    }
) | Sort-Object

if ($modifiedRoutes.Count -eq 0) {
    Write-Host "No modified websites found since the last commit."
    exit 0
}

$base = $BaseUrl.TrimEnd("/")
Write-Host "Found $($modifiedRoutes.Count) modified website(s) since the last commit:"

foreach ($routePath in $modifiedRoutes) {
    $url = "$base$routePath"
    Write-Host "Opening $url..."

    if ($PSCmdlet.ShouldProcess($url, "Open in the default browser")) {
        Start-Process $url
    }
}
