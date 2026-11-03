$fnmEnvironment = fnm env --shell powershell
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to initialize fnm."; exit $LASTEXITCODE }
Invoke-Expression ($fnmEnvironment -join [Environment]::NewLine)
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to load the fnm environment."; exit $LASTEXITCODE }

fnm use
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to select the Node.js version from .nvmrc."; exit $LASTEXITCODE }
node --version
if ($LASTEXITCODE -ne 0) { Write-Error "Node.js is unavailable after selecting the fnm version."; exit $LASTEXITCODE }

npm version patch --no-git-tag-version
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm i
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run lint:fix
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$buildPath = Join-Path (Get-Location).Path "dist"
$sourceNpmrc = Join-Path (Get-Location).Path ".npmrc"
$buildNpmrc = Join-Path $buildPath ".npmrc"
if (-not (Test-Path $buildPath -PathType Container)) {
  Write-Error "Build directory not found: $buildPath"
  exit 1
}

if (-not (Test-Path $sourceNpmrc -PathType Leaf)) {
  Write-Error "Project .npmrc not found: $sourceNpmrc"
  exit 1
}

if (-not (Test-Path (Join-Path $buildPath "package.json") -PathType Leaf)) {
  Write-Error "Build package manifest not found: $(Join-Path $buildPath 'package.json')"
  exit 1
}

if (Test-Path $buildNpmrc) {
  Write-Error "An .npmrc already exists in the build directory; refusing to overwrite it."
  exit 1
}

Copy-Item -Path $sourceNpmrc -Destination $buildNpmrc -ErrorAction Stop
try {
  Push-Location $buildPath
  try {
    npm publish --access public
    $publishExitCode = $LASTEXITCODE
  }
  finally {
    Pop-Location
  }
}
finally {
  Remove-Item -Path $buildNpmrc -ErrorAction Stop
}

exit $publishExitCode
