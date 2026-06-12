Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$PythonCandidates = @(
  "C:\Users\point\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe",
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
  & $Python "scripts\build-showcase-deck.py"

  $DeckPath = Join-Path $RepoRoot "artifacts\showcase-deck\disaster-response-dashboard-showcase.pptx"
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
