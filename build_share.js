const fs = require('fs');
const path = require('path');

// Determine base directory (where this script is located)
const baseDir = __dirname;
const indexHtmlPath = path.join(baseDir, 'index_template.html');
const questionsJsPath = path.join(baseDir, 'questions.js');
const logicJsPath = path.join(baseDir, 'logic.js');
const resultsJsPath = path.join(baseDir, 'results.js');
// Output file name 'music_vibe_final.html' looks good for sharing
const outputPath = path.join(baseDir, 'music_vibe_final.html');

console.log('Reading files...');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const questionsJs = fs.readFileSync(questionsJsPath, 'utf8');
const logicJs = fs.readFileSync(logicJsPath, 'utf8');
let resultsJs = fs.readFileSync(resultsJsPath, 'utf8');

// Process images in results.js
const assetDir = path.join(baseDir, 'assets');
// Regex to find "assets/icon_..."
// Note: It assumes double or single quotes are around it in the original code, but we match the path content.
const imageMatches = resultsJs.match(/assets\/icon_[^"']+\.png/g);

if (imageMatches) {
    console.log(`Found ${imageMatches.length} image references.`);
    // Deduplicate in case multiple references
    const uniqueImages = [...new Set(imageMatches)];

    uniqueImages.forEach(imgRelPath => {
        // imgRelPath is e.g., "assets/icon_istj.png"
        const imgName = path.basename(imgRelPath);
        const imgPath = path.join(assetDir, imgName);

        if (fs.existsSync(imgPath)) {
            try {
                const imgBuffer = fs.readFileSync(imgPath);
                const base64 = imgBuffer.toString('base64');
                const dataUri = `data:image/png;base64,${base64}`;

                // Replace globally
                // We split by the string and join to replace all occurrences
                resultsJs = resultsJs.split(imgRelPath).join(dataUri);
                console.log(`Embedded ${imgName} (${(base64.length / 1024).toFixed(1)} KB)`);
            } catch (err) {
                console.error(`Error reading/encoding ${imgName}:`, err);
            }
        } else {
            console.warn(`Image not found: ${imgPath}`);
        }
    });
} else {
    console.log('No images found to embed.');
}

// Replace script tags with inline scripts
// Using simple string replacement as the structure is known
console.log('Inlining scripts...');
indexHtml = indexHtml.replace('<script src="questions.js"></script>', `<script>\n${questionsJs}\n</script>`);
indexHtml = indexHtml.replace('<script src="results.js"></script>', `<script>\n${resultsJs}\n</script>`);
indexHtml = indexHtml.replace('<script src="logic.js"></script>', `<script>\n${logicJs}\n</script>`);

// Add a comment at the top
indexHtml = indexHtml.replace('<!DOCTYPE html>', '<!-- Generated Single File for Sharing -->\n<!DOCTYPE html>');

console.log('Writing output file...');
fs.writeFileSync(outputPath, indexHtml);
console.log(`Successfully created: ${outputPath}`);
