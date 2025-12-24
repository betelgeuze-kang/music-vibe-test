
$htmlPath = "index.html"
$cssPath = "styles.css"
$bakPath = "index.html.bak2"

# Read content
$content = Get-Content -Path $htmlPath -Raw -Encoding UTF8

# Find style indexes
$startTag = "<style>"
$endTag = "</style>"
$startIndex = $content.IndexOf($startTag)
$endIndex = $content.IndexOf($endTag)

if ($startIndex -eq -1 -or $endIndex -eq -1) {
    Write-Host "Error: Tags not found"
    exit 1
}

# Extract CSS
$cssContent = $content.Substring($startIndex + $startTag.Length, $endIndex - ($startIndex + $startTag.Length)).Trim()
$cssContent | Set-Content -Path $cssPath -Encoding UTF8
Write-Host "CSS extracted to $cssPath"

# Create new HTML content
$headInjection = @"
    <!-- Tailwind CSS (JIT Mode) -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="styles.css">
"@

$newHtmlContent = $content.Substring(0, $startIndex) + $headInjection + $content.Substring($endIndex + $endTag.Length)

# Backup and Save
Copy-Item $htmlPath $bakPath -Force
$newHtmlContent | Set-Content -Path $htmlPath -Encoding UTF8
Write-Host "HTML updated and saved to $htmlPath"
