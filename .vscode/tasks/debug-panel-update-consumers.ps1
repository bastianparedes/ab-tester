$fnmEnvironment = fnm env --shell powershell
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to initialize fnm."; exit $LASTEXITCODE }
Invoke-Expression ($fnmEnvironment -join [Environment]::NewLine)
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to load the fnm environment."; exit $LASTEXITCODE }

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$projects = @(
  "APP02738-ab-tester-svc"
)

foreach ($project in $projects) {
  $projectPath = Join-Path $repoRoot $project
  if (-not (Test-Path $projectPath -PathType Container)) {
    Write-Error "Project directory not found: $projectPath"
    exit 1
  }

  Write-Host "Installing latest @ab-tester/debug-panel in $project"
  Push-Location $projectPath
  try {
    fnm use
    $npmExitCode = $LASTEXITCODE
    if ($npmExitCode -eq 0) {
      node --version
      $npmExitCode = $LASTEXITCODE
    }
    if ($npmExitCode -eq 0) {
      npm install @ab-tester/debug-panel@latest
      $npmExitCode = $LASTEXITCODE
    }
  }
  finally {
    Pop-Location
  }

  if ($npmExitCode -ne 0) {
    exit $npmExitCode
  }
}
