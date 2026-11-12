Add-Type -AssemblyName System.Drawing

function Create-VmsKioskIcon([int]$targetSize) {
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

    # 1. Base Squircle (Crisp White Mobile App Tile Background)
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

    # Subtle inner border for contrast
    $rimPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 226, 232, 240), 8) # Slate-200
    $g.DrawPath($rimPen, $bgPath)
    $rimPen.Dispose()
    $bgPath.Dispose()

    # 2. Base Pedestal Plate (Sturdy Horizontal Metal Foot)
    [float]$baseX = 240
    [float]$baseY = 816
    [float]$baseW = 520
    [float]$baseH = 40
    $basePath = Get-RoundedRectPath $baseX $baseY $baseW $baseH 16
    $baseBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 30, 41, 59)) # Slate-800
    $g.FillPath($baseBrush, $basePath)
    $baseBrush.Dispose()
    $basePath.Dispose()

    # 3. Kiosk Cabinet Body (Slanted Industrial Head & Vertical Frame)
    $bodyPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $bodyPath.AddLine(304, 816, 304, 280)
    $bodyPath.AddBezier(304, 280, 304, 216, 368, 208, 368, 208)
    $bodyPath.AddLine(368, 208, 600, 184)
    $bodyPath.AddBezier(600, 184, 652, 180, 652, 232, 652, 232)
    $bodyPath.AddLine(652, 232, 652, 816)
    $bodyPath.CloseFigure()

    # Fill Kiosk Body
    $bodyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 250, 250, 252))
    $g.FillPath($bodyBrush, $bodyPath)
    $bodyBrush.Dispose()

    # Draw Dark Charcoal Outline
    $bodyPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 30, 41, 59), 28)
    $bodyPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $bodyPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $bodyPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawPath($bodyPen, $bodyPath)
    $bodyPen.Dispose()
    $bodyPath.Dispose()

    # Top Cap Seam Line
    $seamPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 203, 213, 225), 8) # Slate-300
    $seamPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $seamPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($seamPen, 312, 284, 644, 250)
    $seamPen.Dispose()

    # 4. Interactive Display Screen (Glass Panel with Ambient Glow)
    [float]$scrX = 360
    [float]$scrY = 296
    [float]$scrW = 236
    [float]$scrH = 336
    [float]$scrR = 32
    $scrPath = Get-RoundedRectPath $scrX $scrY $scrW $scrH $scrR

    # Screen Fill
    $scrBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $g.FillPath($scrBrush, $scrPath)
    $scrBrush.Dispose()

    # Soft Red Screen Radial Glow
    $scrGlow = New-Object System.Drawing.Drawing2D.PathGradientBrush($scrPath)
    $scrGlow.CenterColor = [System.Drawing.Color]::FromArgb(45, 239, 68, 68) # Red glow
    $scrGlow.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 255, 255, 255))
    $scrGlow.CenterPoint = New-Object System.Drawing.PointF(478.0, 464.0)
    $g.FillPath($scrGlow, $scrPath)
    $scrGlow.Dispose()

    # Screen Outline Bezel
    $scrPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 51, 65, 85), 12) # Slate-700
    $g.DrawPath($scrPen, $scrPath)
    $scrPen.Dispose()
    $scrPath.Dispose()

    # 5. Central VMS Emblem: Bold Red Visitor Pass Card + QR Scan Matrix
    [float]$cardX = 406
    [float]$cardY = 364
    [float]$cardW = 144
    [float]$cardH = 192
    [float]$cardR = 26
    $cardPath = Get-RoundedRectPath $cardX $cardY $cardW $cardH $cardR

    # Red Badge Outline (Cemindo Red #dc2626)
    $badgePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 220, 38, 38), 14)
    $badgePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $g.DrawPath($badgePen, $cardPath)
    $badgePen.Dispose()
    $cardPath.Dispose()

    # Top Lanyard / Pass Clip Slot
    $slotPath = Get-RoundedRectPath 454 374 48 12 6
    $redBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 220, 38, 38))
    $g.FillPath($redBrush, $slotPath)
    $slotPath.Dispose()

    # QR Matrix Finder Targets (Top-Left, Top-Right, Bottom-Left)
    function Draw-QrTarget([float]$tx, [float]$ty) {
        $outPath = Get-RoundedRectPath $tx $ty 36 36 6
        $g.FillPath($redBrush, $outPath)
        $outPath.Dispose()

        $inPath = Get-RoundedRectPath ($tx + 7) ($ty + 7) 22 22 3
        $whiteB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
        $g.FillPath($whiteB, $inPath)
        $whiteB.Dispose()
        $inPath.Dispose()

        $dotPath = Get-RoundedRectPath ($tx + 12) ($ty + 12) 12 12 2
        $g.FillPath($redBrush, $dotPath)
        $dotPath.Dispose()
    }

    # Draw QR Targets
    Draw-QrTarget 424 404
    Draw-QrTarget 496 404
    Draw-QrTarget 424 496

    # Bottom-Right RFID Chip / Data Blocks
    $chipPath = Get-RoundedRectPath 498 500 32 32 4
    $g.FillPath($redBrush, $chipPath)
    $chipPath.Dispose()

    $chipInner = Get-RoundedRectPath 504 506 20 20 2
    $chipWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $g.FillPath($chipWhite, $chipInner)
    $chipWhite.Dispose()
    $chipInner.Dispose()

    $chipCore = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 220, 38, 38))
    $g.FillRectangle($chipCore, 509, 511, 10, 10)
    $chipCore.Dispose()

    # Glowing Red Laser Scan Beam
    $beamPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 239, 68, 68), 8) # Red-500
    $beamPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $beamPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($beamPen, 384, 460, 572, 460)
    $beamPen.Dispose()

    # Center focus laser lens dot
    $lensDot = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $g.FillEllipse($lensDot, 471, 453, 14, 14)
    $lensDot.Dispose()

    # 6. Status LEDs (Green Check & Red Scan Alert)
    $greenBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 16, 185, 129)) # Emerald-500
    $g.FillEllipse($greenBrush, 432, 680, 24, 24)
    $greenBrush.Dispose()

    $ledRedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 239, 68, 68)) # Red-500
    $g.FillEllipse($ledRedBrush, 500, 680, 24, 24)
    $ledRedBrush.Dispose()

    # 7. Thermal Pass Ticket / Visitor Badge Slot
    $slotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 30, 41, 59)) # Slate-800
    $slotP = Get-RoundedRectPath 388 728 180 18 9
    $g.FillPath($slotBrush, $slotP)
    $slotBrush.Dispose()
    $slotP.Dispose()

    # Printed pass preview lip
    $passLip = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 203, 213, 225), 6)
    $passLip.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $passLip.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($passLip, 408, 764, 548, 764)
    $passLip.Dispose()

    # 8. Docked Side Handheld Barcode Scanner & Coiled Cable (Matching User Reference Image!)
    # Cradle bracket on right wall
    $cradlePath = Get-RoundedRectPath 652 368 32 68 8
    $cradleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 51, 65, 85)) # Slate-700
    $g.FillPath($cradleBrush, $cradlePath)
    $cradleBrush.Dispose()
    $cradlePath.Dispose()

    # Scanner Head
    $headPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $headPts = @(
        (New-Object System.Drawing.PointF(684, 336)),
        (New-Object System.Drawing.PointF(736, 320)),
        (New-Object System.Drawing.PointF(762, 388)),
        (New-Object System.Drawing.PointF(700, 432))
    )
    $headPath.AddPolygon($headPts)
    $headFill = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 248, 250, 252))
    $g.FillPath($headFill, $headPath)
    $headFill.Dispose()

    $toolPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 30, 41, 59), 22)
    $toolPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $g.DrawPath($toolPen, $headPath)
    $headPath.Dispose()

    # Red optical scanner glass
    $glassPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 239, 68, 68), 10)
    $glassPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $glassPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($glassPen, 740, 332, 758, 396)
    $glassPen.Dispose()

    # Scanner Handle / Grip
    $handlePath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $handlePath.AddLine(704, 432, 696, 536)
    $handlePath.AddBezier(696, 536, 700, 556, 732, 556, 736, 544)
    $handlePath.AddLine(736, 544, 748, 420)
    $handlePath.CloseFigure()

    $handleFill = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $g.FillPath($handleFill, $handlePath)
    $handleFill.Dispose()
    $g.DrawPath($toolPen, $handlePath)
    $handlePath.Dispose()

    # Coiled Industrial Cable (Connecting Scanner Handle to Kiosk Base)
    $cablePath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $cablePath.AddBezier(
        (New-Object System.Drawing.PointF(716, 544)),
        (New-Object System.Drawing.PointF(772, 636)),
        (New-Object System.Drawing.PointF(756, 716)),
        (New-Object System.Drawing.PointF(664, 752))
    )
    $cablePath.AddBezier(
        (New-Object System.Drawing.PointF(664, 752)),
        (New-Object System.Drawing.PointF(648, 742)),
        (New-Object System.Drawing.PointF(652, 720)),
        (New-Object System.Drawing.PointF(652, 704))
    )

    $cablePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 30, 41, 59), 20)
    $cablePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $cablePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $cablePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $g.DrawPath($cablePen, $cablePath)
    $cablePen.Dispose()
    $cablePath.Dispose()

    $toolPen.Dispose()
    $redBrush.Dispose()
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
Write-Host "Generating PWA Icons for VMS Cemindo..."

$sizes = @(
    @{name="frontend/public/icon-512.png"; size=512},
    @{name="frontend/public/icon-192.png"; size=192},
    @{name="frontend/public/apple-touch-icon.png"; size=180},
    @{name="frontend/public/favicon.png"; size=64}
)

foreach ($item in $sizes) {
    Write-Host "Creating $($item.name) ($($item.size)x$($item.size))..."
    $iconBmp = Create-VmsKioskIcon -targetSize $item.size
    $iconBmp.Save($item.name, [System.Drawing.Imaging.ImageFormat]::Png)
    $iconBmp.Dispose()
}

Write-Host "All PWA icons successfully generated!"
