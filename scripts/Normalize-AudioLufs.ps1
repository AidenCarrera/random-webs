param(
  [string]$InputDir = "public/lofi-pixel-study",
  [double]$TargetLufs = -14,
  [double]$TruePeak = -1.0,
  [double]$Lra = 11,
  [string]$OutputDir = "",
  [switch]$Overwrite,
  [string[]]$Extensions = @(".mp3", ".wav", ".ogg", ".m4a")
)

$ErrorActionPreference = "Stop"

function Resolve-FullPath {
  param([string]$Path)

  if ([System.IO.Path]::IsPathRooted($Path)) {
    return [System.IO.Path]::GetFullPath($Path)
  }

  return [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $Path))
}

function Get-LoudnormStats {
  param(
    [string]$FilePath,
    [double]$TargetLufs,
    [double]$TruePeak,
    [double]$Lra
  )

  $filter = "loudnorm=I=$TargetLufs`:TP=$TruePeak`:LRA=$Lra`:print_format=json"
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $output = & ffmpeg -hide_banner -nostats -i $FilePath -af $filter -f null NUL 2>&1
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }

  if ($LASTEXITCODE -ne 0) {
    throw "ffmpeg analysis failed for '$FilePath'."
  }

  $text = ($output | Out-String)
  $start = $text.IndexOf("{")
  $end = $text.LastIndexOf("}")

  if ($start -lt 0 -or $end -lt $start) {
    throw "Could not parse loudnorm JSON for '$FilePath'."
  }

  return $text.Substring($start, $end - $start + 1) | ConvertFrom-Json
}

function Get-CodecArgs {
  param([string]$Extension)

  switch ($Extension.ToLowerInvariant()) {
    ".mp3" { return @("-codec:a", "libmp3lame", "-b:a", "192k") }
    ".wav" { return @("-codec:a", "pcm_s16le") }
    ".ogg" { return @("-codec:a", "libvorbis", "-q:a", "5") }
    ".m4a" { return @("-codec:a", "aac", "-b:a", "192k") }
    default { return @("-codec:a", "copy") }
  }
}

function Invoke-FileNormalization {
  param(
    [System.IO.FileInfo]$File,
    [string]$DestinationPath,
    [double]$TargetLufs,
    [double]$TruePeak,
    [double]$Lra
  )

  Write-Host ""
  Write-Host "Analyzing: $($File.Name)"
  $stats = Get-LoudnormStats -FilePath $File.FullName -TargetLufs $TargetLufs -TruePeak $TruePeak -Lra $Lra

  Write-Host ("  Input:  {0} LUFS, {1} dBTP, LRA {2} LU" -f $stats.input_i, $stats.input_tp, $stats.input_lra)

  $filter = "loudnorm=I=$TargetLufs`:TP=$TruePeak`:LRA=$Lra`:measured_I=$($stats.input_i)`:measured_TP=$($stats.input_tp)`:measured_LRA=$($stats.input_lra)`:measured_thresh=$($stats.input_thresh)`:offset=$($stats.target_offset)`:linear=true`:print_format=summary"
  $codecArgs = Get-CodecArgs -Extension $File.Extension

  $destinationDir = Split-Path -Parent $DestinationPath
  New-Item -ItemType Directory -Force -Path $destinationDir | Out-Null

  Write-Host "Writing:   $DestinationPath"
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    & ffmpeg -hide_banner -y -i $File.FullName -af $filter @codecArgs $DestinationPath
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }

  if ($LASTEXITCODE -ne 0) {
    throw "ffmpeg normalization failed for '$($File.FullName)'."
  }
}

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  throw "ffmpeg was not found on PATH. Install ffmpeg or add it to PATH, then rerun this script."
}

$resolvedInputDir = Resolve-FullPath $InputDir

if (-not (Test-Path -LiteralPath $resolvedInputDir -PathType Container)) {
  throw "InputDir does not exist: $resolvedInputDir"
}

if (-not $OutputDir -and -not $Overwrite) {
  $OutputDir = Join-Path $resolvedInputDir "normalized"
}

if ($OutputDir) {
  $resolvedOutputDir = Resolve-FullPath $OutputDir
} else {
  $resolvedOutputDir = ""
}

$files = Get-ChildItem -LiteralPath $resolvedInputDir -File |
  Where-Object { $Extensions -contains $_.Extension.ToLowerInvariant() }

if ($files.Count -eq 0) {
  Write-Host "No matching audio files found in $resolvedInputDir"
  exit 0
}

Write-Host "Normalizing $($files.Count) file(s)"
Write-Host "Target: $TargetLufs LUFS, true peak: $TruePeak dBTP, LRA: $Lra LU"

foreach ($file in $files) {
  if ($Overwrite) {
    $tempPath = Join-Path $file.DirectoryName (".$($file.BaseName).normalized$($file.Extension)")
    Invoke-FileNormalization -File $file -DestinationPath $tempPath -TargetLufs $TargetLufs -TruePeak $TruePeak -Lra $Lra
    Move-Item -LiteralPath $tempPath -Destination $file.FullName -Force
  } else {
    $destinationPath = Join-Path $resolvedOutputDir $file.Name
    
    # Check if the file already exists in the destination folder
    if (Test-Path -LiteralPath $destinationPath) {
      Write-Host ""
      Write-Host "Skipping:  $($file.Name) (Already exists in output directory)"
    } else {
      Invoke-FileNormalization -File $file -DestinationPath $destinationPath -TargetLufs $TargetLufs -TruePeak $TruePeak -Lra $Lra
    }
  }
}

Write-Host ""
Write-Host "Done."