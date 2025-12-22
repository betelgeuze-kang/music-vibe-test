const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const indexHtmlPath = path.join(baseDir, 'index_template.html');
const questionsJsPath = path.join(baseDir, 'questions.js');
const logicJsPath = path.join(baseDir, 'logic.js');
const resultsJsPath = path.join(baseDir, 'results.js');
const outputPath = path.join(baseDir, 'music_vibe_codepen.html');

console.log('Reading files...');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const questionsJs = fs.readFileSync(questionsJsPath, 'utf8');
const logicJs = fs.readFileSync(logicJsPath, 'utf8');
const resultsJs = fs.readFileSync(resultsJsPath, 'utf8');

// Inline scripts
console.log('Inlining scripts...');
indexHtml = indexHtml.replace('<script src="questions.js"></script>', `<script>\n${questionsJs}\n</script>`);
indexHtml = indexHtml.replace('<script src="results.js"></script>', `<script>\n${resultsJs}\n</script>`);
indexHtml = indexHtml.replace('<script src="logic.js"></script>', `<script>\n${logicJs}\n</script>`);

// Add CodePen specific handler for missing images
const codepenFix = `
<script>
// CodePen Fallback: If local images fail to load, hide them to show the beautiful gradient background
document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
        e.target.style.display = 'none';
        // Optional: Add a text fallback or icon if needed, but gradient is fine for K/DA style
    }
}, true);
</script>
`;

indexHtml = indexHtml.replace('</body>', `${codepenFix}\n</body>`);

// Add comment
indexHtml = indexHtml.replace('<!DOCTYPE html>', '<!-- \n  [CODEPEN VERSION]\n  Copy and paste this entire code into the HTML section of your Pen.\n  Note: Local images are replaced by CSS gradients for this portable version.\n-->\n<!DOCTYPE html>');

console.log('Writing output file...');
fs.writeFileSync(outputPath, indexHtml);
console.log(`Successfully created: ${outputPath}`);
