const fs = require('fs');
let content = fs.readFileSync('results.js', 'utf8');

// Remove genre, subTitle
content = content.replace(/^\s*genre: ".*",\r?\n/gm, '');
content = content.replace(/^\s*subTitle: ".*",\r?\n/gm, '');

// Remove desc (backticks)
content = content.replace(/^\s*desc: `[\s\S]*?`,\r?\n/gm, '');

// Remove pros and cons arrays
content = content.replace(/^\s*pros: \[\s*[\s\S]*?\s*\],\r?\n/gm, '');
content = content.replace(/^\s*cons: \[\s*[\s\S]*?\s*\],\r?\n/gm, '');

// Clean match object
content = content.replace(/match: \{([\s\S]*?)\}/g, (match, body) => {
    let newBody = body.replace(/bestDesc: "[\s\S]*?",/g, '');
    newBody = newBody.replace(/worstDesc: "[\s\S]*?"/g, '');
    // Clean up empty lines and commas
    newBody = newBody.replace(/^\s*[\r\n]/gm, '');
    // Ensure it ends cleanly
    return `match: { ${newBody} }`;
});

fs.writeFileSync('results.js', content);
console.log("Cleaned results.js");
