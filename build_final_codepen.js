
const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const outputPath = path.join(baseDir, 'index.html');

console.log('Reading source files...');

let indexHtml = fs.readFileSync(path.join(baseDir, 'index_template.html'), 'utf8');
const questionsJs = fs.readFileSync(path.join(baseDir, 'questions.js'), 'utf8');
let resultsJs = fs.readFileSync(path.join(baseDir, 'results.js'), 'utf8');
const logicJs = fs.readFileSync(path.join(baseDir, 'logic.js'), 'utf8');

console.log('Processing images in results.js...');

// Find all image references in results.js
// Pattern: "assets/icon_name.png"
const imageMatches = resultsJs.match(/"assets\/icon_[^"']+\.png"/g);

if (imageMatches) {
    const uniqueImages = [...new Set(imageMatches)];
    console.log(`Found ${uniqueImages.length} images to embed.`);

    uniqueImages.forEach(imgStr => {
        // imgStr is like "assets/icon_istj.png"
        const relativePath = imgStr.replace(/"/g, '');
        // const filename = path.basename(relativePath); // Not needed for URL replacement

        // CDN URL (GitHub Pages)
        const cdnUrl = `https://betelgeuze-kang.github.io/-1/${relativePath}`;

        console.log(`Replacing ${relativePath} -> ${cdnUrl}`);

        // Replace ALL occurrences in resultsJs
        // We use split/join for simple global replacement of the specific string
        resultsJs = resultsJs.split(relativePath).join(cdnUrl);
    });
}

console.log('Inlining scripts...');

// Replace script tags with inline code
indexHtml = indexHtml.replace('<script src="questions.js"></script>', `<script>\n${questionsJs}\n</script>`);
indexHtml = indexHtml.replace('<script src="results.js"></script>', `<script>\n${resultsJs}\n</script>`);
indexHtml = indexHtml.replace('<script src="logic.js"></script>', `<script>\n${logicJs}\n</script>`);

// Inline CSS
console.log('Inlining CSS...');
const styleCssPath = path.join(baseDir, 'style.css');
if (fs.existsSync(styleCssPath)) {
    const styleCss = fs.readFileSync(styleCssPath, 'utf8');
    indexHtml = indexHtml.replace('<link href="./style.css" rel="stylesheet">', `<style>\n${styleCss}\n</style>`);
} else {
    console.warn('style.css not found, skipping inline CSS.');
}

// Add CodePen specific comment
const headerComment = `<!-- 
  [CODEPEN VERSION - FULL]
  Includes resized base64 images and full personality analysis.
  Copy and paste this entire code into the HTML section of your Pen.
-->\n`;

indexHtml = indexHtml.replace('<!DOCTYPE html>', headerComment + '<!DOCTYPE html>');

console.log('Writing output file...');
fs.writeFileSync(outputPath, indexHtml);
console.log(`Successfully created: ${outputPath}`);
console.log(`File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
