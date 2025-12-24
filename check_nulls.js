
const fs = require('fs');

const filename = 'index.html';

if (fs.existsSync(filename)) {
    const buffer = fs.readFileSync(filename);
    const nulCount = buffer.filter(b => b === 0).length;

    if (nulCount > 0) {
        console.log(`CRITICAL: Found ${nulCount} NUL bytes in ${filename}!`);
        console.log(`First NUL at index: ${buffer.indexOf(0)}`);
    } else {
        console.log(`Clean: No NUL bytes found in ${filename}.`);
    }
} else {
    console.log("File not found.");
}
