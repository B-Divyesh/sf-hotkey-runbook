$ErrorActionPreference = "Stop"
$manifestUrl = "https://github.com/B-Divyesh/sf-hotkey-runbook/releases/latest/download/latest.json"
$workDir = Join-Path ([System.IO.Path]::GetTempPath()) ("hotkey-runbook-" + [Guid]::NewGuid())
New-Item -ItemType Directory -Path $workDir | Out-Null
try {
  $manifest = Invoke-RestMethod -Uri $manifestUrl
  $asset = $manifest.platforms.'windows-x86_64'
  if (-not $asset) { throw "The release does not contain a Windows installer." }
  $download = Join-Path $workDir $asset.file
  Write-Host "Downloading $($asset.file)..."
  Invoke-WebRequest -Uri $asset.url -OutFile $download
  $hasher = [System.Security.Cryptography.SHA256]::Create()
  try {
    $actual = [System.BitConverter]::ToString($hasher.ComputeHash([System.IO.File]::ReadAllBytes($download))).Replace("-", "").ToLowerInvariant()
  } finally {
    $hasher.Dispose()
  }
  if ($actual -ne $asset.sha256.ToLowerInvariant()) { throw "SHA-256 verification failed; nothing was installed." }
  Write-Host "SHA-256 verified. Starting the unsigned Windows installer..."
  $process = Start-Process msiexec.exe -ArgumentList "/i `"$download`" /passive" -Wait -PassThru
  if ($process.ExitCode -ne 0) { throw "The installer exited with code $($process.ExitCode)." }
  Write-Host "Installed Hotkey Runbook. Windows may show a SmartScreen notice on first launch."
} finally {
  Remove-Item -Recurse -Force $workDir -ErrorAction SilentlyContinue
}
