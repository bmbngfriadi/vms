Add-Type -AssemblyName System.Drawing

function Create-VisitorIcon([int]$targetSize) {
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

    # 1. Base Squircle (Industrial Slate Background)
    # Merah Cemindo primer: #b91c1c (185, 28, 28)
    # Slate gelap: #0f172a to #1e293b
    [float]$bgPad = 32
    [float]$bgSize = $masterSize - ($bgPad * 2)
    [float]$bgRadius = 190
    $bgPath = Get-RoundedRectPath $bgPad $bgPad $bgSize $bgSize $bgRadius

    $bgRect = New-Object System.Drawing.RectangleF($bgPad, $bgPad, $bgSize, $bgSize)
    $cTopLeft = [System.Drawing.Color]::FromArgb(255, 30, 41, 59)  # Slate-800
    $cBotRight = [System.Drawing.Color]::FromArgb(255, 15, 23, 42)  # Slate-900
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($bgRect, $cTopLeft, $cBotRight, [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal)
    $g.FillPath($bgBrush, $bgPath)
    $bgBrush.Dispose()

    # Subtle inner border
    $rimPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(140, 71, 85, 105), 4)
    $g.DrawPath($rimPen, $bgPath)
    $rimPen.Dispose()

    # Red Cemindo Top Ambient Radial Glow
    $glowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($bgPath)
    $glowBrush.CenterColor = [System.Drawing.Color]::FromArgb(90, 185, 28, 28) # Red glow
    $glowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 15, 23, 42))
    $glowBrush.CenterPoint = New-Object System.Drawing.PointF(512.0, 260.0)
    $g.FillPath($glowBrush, $bgPath)
    $glowBrush.Dispose()
    $bgPath.Dispose()

    # 2. Lanyard Straps (Tali Gantungan ID Card)
    $strapPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 185, 28, 28), 34) # Cemindo Red
    $strapPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $strapPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($strapPen, 340, 32, 480, 195)
    $g.DrawLine($strapPen, 684, 32, 544, 195)
    $strapPen.Dispose()

    # Lanyard center stripe (reflective silver/white)
    $stripePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(210, 241, 245, 249), 8)
    $g.DrawLine($stripePen, 340, 32, 480, 195)
    $g.DrawLine($stripePen, 684, 32, 544, 195)
    $stripePen.Dispose()

    # Metal Buckle / Clip at Lanyard junction
    [float]$clipX = 468
    [float]$clipY = 178
    [float]$clipW = 88
    [float]$clipH = 44
    $clipRect = New-Object System.Drawing.RectangleF($clipX, $clipY, $clipW, $clipH)
    $clipBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($clipRect, [System.Drawing.Color]::FromArgb(255, 226, 232, 240), [System.Drawing.Color]::FromArgb(255, 100, 116, 139), [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
    $clipPath = Get-RoundedRectPath $clipX $clipY $clipW $clipH 14
    $g.FillPath($clipBrush, $clipPath)
    $clipPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 51, 65, 85), 3)
    $g.DrawPath($clipPen, $clipPath)
    $clipBrush.Dispose()
    $clipPen.Dispose()
    $clipPath.Dispose()

    # Clip hole
    $holeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 15, 23, 42))
    $g.FillEllipse($holeBrush, 496, 190, 32, 20)
    $holeBrush.Dispose()

    # 3. Visitor ID Card Pass
    [float]$cardX = 212
    [float]$cardY = 210
    [float]$cardW = 600
    [float]$cardH = 720
    [float]$cardR = 48

    # Card Drop Shadow
    for ($s = 1; $s -le 5; $s++) {
        [int]$sAlpha = 22 - ($s * 3)
        $sBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($sAlpha, 0, 0, 0))
        $sPath = Get-RoundedRectPath ($cardX - $s * 3) ($cardY + $s * 5) ($cardW + $s * 6) ($cardH + $s * 6) ($cardR + $s * 2)
        $g.FillPath($sBrush, $sPath)
        $sBrush.Dispose()
        $sPath.Dispose()
    }

    # Card Body Background
    $cardPath = Get-RoundedRectPath $cardX $cardY $cardW $cardH $cardR
    $cardRect = New-Object System.Drawing.RectangleF($cardX, $cardY, $cardW, $cardH)
    $cardBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($cardRect, [System.Drawing.Color]::FromArgb(255, 255, 255, 255), [System.Drawing.Color]::FromArgb(255, 241, 245, 249), [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
    $g.FillPath($cardBrush, $cardPath)
    $cardBrush.Dispose()

    # Card Rim Border
    $cardBorderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 203, 213, 225), 4)
    $g.DrawPath($cardBorderPen, $cardPath)
    $cardBorderPen.Dispose()

    # Card Lanyard Slot Hole (at top of card)
    $slotPath = Get-RoundedRectPath 468 226 88 18 9
    $slotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 15, 23, 42))
    $g.FillPath($slotBrush, $slotPath)
    $slotBrush.Dispose()
    $slotPath.Dispose()

    # Clip to card for header
    $state = $g.Save()
    $g.SetClip($cardPath)

    # 4. Card Header (Cemindo Red Badge Banner)
    [float]$headerH = 135
    [float]$headerY = $cardY + 54
    $hdrRect = New-Object System.Drawing.RectangleF($cardX, $headerY, $cardW, $headerH)
    $hdrBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($hdrRect, [System.Drawing.Color]::FromArgb(255, 185, 28, 28), [System.Drawing.Color]::FromArgb(255, 220, 38, 38), [System.Drawing.Drawing2D.LinearGradientMode]::Horizontal)
    $g.FillRectangle($hdrBrush, $cardX, $headerY, $cardW, $headerH)
    $hdrBrush.Dispose()

    # Header decorative accents
    $linePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(40, 255, 255, 255), 3)
    $g.DrawLine($linePen, $cardX, ($headerY + 20), ($cardX + $cardW), ($headerY + 20))
    $g.DrawLine($linePen, $cardX, ($headerY + $headerH - 12), ($cardX + $cardW), ($headerY + $headerH - 12))
    $linePen.Dispose()

    # Header Typography: "VISITOR PASS" & "PT CEMINDO GEMILANG"
    $fontFamily = New-Object System.Drawing.FontFamily("Arial")
    $hdrTitleFont = New-Object System.Drawing.Font($fontFamily, 32, [System.Drawing.FontStyle]::Bold)
    $hdrSubFont = New-Object System.Drawing.Font($fontFamily, 16, [System.Drawing.FontStyle]::Bold)
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $whiteMutedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 254, 202, 202))

    $sfCenter = New-Object System.Drawing.StringFormat
    $sfCenter.Alignment = [System.Drawing.StringAlignment]::Center
    $sfCenter.LineAlignment = [System.Drawing.StringAlignment]::Center

    $g.DrawString("VISITOR PASS", $hdrTitleFont, $whiteBrush, 512.0, ($headerY + 50.0), $sfCenter)
    $g.DrawString("PT CEMINDO GEMILANG TBK", $hdrSubFont, $whiteMutedBrush, 512.0, ($headerY + 98.0), $sfCenter)

    $hdrTitleFont.Dispose()
    $hdrSubFont.Dispose()
    $whiteMutedBrush.Dispose()

    $g.Restore($state)
    $cardPath.Dispose()

    # 5. Visitor Photo / Identity Avatar Box
    [float]$photoX = $cardX + 48
    [float]$photoY = $headerY + $headerH + 42
    [float]$photoW = 180
    [float]$photoH = 200
    [float]$photoR = 24
    $photoPath = Get-RoundedRectPath $photoX $photoY $photoW $photoH $photoR

    # Photo Box Fill & Border
    $photoBgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 241, 245, 249))
    $g.FillPath($photoBgBrush, $photoPath)
    $photoBgBrush.Dispose()

    $photoPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 203, 213, 225), 3)
    $g.DrawPath($photoPen, $photoPath)
    $photoPen.Dispose()

    # Draw Avatar Inside Photo Box (Clipped)
    $photoState = $g.Save()
    $g.SetClip($photoPath)

    $avatarHeadBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 100, 116, 139)) # Slate-500
    $avatarBodyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 71, 85, 105))  # Slate-600

    [float]$headCenterX = $photoX + ($photoW / 2)
    [float]$headCenterY = $photoY + 68
    $g.FillEllipse($avatarHeadBrush, ($headCenterX - 36), ($headCenterY - 36), 72, 72)
    $g.FillEllipse($avatarBodyBrush, ($headCenterX - 75), ($photoY + 124), 150, 130)

    # Avatar Neck Tie / Collar (Red Cemindo)
    $tieBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 185, 28, 28))
    $tiePoints = @(
        (New-Object System.Drawing.PointF($headCenterX, ($photoY + 120))),
        (New-Object System.Drawing.PointF(($headCenterX - 14), ($photoY + 152))),
        (New-Object System.Drawing.PointF($headCenterX, ($photoY + 180))),
        (New-Object System.Drawing.PointF(($headCenterX + 14), ($photoY + 152)))
    )
    $g.FillPolygon($tieBrush, $tiePoints)
    $tieBrush.Dispose()

    $avatarHeadBrush.Dispose()
    $avatarBodyBrush.Dispose()
    $g.Restore($photoState)
    $photoPath.Dispose()

    # 6. Guest Info Bars (Beside photo)
    [float]$infoStartX = $photoX + $photoW + 36
    [float]$infoY = $photoY + 12

    # Name Pill (Primary Red Cemindo)
    $namePill = Get-RoundedRectPath $infoStartX $infoY 270 24 12
    $nameBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 185, 28, 28))
    $g.FillPath($nameBrush, $namePill)
    $nameBrush.Dispose()
    $namePill.Dispose()

    # Company Bar (Slate-600)
    $compPill = Get-RoundedRectPath $infoStartX ($infoY + 44) 220 18 9
    $compBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 71, 85, 105))
    $g.FillPath($compBrush, $compPill)
    $compBrush.Dispose()
    $compPill.Dispose()

    # Destination Bar (Slate-400)
    $destPill = Get-RoundedRectPath $infoStartX ($infoY + 76) 245 16 8
    $destBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
    $g.FillPath($destBrush, $destPill)
    $destBrush.Dispose()
    $destPill.Dispose()

    # Date / ID Bar (Slate-300)
    $datePill = Get-RoundedRectPath $infoStartX ($infoY + 106) 170 14 7
    $dateBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 203, 213, 225))
    $g.FillPath($dateBrush, $datePill)
    $dateBrush.Dispose()
    $datePill.Dispose()

    # Status Chip: "VALIDATED"
    $statusPill = Get-RoundedRectPath $infoStartX ($infoY + 138) 130 36 18
    $statusBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 254, 226, 226))
    $g.FillPath($statusBg, $statusPill)
    $statusBg.Dispose()
    $statusPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 248, 113, 113), 2)
    $g.DrawPath($statusPen, $statusPill)
    $statusPen.Dispose()
    $statusPill.Dispose()

    $statusFont = New-Object System.Drawing.Font($fontFamily, 14, [System.Drawing.FontStyle]::Bold)
    $statusTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 185, 28, 28))
    $g.DrawString("VALIDATED", $statusFont, $statusTextBrush, ($infoStartX + 65.0), ($infoY + 156.0), $sfCenter)
    $statusFont.Dispose()
    $statusTextBrush.Dispose()

    # 7. Divider Line
    [float]$divY = $photoY + $photoH + 34
    $divPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 226, 232, 240), 3)
    $divPen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
    $g.DrawLine($divPen, ($cardX + 40), $divY, ($cardX + $cardW - 40), $divY)
    $divPen.Dispose()

    # 8. Digital Barcode / QR Simulation Lines at bottom of card
    [float]$bcStartX = $cardX + 48
    [float]$bcY = $divY + 30
    [float]$bcH = 75

    $barPattern = @(
        @{w=7; c='r'}, @{w=4; c='s'}, @{w=12; c='r'}, @{w=5; c='s'}, @{w=8; c='r'},
        @{w=14; c='s'}, @{w=6; c='r'}, @{w=10; c='s'}, @{w=4; c='r'}, @{w=12; c='s'},
        @{w=8; c='r'}, @{w=6; c='s'}, @{w=15; c='r'}, @{w=5; c='s'}, @{w=9; c='r'},
        @{w=11; c='s'}, @{w=6; c='r'}, @{w=13; c='s'}, @{w=7; c='r'}, @{w=8; c='s'},
        @{w=14; c='r'}, @{w=5; c='s'}, @{w=10; c='r'}, @{w=4; c='s'}, @{w=12; c='r'},
        @{w=6; c='s'}, @{w=8; c='r'}, @{w=10; c='s'}, @{w=5; c='r'}
    )

    $currX = $bcStartX
    $redBarBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 185, 28, 28))
    $slateBarBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 51, 65, 85))

    foreach ($bar in $barPattern) {
        $bBrush = if ($bar.c -eq 'r') { $redBarBrush } else { $slateBarBrush }
        $g.FillRectangle($bBrush, [float]$currX, [float]$bcY, [float]$bar.w, [float]$bcH)
        $currX += $bar.w + 6
        if ($currX -gt ($cardX + $cardW - 200)) { break }
    }
    $redBarBrush.Dispose()
    $slateBarBrush.Dispose()

    # Monospace Security Code
    $codeFont = New-Object System.Drawing.Font("Consolas", 15, [System.Drawing.FontStyle]::Bold)
    $codeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 100, 116, 139))
    $g.DrawString("* VMS-CEMINDO-BATAM-2026 *", $codeFont, $codeBrush, ($bcStartX + 145.0), ($bcY + $bcH + 18.0), $sfCenter)
    $codeFont.Dispose()
    $codeBrush.Dispose()

    # 9. Floating Security Verification Badge (Emblem di kanan bawah)
    [float]$badgeCenterX = $cardX + $cardW - 48
    [float]$badgeCenterY = $cardY + $cardH - 58
    [float]$badgeR = 80

    # Badge Shadow
    for ($bs = 1; $bs -le 6; $bs++) {
        [int]$bsAlpha = 28 - ($bs * 4)
        $bShadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($bsAlpha, 0, 0, 0))
        $g.FillEllipse($bShadowBrush, [float]($badgeCenterX - $badgeR - $bs*3), [float]($badgeCenterY - $badgeR + $bs*4), [float](($badgeR * 2) + $bs*6), [float](($badgeR * 2) + $bs*6))
        $bShadowBrush.Dispose()
    }

    # Outer Metallic Bezel
    $bezelRect = New-Object System.Drawing.RectangleF([float]($badgeCenterX - $badgeR), [float]($badgeCenterY - $badgeR), [float]($badgeR * 2), [float]($badgeR * 2))
    $bezelBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($bezelRect, [System.Drawing.Color]::FromArgb(255, 255, 255, 255), [System.Drawing.Color]::FromArgb(255, 203, 213, 225), [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal)
    $g.FillEllipse($bezelBrush, ($badgeCenterX - $badgeR), ($badgeCenterY - $badgeR), ($badgeR * 2), ($badgeR * 2))
    $bezelBrush.Dispose()

    # Inner Red Cemindo Shield Core
    [float]$innerR = $badgeR - 10
    $coreRect = New-Object System.Drawing.RectangleF([float]($badgeCenterX - $innerR), [float]($badgeCenterY - $innerR), [float]($innerR * 2), [float]($innerR * 2))
    $coreBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($coreRect, [System.Drawing.Color]::FromArgb(255, 220, 38, 38), [System.Drawing.Color]::FromArgb(255, 153, 27, 27), [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
    $g.FillEllipse($coreBrush, ($badgeCenterX - $innerR), ($badgeCenterY - $innerR), ($innerR * 2), ($innerR * 2))
    $coreBrush.Dispose()

    # Bold Checkmark Icon in Shield Badge
    $chkPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 255, 255), 18)
    $chkPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $chkPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $chkPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    $chkPoints = @(
        (New-Object System.Drawing.PointF(($badgeCenterX - 34), ($badgeCenterY + 2))),
        (New-Object System.Drawing.PointF(($badgeCenterX - 10), ($badgeCenterY + 26))),
        (New-Object System.Drawing.PointF(($badgeCenterX + 34), ($badgeCenterY - 26)))
    )
    $g.DrawLines($chkPen, $chkPoints)
    $chkPen.Dispose()

    # Clean up master graphics
    $whiteBrush.Dispose()
    $sfCenter.Dispose()
    $fontFamily.Dispose()
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
    $iconBmp = Create-VisitorIcon -targetSize $item.size
    $iconBmp.Save($item.name, [System.Drawing.Imaging.ImageFormat]::Png)
    $iconBmp.Dispose()
}

Write-Host "All PWA icons successfully generated!"
