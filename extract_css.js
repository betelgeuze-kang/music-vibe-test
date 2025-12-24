const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'index.html');
const cssPath = path.join(__dirname, 'styles.css');
const newHtmlPath = path.join(__dirname, 'index_refactored.html');

try {
    if (!fs.existsSync(htmlPath)) {
        console.log("index.html not found, skipping CSS extraction.");
        process.exit(0);
    }

    const content = fs.readFileSync(htmlPath, 'utf-8');
    const startTag = '<style>';
    const endTag = '</style>';

    const startIdx = content.indexOf(startTag);
    const endIdx = content.indexOf(endTag);

    if (startIdx === -1 || endIdx === -1) {
        console.log("Info: Could not find <style> block in index.html");
        process.exit(0);
    }

    // Extract CSS
    const cssContent = content.substring(startIdx + startTag.length, endIdx).trim();

    // Save CSS
    fs.writeFileSync(cssPath, cssContent, 'utf-8');
    console.log(`CSS extracted to ${cssPath} (${cssContent.length} bytes)`);

    // Create new HTML
    // Inject Tailwind CDN and CSS Link
    const headContent = `
    <!-- Tailwind CSS (JIT Mode) -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="styles.css">
    `;

    const newHtmlContent = content.substring(0, startIdx) + headContent + content.substring(endIdx + endTag.length);

    fs.writeFileSync(newHtmlPath, newHtmlContent, 'utf-8');
    console.log(`New HTML saved to ${newHtmlPath}`);

} catch (err) {
    console.error("Error:", err);
    process.exit(1);
}
