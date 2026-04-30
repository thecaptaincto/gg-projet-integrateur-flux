Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

function New-Canvas {
  param(
    [int]$Size,
    [System.Drawing.Color]$BackgroundColor
  )

  $bitmap = [System.Drawing.Bitmap]::new($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.Clear($BackgroundColor)

  return @{
    Bitmap = $bitmap
    Graphics = $graphics
  }
}

function Draw-FluxMark {
  param(
    [System.Drawing.Graphics]$Graphics,
    [int]$Size,
    [System.Drawing.Color]$StrokeColor,
    [double]$ContentScale = 1.0,
    [double]$OffsetX = 0.0,
    [double]$OffsetY = 0.0
  )

  $state = $Graphics.Save()
  $translateX = [float](($Size * (1.0 - $ContentScale) / 2.0) + ($Size * $OffsetX))
  $translateY = [float](($Size * (1.0 - $ContentScale) / 2.0) + ($Size * $OffsetY))
  $Graphics.TranslateTransform($translateX, $translateY)
  $Graphics.ScaleTransform([float]$ContentScale, [float]$ContentScale)

  $pen = [System.Drawing.Pen]::new($StrokeColor, [float]($Size * 0.058))
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

  $curve = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $curve.AddBezier(
    [float]($Size * 0.615), [float]($Size * 0.715),
    [float]($Size * 0.56), [float]($Size * 0.64),
    [float]($Size * 0.44), [float]($Size * 0.57),
    [float]($Size * 0.35), [float]($Size * 0.51)
  )
  $curve.AddBezier(
    [float]($Size * 0.35), [float]($Size * 0.51),
    [float]($Size * 0.26), [float]($Size * 0.44),
    [float]($Size * 0.25), [float]($Size * 0.285),
    [float]($Size * 0.31), [float]($Size * 0.19)
  )
  $curve.AddBezier(
    [float]($Size * 0.31), [float]($Size * 0.19),
    [float]($Size * 0.42), [float]($Size * 0.10),
    [float]($Size * 0.57), [float]($Size * 0.07),
    [float]($Size * 0.71), [float]($Size * 0.09)
  )
  $curve.AddBezier(
    [float]($Size * 0.71), [float]($Size * 0.09),
    [float]($Size * 0.81), [float]($Size * 0.12),
    [float]($Size * 0.88), [float]($Size * 0.22),
    [float]($Size * 0.885), [float]($Size * 0.31)
  )
  $curve.AddBezier(
    [float]($Size * 0.885), [float]($Size * 0.31),
    [float]($Size * 0.89), [float]($Size * 0.35),
    [float]($Size * 0.875), [float]($Size * 0.385),
    [float]($Size * 0.84), [float]($Size * 0.40)
  )
  $Graphics.DrawPath($pen, $curve)

  [System.Drawing.PointF[]]$square = @(
    [System.Drawing.PointF]::new($Size * 0.115, $Size * 0.675),
    [System.Drawing.PointF]::new($Size * 0.46, $Size * 0.89),
    [System.Drawing.PointF]::new($Size * 0.615, $Size * 0.715)
  )
  $Graphics.DrawLines($pen, $square)

  $Graphics.DrawLine(
    $pen,
    [System.Drawing.PointF]::new($Size * 0.70, $Size * 0.35),
    [System.Drawing.PointF]::new($Size * 0.84, $Size * 0.40)
  )
  $Graphics.DrawLine(
    $pen,
    [System.Drawing.PointF]::new($Size * 0.84, $Size * 0.40),
    [System.Drawing.PointF]::new($Size * 0.885, $Size * 0.225)
  )

  $curve.Dispose()
  $pen.Dispose()
  $Graphics.Restore($state)
}

function New-IconBitmap {
  param(
    [int]$Size
  )

  $background = [System.Drawing.ColorTranslator]::FromHtml('#3f0f56')
  $stroke = [System.Drawing.ColorTranslator]::FromHtml('#dbc4ff')
  $canvas = New-Canvas -Size $Size -BackgroundColor $background
  Draw-FluxMark -Graphics $canvas.Graphics -Size $Size -StrokeColor $stroke -ContentScale 0.92 -OffsetX -0.01 -OffsetY 0.01
  $canvas.Graphics.Dispose()
  return $canvas.Bitmap
}

function New-AdaptiveForegroundBitmap {
  param(
    [int]$Size
  )

  $transparent = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
  $stroke = [System.Drawing.ColorTranslator]::FromHtml('#dbc4ff')
  $canvas = New-Canvas -Size $Size -BackgroundColor $transparent
  Draw-FluxMark -Graphics $canvas.Graphics -Size $Size -StrokeColor $stroke -ContentScale 0.76 -OffsetX -0.01 -OffsetY 0.03
  $canvas.Graphics.Dispose()
  return $canvas.Bitmap
}

function Save-ResizedPng {
  param(
    [System.Drawing.Bitmap]$Source,
    [int]$Size,
    [string]$Path
  )

  $target = [System.Drawing.Bitmap]::new($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($target)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.DrawImage($Source, 0, 0, $Size, $Size)

  $directory = Split-Path -Parent $Path
  if (-not (Test-Path $directory)) {
    New-Item -ItemType Directory -Path $directory | Out-Null
  }

  $target.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $target.Dispose()
}

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$androidRes = Join-Path $root 'android\app\src\main\res'
$iosIconSet = Join-Path $root 'ios\Flux\Images.xcassets\AppIcon.appiconset'
$assetIcon = Join-Path $root 'assets\app-icon.png'
$adaptiveForegroundPath = Join-Path $androidRes 'drawable\ic_launcher_foreground.png'

$base = New-IconBitmap -Size 1024
$foreground = New-AdaptiveForegroundBitmap -Size 432
try {
  Save-ResizedPng -Source $base -Size 1024 -Path $assetIcon
  Save-ResizedPng -Source $foreground -Size 432 -Path $adaptiveForegroundPath

  $androidTargets = @(
    @{ Size = 48; Folder = 'mipmap-mdpi'; Name = 'ic_launcher.png' },
    @{ Size = 72; Folder = 'mipmap-hdpi'; Name = 'ic_launcher.png' },
    @{ Size = 96; Folder = 'mipmap-xhdpi'; Name = 'ic_launcher.png' },
    @{ Size = 144; Folder = 'mipmap-xxhdpi'; Name = 'ic_launcher.png' },
    @{ Size = 192; Folder = 'mipmap-xxxhdpi'; Name = 'ic_launcher.png' },
    @{ Size = 48; Folder = 'mipmap-mdpi'; Name = 'ic_launcher_round.png' },
    @{ Size = 72; Folder = 'mipmap-hdpi'; Name = 'ic_launcher_round.png' },
    @{ Size = 96; Folder = 'mipmap-xhdpi'; Name = 'ic_launcher_round.png' },
    @{ Size = 144; Folder = 'mipmap-xxhdpi'; Name = 'ic_launcher_round.png' },
    @{ Size = 192; Folder = 'mipmap-xxxhdpi'; Name = 'ic_launcher_round.png' }
  )

  foreach ($target in $androidTargets) {
    $path = Join-Path (Join-Path $androidRes $target.Folder) $target.Name
    Save-ResizedPng -Source $base -Size $target.Size -Path $path
  }

  $iosTargets = @(
    @{ Size = 40; Name = 'Icon-App-20x20@2x.png' },
    @{ Size = 60; Name = 'Icon-App-20x20@3x.png' },
    @{ Size = 58; Name = 'Icon-App-29x29@2x.png' },
    @{ Size = 87; Name = 'Icon-App-29x29@3x.png' },
    @{ Size = 80; Name = 'Icon-App-40x40@2x.png' },
    @{ Size = 120; Name = 'Icon-App-40x40@3x.png' },
    @{ Size = 120; Name = 'Icon-App-60x60@2x.png' },
    @{ Size = 180; Name = 'Icon-App-60x60@3x.png' },
    @{ Size = 1024; Name = 'Icon-App-1024x1024@1x.png' }
  )

  foreach ($target in $iosTargets) {
    $path = Join-Path $iosIconSet $target.Name
    Save-ResizedPng -Source $base -Size $target.Size -Path $path
  }
}
finally {
  $base.Dispose()
  $foreground.Dispose()
}
