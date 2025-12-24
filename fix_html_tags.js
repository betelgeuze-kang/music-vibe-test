const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');

try {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf-8');

        // Regex to find < tag with space: < button -> <button
        // Python: r"<\s+(/?)(button|div|span|h[1-6]|p|li|ul|ol|i|img|!--)(?=(\s|>))"
        const pattern1 = /<\s+(\/?)(button|div|span|h[1-6]|p|li|ul|ol|i|img|!--)(?=(\s|>))/gi;
        content = content.replace(pattern1, (match, slash, tag) => {
            return `<${slash}${tag}`;
        });

        // Regex to find closing tag with space: </ button > -> </button>
        // Python: r"</(button|div|span|h[1-6]|p|li|ul|ol|i|img)\s+>"
        const pattern2 = /<\/(button|div|span|h[1-6]|p|li|ul|ol|i|img)\s+>/gi;
        content = content.replace(pattern2, (match, tag) => {
            return `</${tag}>`;
        });

        fs.writeFileSync(filePath, content, 'utf-8');
        console.log("Fixed HTML tags.");
    } else {
        console.log("index.html not found, skipping tag fix.");
    }
} catch (err) {
    console.error("Error fixing HTML tags:", err);
}
