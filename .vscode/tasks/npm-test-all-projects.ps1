$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$excludedDirectories = @(".git", "node_modules", ".next", "coverage", "dist", "build")
$directoriesToVisit = [System.Collections.Generic.Stack[string]]::new()
$testProjects = [System.Collections.Generic.List[object]]::new()
$directoriesToVisit.Push($repoRoot)

while ($directoriesToVisit.Count -gt 0) {
  $directory = $directoriesToVisit.Pop()
  $manifestPath = Join-Path $directory "package.json"

  if (Test-Path $manifestPath -PathType Leaf) {
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    if (-not [string]::IsNullOrWhiteSpace($manifest.scripts.test)) {
      $testProjects.Add([PSCustomObject]@{
        Name = $manifest.name
        Path = $directory
      })
    }
  }

  Get-ChildItem -LiteralPath $directory -Directory -Force |
    Where-Object { $_.Name -notin $excludedDirectories } |
    ForEach-Object { $directoriesToVisit.Push($_.FullName) }
}

$testProjects = @($testProjects | Sort-Object Path)
if ($testProjects.Count -eq 0) {
  Write-Host "No packages with an npm test script were found."
  exit 0
}

Get-Command fnm -ErrorAction Stop | Out-Null
$fnmEnvironment = fnm env --shell powershell
if ($LASTEXITCODE -ne 0) {
  throw "Failed to initialize fnm."
}
Invoke-Expression ($fnmEnvironment -join [Environment]::NewLine)

$results = [System.Collections.Generic.List[object]]::new()
foreach ($project in $testProjects) {
  $failure = $null
  $locationPushed = $false

  try {
    Push-Location $project.Path
    $locationPushed = $true

    fnm use
    if ($LASTEXITCODE -ne 0) {
      throw "fnm use failed."
    }

    $nodeVersion = node --version
    if ($LASTEXITCODE -ne 0) {
      throw "Could not read the Node.js version."
    }
    Write-Host "[$($project.Name)] Using Node $nodeVersion"
    Write-Host "[$($project.Name)] Running npm run test"

    npm run test
    if ($LASTEXITCODE -ne 0) {
      throw "npm run test failed with exit code $LASTEXITCODE."
    }
  }
  catch {
    $failure = $_.Exception.Message
  }
  finally {
    if ($locationPushed) {
      Pop-Location
    }
  }

  $results.Add([PSCustomObject]@{
    Project = $project.Name
    Success = [string]::IsNullOrEmpty($failure)
    Error   = $failure
  })
}

foreach ($result in $results) {
  if ($result.Success) {
    Write-Host "[$($result.Project)] Tests passed."
  }
  else {
    Write-Error "[$($result.Project)] $($result.Error)"
  }
}

if (@($results | Where-Object { -not $_.Success }).Count -gt 0) {
  exit 1
}
