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

npm publish --access public
exit $LASTEXITCODE
