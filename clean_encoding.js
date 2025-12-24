
const fs = require('fs');
const path = require('path');

const files = ['index.html', 'styles.css'];

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath);

        // Check for BOM (EF BB BF)
        if (content[0] === 0xEF && content[1] === 0xBB && content[2] === 0xBF) {
            console.log(`[${file}] BOM detected. Removing...`);
            content = content.slice(3);
        } else {
            console.log(`[${file}] No BOM detected.`);
        }

        // Convert to string to fix any other potential encoding weirdness (and ensure UTF-8)
        let textContent = content.toString('utf8');

        // Fix <link> tag in index.html for robustness
        if (file === 'index.html') {
            if (!textContent.includes('type="text/css"')) {
                textContent = textContent.replace(
                    '<link rel="stylesheet" href="styles.css">',
                    '<link rel="stylesheet" href="styles.css" type="text/css">'
                );
                console.log(`[${file}] Added type="text/css" to link tag.`);
            }
        }

        fs.writeFileSync(filePath, textContent, 'utf8');
        console.log(`[${file}] Saved as clean UTF-8.`);
    } else {
        console.error(`[${file}] File not found!`);
    }
});
