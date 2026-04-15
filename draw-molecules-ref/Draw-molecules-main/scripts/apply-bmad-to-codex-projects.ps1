param(
    [string]$CodexConfigPath = "$env:USERPROFILE\.codex\config.toml",
    [string]$Modules = "bmm",
    [string]$Tool = "codex",
    [string]$CommunicationLanguage = "French",
    [string]$DocumentOutputLanguage = "French",
    [string]$OutputFolder = "_bmad-output",
    [switch]$WhatIf
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $CodexConfigPath)) {
    throw "Codex config not found at '$CodexConfigPath'."
}

$configContent = Get-Content -LiteralPath $CodexConfigPath -Raw
$projectMatches = [regex]::Matches($configContent, "(?m)^\[projects\.'(.+)'\]$")
$projectPaths = $projectMatches |
    ForEach-Object { $_.Groups[1].Value } |
    Sort-Object -Unique

if (-not $projectPaths) {
    Write-Host "No Codex projects were found in '$CodexConfigPath'."
    exit 0
}

foreach ($projectPath in $projectPaths) {
    if (-not (Test-Path -LiteralPath $projectPath)) {
        Write-Warning "Skipping missing project path: $projectPath"
        continue
    }

    $resolvedProjectPath = (Resolve-Path -LiteralPath $projectPath).Path
    $action = if (Test-Path -LiteralPath (Join-Path $resolvedProjectPath "_bmad")) { "update" } else { "install" }

    $args = @(
        "bmad-method",
        "install",
        "--directory", $resolvedProjectPath,
        "--modules", $Modules,
        "--tools", $Tool,
        "--action", $action,
        "--communication-language", $CommunicationLanguage,
        "--document-output-language", $DocumentOutputLanguage,
        "--output-folder", $OutputFolder,
        "--yes"
    )

    Write-Host "Applying BMAD to $resolvedProjectPath ($action)..."

    if ($WhatIf) {
        Write-Host ("npx " + ($args -join " "))
        continue
    }

    & npx @args

    if ($LASTEXITCODE -ne 0) {
        throw "BMAD installation failed for '$resolvedProjectPath'."
    }
}

Write-Host "BMAD application finished."
