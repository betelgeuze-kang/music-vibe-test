const fs = require('fs');

const engMatchData = {
    "ISTJ": { bestDesc: "Perfect driving course. You (ISTJ) are the brake to their (ESTP) full throttle. They give you thrills, you give them safety.", worstDesc: "Alien language alert. You seek meaning (INFJ), but they chase thrills. Your deep talks feel like a lecture to them." },
    "ISFJ": { bestDesc: "Visual couple goals. You (ISFJ) ground their (ESFP) chaos with love. They bring the party, you bring the snacks.", worstDesc: "Boring vs. Chaos. You want tradition, they (ENTP) want to break every rule. Constant debates give you a headache." },
    "INFJ": { bestDesc: "Soul ties. You (INFJ) understand their (ENFP) weirdness like no one else. Magical chemistry.", worstDesc: "Suffocating. You value meaning, they (ESTJ) value efficiency. They treat your feelings like a systems bug. Too harsh." },
    "INTJ": { bestDesc: "Power couple. You (INTJ) plan, they (ENTP) innovate. Intellectual giants who respect each other's brains.", worstDesc: "Too much feelings. They (ESFJ) want social harmony, you want facts. Their need for validation exhausts you." },
    "ISTP": { bestDesc: "Efficient vibes. You (ISTP) execute what they (ESTJ) plan. No drama, just results. A cool, collected partnership.", worstDesc: "Emotional overload. They (ENFJ) want to save the world, you just want to fix your bike. Their passion feels clingy." },
    "ISFP": { bestDesc: "Healing vibes. They (ESFJ) take care of you, and you (ISFP) show them beauty. A harmonious, peaceful relationship.", worstDesc: "Stressful boss. They (ENTJ) demand efficiency, you need freedom. They will crush your artistic soul with deadlines." },
    "INFP": { bestDesc: "Muse and Hero. You (INFP) inspire them (ENFJ), and they motivate you. A storybook romance full of support.", worstDesc: "Reality check. They (ESTJ) crush your dreams with 'facts'. You feel unheard and controlled around them. Toxic vibes." },
    "INTP": { bestDesc: "Masterminds. You (INTP) analyze, they (ENTJ) command. You provide the blueprints, they build the empire. Unstoppable logic.", worstDesc: "Social battery drain. They (ESFJ) drag you to parties. They care about norms, you question everything. Just... no." },
    "ESTP": { bestDesc: "Partners in crime. You (ESTP) bring the action, they (ISTJ) bring the map. You make them fun, they make you safe.", worstDesc: "Buzzkill. You want to party, they (INFJ) want to meditate. They judge your fun as 'shallow'. Not a vibe." },
    "ESFP": { bestDesc: "Fan club president. You (ESFP) are the star, they (ISFJ) are your #1 fan. They take care of the mess you make.", worstDesc: "Lecturer alert. You live for today, they (INTJ) live for 2050. They think you're shallow, you think they're boring." },
    "ENFP": { bestDesc: "Dream team. You (ENFP) dream it, they (INFJ) understand it. Two weirdos finding a home in each other.", worstDesc: "Fun police. They (ISTJ) have a rule for everything. You want to fly, they want you to sit down." },
    "ENTP": { bestDesc: "Rival & Partner. You (ENTP) troll, they (INTJ) scheme. A chaotic but brilliant duo that could rule the world.", worstDesc: "Validation trap. They (ISFJ) cry when you debate. You walk on eggshells around their feelings. Exhausting." },
    "ESTJ": { bestDesc: "Executor & Planner. You (ESTJ) lead, they (ISTP) fix. A highly efficient team with zero emotional drama.", worstDesc: "Chaos agent. They (INFP) cry when you give feedback. You can't respect their lack of logic. Frustrating." },
    "ESFJ": { bestDesc: "Cozy vibes. You (ESFJ) care, they (ISFP) appreciate. A soft, warm, and aesthetically pleasing couple.", worstDesc: "Robot alert. You want connection, they (INTP) want alone time. They critique your kindness as 'illogical'." },
    "ENFJ": { bestDesc: "Hero's Journey. You (ENFJ) save them (INFP), they inspire you. A dramatic and passionate love story.", worstDesc: "Cold wall. You give 100% love, they (ISTP) give 0% reaction. You'll burn out trying to warm them up." },
    "ENTJ": { bestDesc: "Empire Builders. You (ENTJ) lead, they (INTP) advise. The most powerful strategic alliance possible.", worstDesc: "Drama queen. They (ISFP) take everything personally. You can't handle their mood swings." }
};

let langContent = fs.readFileSync('lang.js', 'utf8');

// Find English Section
const enStart = langContent.indexOf('// 2. English');
const jpStart = langContent.indexOf('// 3. Japanese');

if (enStart === -1 || jpStart === -1) {
    console.error("English/Japanese section boundaries not found");
    process.exit(1);
}

let enSection = langContent.substring(enStart, jpStart);

// Patch each type
for (const [type, data] of Object.entries(engMatchData)) {
    // Regex matches "ISTJ": { ... cons: [ ... ]
    // We want to insert the match object after the cons array
    const typeRegex = new RegExp(`"${type}":\\s*\\{[\\s\\S]*?cons:\\s*\\[[\\s\\S]*?\\]`, 'm');
    const match = enSection.match(typeRegex);

    if (match) {
        if (!match[0].includes('match: {')) {
            const replacement = `${match[0]},\n                match: {\n                    bestDesc: "${data.bestDesc}",\n                    worstDesc: "${data.worstDesc}"\n                }`;
            enSection = enSection.replace(match[0], replacement);
        }
    } else {
        console.warn(`Could not find ${type} block in English section`);
    }
}

// Replace back into full content
const newContent = langContent.replace(langContent.substring(enStart, jpStart), enSection);
fs.writeFileSync('lang.js', newContent);
console.log("Successfully patched English translations.");
