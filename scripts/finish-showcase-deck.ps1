param(
  [string]$Images = $env:SHOWCASE_IMAGE_DIR,
  [string]$Out = $env:SHOWCASE_DECK_OUT
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$PythonCandidates = @(
  "python",
  "py"
)

$Python = $null
foreach ($Candidate in $PythonCandidates) {
  if ($Candidate -in @("python", "py")) {
    $Command = Get-Command $Candidate -ErrorAction SilentlyContinue
    if ($Command) {
      $Python = $Command.Source
      break
    }
  } elseif (Test-Path -LiteralPath $Candidate) {
    $Python = $Candidate
    break
  }
}

if (-not $Python) {
  throw "Python was not found. Install Python or restore the bundled Codex runtime."
}

Push-Location $RepoRoot
try {
  $BuildArgs = @("scripts\build-showcase-deck.py")
  if ($Images) {
    $BuildArgs += @("--images", $Images)
  }
  if ($Out) {
    $BuildArgs += @("--out", $Out)
  }

  & $Python @BuildArgs

  $DeckPath = if ($Out) {
    if ([System.IO.Path]::IsPathRooted($Out)) {
      $Out
    } else {
      Join-Path $RepoRoot $Out
    }
  } else {
    Join-Path $RepoRoot "artifacts\showcase-deck\disaster-response-dashboard-showcase.pptx"
  }
  if (-not (Test-Path -LiteralPath $DeckPath)) {
    throw "Deck build completed without producing: $DeckPath"
  }

  Write-Host ""
  Write-Host "Showcase deck ready:"
  Write-Host $DeckPath
  Write-Host ""
  Write-Host "Final manual check: open the PPTX and visually spot-check all 8 slides."
} finally {
  Pop-Location
}
