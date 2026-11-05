$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$projects = @(
  "APP02738-ab-tester-constants",
  "APP02738-ab-tester-debug-panel",
  "APP02738-ab-tester-svc",
  "APP02738-ab-tester-ui"
)

$jobs = foreach ($project in $projects) {
  $projectPath = Join-Path $repoRoot $project
  Start-Job -Name "npm-ci-$project" -ArgumentList $project, $projectPath -ScriptBlock {
    param($projectName, $projectPath)

    $failure = $null
    $locationPushed = $false

    try {
      Get-Command fnm -ErrorAction Stop | Out-Null

      if (-not (Test-Path $projectPath -PathType Container)) {
        throw "Project directory not found: $projectPath"
      }

      Push-Location $projectPath
      $locationPushed = $true

      $fnmEnvironment = fnm env --shell powershell
      if ($LASTEXITCODE -ne 0) {
        throw "Failed to initialize fnm in $projectName."
      }
      Invoke-Expression ($fnmEnvironment -join [Environment]::NewLine)

      fnm use
      if ($LASTEXITCODE -ne 0) {
        throw "fnm use failed in $projectName."
      }

      $nodeVersion = node --version
      if ($LASTEXITCODE -ne 0) {
        throw "Could not read the Node.js version in $projectName."
      }
      Write-Output "Using Node $nodeVersion in $projectName"

      Write-Output "Running npm ci in $projectName"
      npm ci
      if ($LASTEXITCODE -ne 0) {
        throw "npm ci failed in $projectName with exit code $LASTEXITCODE."
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

    [PSCustomObject]@{
      Project = $projectName
      Success = [string]::IsNullOrEmpty($failure)
      Error   = $failure
    }
  }
}

Wait-Job -Job $jobs | Out-Null
$jobOutput = Receive-Job -Job $jobs
$results = @($jobOutput | Where-Object {
  $null -ne $_.PSObject.Properties["Success"]
})
Remove-Job -Job $jobs

foreach ($result in $results) {
  if ($result.Success) {
    Write-Host "[$($result.Project)] npm ci completed successfully."
  }
  else {
    Write-Error "[$($result.Project)] $($result.Error)"
  }
}

if ($results.Count -ne $projects.Count -or @($results | Where-Object { -not $_.Success }).Count -gt 0) {
  exit 1
}
