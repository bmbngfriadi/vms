Add-Type -AssemblyName System.Drawing

function Create-BarcodeScanIcon([int]$targetSize) {
    $masterSize = 1024
    $bmp = New-Object System.Drawing.Bitmap($masterSize, $masterSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)

    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Helper: Create Rounded Rectangle GraphicsPath
    function Get-RoundedRectPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $d = [float]($r * 2)
        $path.AddArc([float]$x, [float]$y, [float]$d, [float]$d, [float]180, [float]90)
        $path.AddArc([float]($x + $w - $d), [float]$y, [float]$d, [float]$d, [float]270, [float]90)
        $path.AddArc([float]($x + $w - $d), [float]($y + $h - $d), [float]$d, [float]$d, [float]0, [float]90)
        $path.AddArc([float]$x, [float]($y + $h - $d), [float]$d, [float]$d, [float]90, [float]90)
        $path.CloseFigure()
        return $path
    }

    # 1. Base Squircle (Clean White Mobile App Tile Background)
    [float]$bgPad = 48
    [float]$bgSize = $masterSize - ($bgPad * 2)
    [float]$bgRadius = 208
    $bgPath = Get-RoundedRectPath $bgPad $bgPad $bgSize $bgSize $bgRadius

    # Outer soft drop shadow (app icon depth)
    for ($s = 1; $s -le 4; $s++) {
        [int]$sAlpha = 14 - ($s * 2.5)
        $sBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($sAlpha, 0, 0, 0))
        $sPath = Get-RoundedRectPath ($bgPad - $s * 3) ($bgPad + $s * 5) ($bgSize + $s * 6) ($bgSize + $s * 6) ($bgRadius + $s * 2)
        $g.FillPath($sBrush, $sPath)
        $sBrush.Dispose()
        $sPath.Dispose()
    }

    # Fill White Squircle with subtle gradient
    $bgRect = New-Object System.Drawing.RectangleF($bgPad, $bgPad, $bgSize, $bgSize)
    $cTop = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)
    $cBot = [System.Drawing.Color]::FromArgb(255, 248, 250, 252) # Soft Slate-50
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($bgRect, $cTop, $cBot, [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
    $g.FillPath($bgBrush, $bgPath)
    $bgBrush.Dispose()

    # Subtle inner border for crisp contrast
    $rimPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 226, 232, 240), 8) # Slate-200
    $g.DrawPath($rimPen, $bgPath)
    $rimPen.Dispose()
    $bgPath.Dispose()

    # 2. Barcode Scan Viewfinder (4 Corner Brackets)
    # Slate-800 Charcoal: #1e293b
    $bracketPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 30, 41, 59), 36)
    $bracketPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $bracketPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $bracketPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    # Top-Left Bracket
    $tlPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $tlPath.AddLine(340, 220, 260, 220)
    $tlPath.AddArc(220, 220, 80, 80, 270, -90)
    $tlPath.AddLine(220, 260, 220, 340)
    $g.DrawPath($bracketPen, $tlPath)
    $tlPath.Dispose()

    # Top-Right Bracket
    $trPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $trPath.AddLine(684, 220, 764, 220)
    $trPath.AddArc(724, 220, 80, 80, 270, 90)
    $trPath.AddLine(804, 260, 804, 340)
    $g.DrawPath($bracketPen, $trPath)
    $trPath.Dispose()

    # Bottom-Left Bracket
    $blPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $blPath.AddLine(220, 684, 220, 764)
    $blPath.AddArc(220, 724, 80, 80, 180, -90)
    $blPath.AddLine(260, 804, 340, 804)
    $g.DrawPath($bracketPen, $blPath)
    $blPath.Dispose()

    # Bottom-Right Bracket
    $brPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $brPath.AddLine(804, 684, 804, 764)
    $brPath.AddArc(724, 724, 80, 80, 0, 90)
    $brPath.AddLine(764, 804, 684, 804)
    $g.DrawPath($bracketPen, $brPath)
    $brPath.Dispose()

    $bracketPen.Dispose()

    # 3. Vertical Barcode Bars (Crisp Charcoal Rhythm)
    $barBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 30, 41, 59))
    [float]$barY = 300
    [float]$barH = 424

    $bars = @(
        @{x=290; w=24; r=8},
        @{x=330; w=10; r=5},
        @{x=356; w=16; r=6},
        @{x=392; w=26; r=8},
        @{x=434; w=10; r=5},
        @{x=460; w=18; r=6},
        @{x=494; w=10; r=5},
        @{x=520; w=26; r=8},
        @{x=562; w=10; r=5},
        @{x=588; w=16; r=6},
        @{x=620; w=24; r=8},
        @{x=660; w=10; r=5},
        @{x=686; w=18; r=6},
        @{x=720; w=22; r=7}
    )

    foreach ($b in $bars) {
        $bP = Get-RoundedRectPath $b.x $barY $b.w $barH $b.r
        $g.FillPath($barBrush, $bP)
        $bP.Dispose()
    }
    $barBrush.Dispose()

    # 4. Dynamic Red Laser Scan Beam Across the Center (Cemindo Red #dc2626 / #ef4444)
    # Ambient Soft Red Glow
    $glowPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(75, 239, 68, 68), 32)
    $glowPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $glowPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($glowPen, 180, 512, 844, 512)
    $glowPen.Dispose()

    # Solid Vibrant Core Laser Beam
    $corePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 220, 38, 38), 16) # Cemindo Red #dc2626
    $corePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $corePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($corePen, 180, 512, 844, 512)
    $corePen.Dispose()

    # Center Laser Flare (White Hot Line)
    $flarePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 255, 255), 6)
    $flarePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $flarePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($flarePen, 360, 512, 664, 512)
    $flarePen.Dispose()

    # Center Lens Dot
    $dotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $g.FillEllipse($dotBrush, 503, 503, 18, 18)
    $dotBrush.Dispose()

    $g.Dispose()

    # Scale to Target Size with Highest Quality Resampling
    if ($targetSize -eq $masterSize) {
        return $bmp
    } else {
        $scaledBmp = New-Object System.Drawing.Bitmap($targetSize, $targetSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $scaledG = [System.Drawing.Graphics]::FromImage($scaledBmp)
        $scaledG.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $scaledG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $scaledG.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $scaledG.DrawImage($bmp, 0, 0, $targetSize, $targetSize)
        $scaledG.Dispose()
        $bmp.Dispose()
        return $scaledBmp
    }
}

# Generate all required PWA icon sizes
Write-Host "Generating Barcode Scan PWA Icons for VMS Cemindo..."

$sizes = @(
    @{name="frontend/public/icon-512.png"; size=512},
    @{name="frontend/public/icon-192.png"; size=192},
    @{name="frontend/public/apple-touch-icon.png"; size=180},
    @{name="frontend/public/favicon.png"; size=64}
)

foreach ($item in $sizes) {
    Write-Host "Creating $($item.name) ($($item.size)x$($item.size))..."
    $iconBmp = Create-BarcodeScanIcon -targetSize $item.size
    $iconBmp.Save($item.name, [System.Drawing.Imaging.ImageFormat]::Png)
    $iconBmp.Dispose()
}

Write-Host "All Barcode Scan PWA icons successfully generated!"
