
Add-Type -AssemblyName System.Drawing

$sourceDir = "assets"
$destDir = "assets\dist"

if (-not (Test-Path $sourceDir)) {
    Write-Host "Source directory not found!"
    exit
}

if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir | Out-Null
}

$files = Get-ChildItem "$sourceDir\*.png"

foreach ($file in $files) {
    try {
        $img = [System.Drawing.Image]::FromFile($file.FullName)
        $newWidth = 150
        $newHeight = 150
        
        # Create new bitmap
        $bitmap = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
        $graph = [System.Drawing.Graphics]::FromImage($bitmap)
        
        # High quality settings
        $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graph.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graph.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

        # Draw image
        $graph.DrawImage($img, 0, 0, $newWidth, $newHeight)
        
        # Save
        $destPath = Join-Path $destDir $file.Name
        $bitmap.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
        
        Write-Host "Resized $($file.Name)"
        
        # Cleanup
        $img.Dispose()
        $bitmap.Dispose()
        $graph.Dispose()
    }
    catch {
        Write-Host "Error processing $($file.Name): $_"
    }
}
