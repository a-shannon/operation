param(
  [Parameter(Mandatory = $true)][string]$UiRoot,
  [Parameter(Mandatory = $true)][string]$FreshOutputDirectory,
  [string]$NodeExecutable = 'node'
)
Push-Location -LiteralPath $UiRoot
try {
  $env:NODE_OPTIONS = '--import tsx'
  & $NodeExecutable (Join-Path $PSScriptRoot 'verify.mjs') $UiRoot $FreshOutputDirectory
  exit $LASTEXITCODE
} finally {
  Pop-Location
}
