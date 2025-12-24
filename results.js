// **[수정: 심층 분석 및 장단점 재작성 + AI 이미지 추가 + BGM 링크 적용(16곡 개별 적용)]**
const RESULTS_DATA = {
    // [MUSIC SOURCE INFO]
    // All tracks provided by Kevin MacLeod (incompetech.com)
    // Licensed under Creative Commons: By Attribution 4.0 License
    // http://creativecommons.org/licenses/by/4.0/

    "ISTJ": {        bestSong: "Night in Venice",
        color: "from-slate-900 via-gray-800 to-black",
        textColor: "text-slate-300",
        image: "assets/icon_istj.webp",
        audioSrc: "assets/audio/Night_in_Venice.mp3", // Calm/Jazz
        coverPattern: "repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 10px)",
        animClass: "animate-spin-slow",        rarity: "11.6%",
        match: {             best: "ESTP",            worst: "ENFP",         }
    },
    "ISFJ": {        bestSong: "Lobby Time",
        color: "from-amber-200 via-orange-300 to-amber-600",
        textColor: "text-amber-100",
        image: "assets/icon_isfj.webp",
        audioSrc: "assets/audio/Lobby_Time.mp3", // Smooth/Classy
        coverPattern: "radial-gradient(circle, rgba(255,255,255,0.2) 2px, transparent 2.5px)",
        animClass: "animate-float-slow",        rarity: "13.8%",
        match: {             best: "ESFP",            worst: "ENTP",         }
    },
    "INFJ": {        rarity: "1.5% (SUPER RARE!)",        bestSong: "Dreamy Flashback",
        color: "from-indigo-400 via-purple-400 to-indigo-800",
        textColor: "text-indigo-100",
        image: "assets/icon_infj.webp",
        audioSrc: "assets/audio/Dreamy_Flashback.mp3", // Dreamy
        coverPattern: "linear-gradient(135deg, rgba(255,255,255,0.1) 25%, transparent 25%) -50px 0, linear-gradient(225deg, rgba(255,255,255,0.1) 25%, transparent 25%) -50px 0",
        coverSize: "100px 100px",
        animClass: "animate-pulse-slow",        match: {             best: "ENFP",            worst: "ESTJ",         }
    },
    "INTJ": {        rarity: "2.1% (RARE)",        bestSong: "Tech Talk",
        color: "from-blue-600 via-blue-800 to-slate-900",
        textColor: "text-blue-200",
        image: "assets/icon_intj.webp",
        audioSrc: "assets/audio/Tech_Talk.mp3", // Analytical/Driving
        coverPattern: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 4px)",
        animClass: "animate-spin-slow",        match: {             best: "ENTP",            worst: "ESFJ",         }
    },
    "ISTP": {        rarity: "5.4%",
        bestSong: "Ice Flow",
        color: "from-zinc-500 via-slate-700 to-black",
        textColor: "text-zinc-300",
        image: "assets/icon_istp.webp",
        audioSrc: "assets/audio/Ice_Flow.mp3", // Phonk/Trap vibe
        coverPattern: "radial-gradient(rgba(255,255,255,0.1) 8%, transparent 8%)",
        coverSize: "20px 20px",
        animClass: "animate-pulse-fast",        match: {             best: "ESTJ",            worst: "ENFJ",         }
    },
    "ISFP": {        rarity: "8.8%",
        bestSong: "Cool Vibes",
        color: "from-rose-300 via-pink-400 to-rose-600",
        textColor: "text-rose-100",
        image: "assets/icon_isfp.webp",
        audioSrc: "assets/audio/Cool_Vibes.mp3", // Hip/Cool
        coverPattern: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.2' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E\")",
        animClass: "animate-wave",        match: {             best: "ESFJ",            worst: "ENTJ",         }
    },
    "INFP": {        bestSong: "Dream Catcher",
        color: "from-teal-200 via-emerald-300 to-teal-600",
        textColor: "text-teal-100",
        image: "assets/icon_infp.webp",
        audioSrc: "assets/audio/Dream_Catcher.mp3", // Dreamy/Sweet
        coverPattern: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.2'/%3E%3C/svg%3E\")",
        animClass: "animate-float-slow",        rarity: "4.4%",
        match: {             best: "ENFJ",            worst: "ESTJ",         }
    },
    "INTP": {        bestSong: "Cipher",
        color: "from-violet-500 via-fuchsia-600 to-purple-900",
        textColor: "text-violet-200",
        image: "assets/icon_intp.webp",
        audioSrc: "assets/audio/Cipher.mp3", // Electronic/Glitchy
        coverPattern: "repeating-radial-gradient(circle, transparent, transparent 3.5px, rgba(255,255,255,0.1) 3.5px, rgba(255,255,255,0.1) 4px)",
        animClass: "animate-pulse-fast",        rarity: "3.3%",
        match: {             best: "ENTJ",            worst: "ESFJ",         }
    },
    "ESTP": {        bestSong: "Griphop",
        color: "from-red-500 via-red-700 to-black",
        textColor: "text-red-300",
        image: "assets/icon_estp.webp",
        audioSrc: "assets/audio/Griphop.mp3", // Bouncy/HipHop
        coverPattern: "linear-gradient(45deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.1) 75%, transparent 75%, transparent)",
        coverSize: "20px 20px",
        animClass: "animate-bounce-slow",        rarity: "4.3%",
        match: {             best: "ISTJ",            worst: "INFJ",         }
    },
    "ESFP": {        bestSong: "Arroz Con Pollo",
        color: "from-yellow-300 via-orange-400 to-red-500",
        textColor: "text-amber-100",
        image: "assets/icon_esfp.webp",
        audioSrc: "assets/audio/Arroz_Con_Pollo.mp3", // Latin/Party
        coverPattern: "radial-gradient(circle, rgba(255,255,255,0.4) 2px, transparent 2.5px)",
        animClass: "animate-spin-slow",        rarity: "8.5%",
        match: {             best: "ISFJ",            worst: "INTJ",         }
    },
    "ENFP": {        bestSong: "Funkorama",
        color: "from-pink-400 via-purple-500 to-indigo-600",
        textColor: "text-pink-100",
        image: "assets/icon_enfp.webp",
        audioSrc: "assets/audio/Funkorama.mp3", // Funky/Groovy
        coverPattern: "repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(255,255,255,0.1) 20px)",
        animClass: "animate-bounce-slow",        rarity: "8.1%",
        match: {             best: "INFJ",            worst: "ISTJ",         }
    },
    "ENTP": {        bestSong: "Pixel Peeker Polka - faster",
        color: "from-lime-300 via-green-400 to-lime-600",
        textColor: "text-lime-200",
        image: "assets/icon_entp.webp",
        audioSrc: "assets/audio/Pixel_Peeker_Polka_faster.mp3", // Chaotic/Fun
        coverPattern: "repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 10px, transparent 10px, transparent 20px)",
        animClass: "animate-pulse-fast",        rarity: "3.2%",
        match: {             best: "INTJ",            worst: "ISFJ",         }
    },
    "ESTJ": {        bestSong: "Movement Proposition",
        color: "from-blue-500 via-cyan-600 to-blue-800",
        textColor: "text-blue-200",
        image: "assets/icon_estj.webp",
        audioSrc: "assets/audio/Movement_Proposition.mp3", // Driving/Action
        coverPattern: "linear-gradient(90deg, rgba(255,255,255,0.1) 50%, transparent 50%)",
        coverSize: "40px 100%",
        animClass: "animate-bounce-slow",        rarity: "8.7%",
        match: {             best: "ISTP",            worst: "INFP",         }
    },
    "ESFJ": {        bestSong: "Fretless",
        color: "from-pink-200 via-pink-400 to-rose-600",
        textColor: "text-white",
        image: "assets/icon_esfj.webp",
        audioSrc: "assets/audio/Fretless.mp3", // Uplifting/Pop
        coverPattern: "radial-gradient(circle, rgba(255,255,255,0.3) 2px, transparent 2.5px)",
        animClass: "animate-spin-slow",        rarity: "12.3%",
        match: {             best: "ISFP",            worst: "INTP",         }
    },
    "ENFJ": {        bestSong: "Disco Medusae",
        color: "from-amber-300 via-yellow-400 to-orange-500",
        textColor: "text-amber-100",
        image: "assets/icon_enfj.webp",
        audioSrc: "assets/audio/Disco_Medusae.mp3", // Disco/Funky
        coverPattern: "conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.1) 180deg, transparent 360deg)",
        animClass: "animate-pulse-slow",        rarity: "2.5% (RARE)",
        match: {             best: "INFP",            worst: "ISTP",         }
    },
    "ENTJ": {        bestSong: "Volatile Reaction",
        color: "from-red-700 via-red-900 to-black",
        textColor: "text-red-300",
        image: "assets/icon_entj.webp",
        audioSrc: "assets/audio/Volatile_Reaction.mp3", // Intense/Epic
        coverPattern: "repeating-linear-gradient(to bottom, transparent, transparent 5px, rgba(255,255,255,0.1) 5px, rgba(255,255,255,0.1) 10px)",
        animClass: "animate-spin-slow",        rarity: "1.8% (SUPER RARE!)",
        match: {             best: "INTP",            worst: "ISFP",         }
    }
};
