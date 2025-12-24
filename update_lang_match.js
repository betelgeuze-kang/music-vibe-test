const fs = require('fs');

// Read original results to get Korean match descriptions
const resultsContent = fs.readFileSync('results.js.bak', 'utf8');
const langContent = fs.readFileSync('lang.js', 'utf8');

const mbtiTypes = ["ISTJ", "ISFJ", "INFJ", "INTJ", "ISTP", "ISFP", "INFP", "INTP", "ESTP", "ESFP", "ENFP", "ENTP", "ESTJ", "ESFJ", "ENFJ", "ENTJ"];
const matchData = {};

// Extract from results.js
mbtiTypes.forEach(type => {
    const typeRegex = new RegExp(`"${type}":\\s*\\{[\\s\\S]*?match:\\s*\\{([\\s\\S]*?)\\}\\s*\\}`, 'm');
    const match = resultsContent.match(typeRegex);
    if (match) {
        const matchBlock = match[1];
        const bestDescMatch = matchBlock.match(/bestDesc:\s*"([^"]*)"/);
        const worstDescMatch = matchBlock.match(/worstDesc:\s*"([^"]*)"/);

        if (bestDescMatch && worstDescMatch) {
            matchData[type] = {
                bestDesc: bestDescMatch[1],
                worstDesc: worstDescMatch[1]
            };
        } else {
            console.warn(`Missing desc for ${type}`);
        }
    } else {
        console.warn(`Could not find block for ${type} in results.js`);
    }
});

// Inject into lang.js
let newLangContent = langContent;

// Handle KR Section (First one)
const krStart = newLangContent.indexOf('kr: {');
const enStart = newLangContent.indexOf('// 2. English');
if (krStart === -1 || enStart === -1) {
    console.error("Could not find KR section boundaries");
    process.exit(1);
}

const krSectionOriginal = newLangContent.substring(krStart, enStart);
let newKrSection = krSectionOriginal;

mbtiTypes.forEach(type => {
    const data = matchData[type];
    if (data) {
        const typeRegex = new RegExp(`("${type}":\\s*\\{[\\s\\S]*?cons:\\s*\\[[\\s\\S]*?\\])`, 'm');

        if (newKrSection.match(typeRegex)) {
            newKrSection = newKrSection.replace(typeRegex, (match) => {
                if (match.includes('match: {')) return match;

                return `${match},\n                match: {\n                    bestDesc: "${data.bestDesc}",\n                    worstDesc: "${data.worstDesc}"\n                }`;
            });
        } else {
            console.warn(`Could not find target block for ${type} in lang.js KR section`);
        }
    }
});

newLangContent = newLangContent.replace(krSectionOriginal, newKrSection);

fs.writeFileSync('lang.js', newLangContent);
console.log("Successfully updated lang.js");
