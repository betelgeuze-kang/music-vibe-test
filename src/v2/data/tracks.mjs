import { ARCHETYPE_BY_ID } from './archetypes.mjs?v=qg1';

const RAW_TRACKS = `space-song|Space Song|Beach House|US|2015|dream-pop,indie|midnight-dreamer|night,reset|en|
apocalypse|Apocalypse|Cigarettes After Sex|US|2017|dream-pop,slowcore|midnight-dreamer|night,reset|en|
about-you|About You|The 1975|UK|2022|dream-pop,alternative|midnight-dreamer|night,reset|en|
wait-m83|Wait|M83|FR|2011|dream-pop,electronic|midnight-dreamer|night,reset|fr|
505|505|Arctic Monkeys|UK|2007|indie-rock,alternative|midnight-dreamer|night,reset|en|
slow-dancing-dark|Slow Dancing in the Dark|Joji|JP|2018|alternative-rnb,ballad|midnight-dreamer|night,reset|ja|
glimpse-of-us|Glimpse of Us|Joji|JP|2022|piano-ballad,alternative-rnb|midnight-dreamer|night,reset|ja|
instagram-dean|instagram|DEAN|KR|2017|k-rnb,alternative-rnb|midnight-dreamer|night,reset|ko|
happen-heize|HAPPEN|HEIZE|KR|2021|k-rnb,pop|midnight-dreamer|night,reset|ko|
through-the-night|Through the Night|IU|KR|2017|k-pop,acoustic-ballad|midnight-dreamer|night,reset|ko|
love-poem|Love Poem|IU|KR|2019|k-pop,ballad|midnight-dreamer|night,reset|ko|
ditto|Ditto|NewJeans|KR|2022|k-pop,dream-pop|midnight-dreamer|night,reset|ko|
snooze-sza|Snooze|SZA|US|2022|rnb,neo-soul|midnight-dreamer|night,reset|en|
my-love-mine|My Love Mine All Mine|Mitski|US|2023|indie-pop,ballad|midnight-dreamer|night,reset|en|
here-with-me|Here With Me|d4vd|US|2022|indie-pop,ballad|midnight-dreamer|night,reset|en|
night-we-met|The Night We Met|Lord Huron|US|2015|indie-folk,ballad|midnight-dreamer|night,reset|en|
moon-song|Moon Song|Phoebe Bridgers|US|2020|indie-folk,slowcore|midnight-dreamer|night,reset|en|
nandemonaiya|Nandemonaiya|RADWIMPS|JP|2016|j-rock,soundtrack|midnight-dreamer|night,reset|ja|
yoru-ni-kakeru|Yoru ni Kakeru|YOASOBI|JP|2019|j-pop,electropop|midnight-dreamer|night,reset|ja|
somewhere-only-we-know|Somewhere Only We Know|Keane|UK|2004|piano-rock,alternative|midnight-dreamer|night,reset|en|
blinding-lights|Blinding Lights|The Weeknd|CA|2019|synth-pop,dance-pop|neon-runner|lift,focus|en|https://www.youtube.com/watch?v=4NRXx6U8ABQ
starboy|Starboy|The Weeknd|CA|2016|synth-pop,rnb|neon-runner|lift,focus|en|
murder-in-my-mind|Murder In My Mind|Kordhell|UK|2022|phonk,electronic|neon-runner|lift,focus|en|
close-eyes|Close Eyes|DVRST|RU|2021|phonk,electronic|neon-runner|lift,focus|ru|
humble|HUMBLE.|Kendrick Lamar|US|2017|hip-hop,rap|neon-runner|lift,focus|en|
sicko-mode|SICKO MODE|Travis Scott|US|2018|hip-hop,trap|neon-runner|lift,focus|en|
power|POWER|Kanye West|US|2010|hip-hop,rap|neon-runner|lift,focus|en|
gods-menu|God’s Menu|Stray Kids|KR|2020|k-pop,hip-hop|neon-runner|lift,focus|ko|
miroh|MIROH|Stray Kids|KR|2019|k-pop,edm|neon-runner|lift,focus|ko|
guerrilla|Guerrilla|ATEEZ|KR|2022|k-pop,industrial|neon-runner|lift,focus|ko|
bouncy|BOUNCY (K-HOT CHILLI PEPPERS)|ATEEZ|KR|2023|k-pop,hip-hop|neon-runner|lift,focus|ko|
kick-it|Kick It|NCT 127|KR|2020|k-pop,hip-hop|neon-runner|lift,focus|ko|
next-level|Next Level|aespa|KR|2021|k-pop,electropop|neon-runner|lift,focus|ko|
drama-aespa|Drama|aespa|KR|2023|k-pop,electropop|neon-runner|lift,focus|ko|
antifragile|ANTIFRAGILE|LE SSERAFIM|KR|2022|k-pop,reggaeton|neon-runner|lift,focus|ko|
eve-psyche|Eve, Psyche & The Bluebeard’s wife|LE SSERAFIM|KR|2023|k-pop,club|neon-runner|lift,focus|ko|
bibi-vengeance|BIBI Vengeance|BIBI|KR|2022|k-rnb,hip-hop|neon-runner|lift,focus|ko|
money-lisa|MONEY|LISA|TH|2021|k-pop,hip-hop|neon-runner|lift,focus|th|
tokyo-drift|Tokyo Drift (Fast & Furious)|Teriyaki Boyz|JP|2006|j-hip-hop,rap|neon-runner|lift,focus|ja|
the-search|The Search|NF|US|2019|hip-hop,cinematic-rap|neon-runner|lift,focus|en|
bloom-paper-kites|Bloom|The Paper Kites|AU|2013|indie-folk,acoustic|warm-vinyl|reset,night|en|
holocene|Holocene|Bon Iver|US|2011|indie-folk,acoustic|warm-vinyl|reset,night|en|
photograph|Photograph|Ed Sheeran|UK|2014|pop,acoustic|warm-vinyl|reset,night|en|
sparks|Sparks|Coldplay|UK|2000|alternative,acoustic|warm-vinyl|reset,night|en|
i-wont-give-up|I Won’t Give Up|Jason Mraz|US|2012|pop,acoustic|warm-vinyl|reset,night|en|
seasons-wave|seasons|wave to earth|KR|2020|k-indie,indie-rock|warm-vinyl|reset,night|ko|
bad-wave|bad|wave to earth|KR|2023|k-indie,indie-rock|warm-vinyl|reset,night|ko|
love-lee|Love Lee|AKMU|KR|2023|k-pop,acoustic-pop|warm-vinyl|reset,night|ko|
how-love-heartbreak|How can I love the heartbreak, you’re the one I love|AKMU|KR|2019|k-pop,ballad|warm-vinyl|reset,night|ko|
every-day-every-moment|Every day, Every Moment|Paul Kim|KR|2018|k-ballad,acoustic|warm-vinyl|reset,night|ko|
only-leehi|ONLY|LeeHi|KR|2021|k-rnb,ballad|warm-vinyl|reset,night|ko|
breathe-leehi|BREATHE|LeeHi|KR|2016|k-ballad,soul|warm-vinyl|reset,night|ko|
for-lovers-hesitate|For Lovers Who Hesitate|JANNABI|KR|2019|k-indie,retro-rock|warm-vinyl|reset,night|ko|
coffee-beabadoobee|Coffee|beabadoobee|UK|2017|indie-pop,lo-fi|warm-vinyl|reset,night|en|
best-part|Best Part|Daniel Caesar feat. H.E.R.|CA|2017|rnb,neo-soul|warm-vinyl|reset,night|en|
banana-pancakes|Banana Pancakes|Jack Johnson|US|2005|folk-pop,acoustic|warm-vinyl|reset,night|en|
mystery-of-love|Mystery of Love|Sufjan Stevens|US|2017|indie-folk,soundtrack|warm-vinyl|reset,night|en|
heartbeats-jose|Heartbeats|José González|SE|2003|indie-folk,acoustic|warm-vinyl|reset,night|sv|
orange-7|Orange|7!!|JP|2015|j-pop,acoustic|warm-vinyl|reset,night|ja|
first-love-utada|First Love|Hikaru Utada|JP|1999|j-pop,rnb-ballad|warm-vinyl|reset,night|ja|
giorgio-moroder|Giorgio by Moroder|Daft Punk|FR|2013|electronic,progressive|cosmic-architect|focus,explore|fr|
emerald-rush|Emerald Rush|Jon Hopkins|UK|2018|electronic,ambient-techno|cosmic-architect|focus,explore|en|
everything-right-place|Everything In Its Right Place|Radiohead|UK|2000|alternative,electronic|cosmic-architect|focus,explore|en|
strobe|Strobe|deadmau5|CA|2009|progressive-house,electronic|cosmic-architect|focus,explore|en|
avril-14th|Avril 14th|Aphex Twin|UK|2001|ambient,piano|cosmic-architect|focus,explore|en|
dayvan-cowboy|Dayvan Cowboy|Boards of Canada|UK|2005|idm,ambient|cosmic-architect|focus,explore|en|
windowlicker|Windowlicker|Aphex Twin|UK|1999|idm,electronic|cosmic-architect|focus,explore|en|
an-ending-ascent|An Ending (Ascent)|Brian Eno|UK|1983|ambient,electronic|cosmic-architect|focus,explore|en|
we-own-the-sky|We Own the Sky|M83|FR|2008|electronic,dream-pop|cosmic-architect|focus,explore|fr|
moment-apart|A Moment Apart|ODESZA|US|2017|electronic,cinematic|cosmic-architect|focus,explore|en|
kerala|Kerala|Bonobo|UK|2017|downtempo,electronic|cosmic-architect|focus,explore|en|
atlas-bicep|Atlas|Bicep|UK|2020|electronic,breakbeat|cosmic-architect|focus,explore|en|
glue-bicep|Glue|Bicep|UK|2017|electronic,breakbeat|cosmic-architect|focus,explore|en|
opal-remix|Opal (Four Tet Remix)|Bicep|UK|2018|electronic,house|cosmic-architect|focus,explore|en|
shelter|Shelter|Porter Robinson & Madeon|US|2016|electronic,synth-pop|cosmic-architect|focus,explore|en|
sea-of-voices|Sea of Voices|Porter Robinson|US|2014|electronic,ambient|cosmic-architect|focus,explore|en|
ghost-voices|Ghost Voices|Virtual Self|US|2017|electronic,progressive|cosmic-architect|focus,explore|en|
merry-christmas-sakamoto|Merry Christmas Mr. Lawrence|Ryuichi Sakamoto|JP|1983|soundtrack,piano|cosmic-architect|focus,explore|ja|
aruarian-dance|Aruarian Dance|Nujabes|JP|2004|jazz-hop,instrumental|cosmic-architect|focus,explore|ja|
polyrhythm-perfume|Polyrhythm|Perfume|JP|2007|j-pop,electronic|cosmic-architect|focus,explore|ja|
nature-of-daylight|On the Nature of Daylight|Max Richter|UK|2004|modern-classical,soundtrack|quiet-cinematic|focus,reset|en|
time-hans-zimmer|Time|Hans Zimmer|DE|2010|soundtrack,orchestral|quiet-cinematic|focus,reset|de|
experience-einaudi|Experience|Ludovico Einaudi|IT|2013|modern-classical,piano|quiet-cinematic|focus,reset|it|
flight-from-city|Flight from the City|Jóhann Jóhannsson|IS|2016|modern-classical,ambient|quiet-cinematic|focus,reset|is|
nuvole-bianche|Nuvole Bianche|Ludovico Einaudi|IT|2004|modern-classical,piano|quiet-cinematic|focus,reset|it|
river-flows|River Flows in You|Yiruma|KR|2001|piano,new-age|quiet-cinematic|focus,reset|ko|
kiss-the-rain|Kiss the Rain|Yiruma|KR|2003|piano,new-age|quiet-cinematic|focus,reset|ko|
one-summers-day|One Summer’s Day|Joe Hisaishi|JP|2001|soundtrack,orchestral|quiet-cinematic|focus,reset|ja|
sixth-station|The Sixth Station|Joe Hisaishi|JP|2001|soundtrack,orchestral|quiet-cinematic|focus,reset|ja|
comptine|Comptine d’un autre été, l’après-midi|Yann Tiersen|FR|2001|soundtrack,piano|quiet-cinematic|focus,reset|fr|
arrival-birds|Arrival of the Birds|The Cinematic Orchestra|UK|2008|modern-classical,soundtrack|quiet-cinematic|focus,reset|en|
cornfield-chase|Cornfield Chase|Hans Zimmer|DE|2014|soundtrack,ambient|quiet-cinematic|focus,reset|de|
light-of-seven|Light of the Seven|Ramin Djawadi|DE|2016|soundtrack,orchestral|quiet-cinematic|focus,reset|de|
night-king|The Night King|Ramin Djawadi|DE|2019|soundtrack,orchestral|quiet-cinematic|focus,reset|de|
saturn-sleeping|Saturn|Sleeping At Last|US|2014|indie,cinematic|quiet-cinematic|focus,reset|en|
to-build-home|To Build a Home|The Cinematic Orchestra|UK|2007|cinematic,soul|quiet-cinematic|focus,reset|en|
your-hand-mine|Your Hand in Mine|Explosions in the Sky|US|2003|post-rock,instrumental|quiet-cinematic|focus,reset|en|
near-light|Near Light|Ólafur Arnalds|IS|2011|modern-classical,ambient|quiet-cinematic|focus,reset|is|
saman|Saman|Ólafur Arnalds|IS|2013|modern-classical,ambient|quiet-cinematic|focus,reset|is|
town-ocean-view|A Town with an Ocean View|Joe Hisaishi|JP|1989|soundtrack,orchestral|quiet-cinematic|focus,reset|ja|
uptown-funk|Uptown Funk|Mark Ronson feat. Bruno Mars|UK|2014|funk-pop,dance-pop|rhythm-connector|lift,together|en|https://www.youtube.com/watch?v=OPf0YbXqDm0
september|September|Earth, Wind & Fire|US|1978|disco,funk|rhythm-connector|lift,together|en|
levitating|Levitating|Dua Lipa|UK|2020|dance-pop,disco|rhythm-connector|lift,together|en|
cuff-it|CUFF IT|Beyoncé|US|2022|disco,rnb|rhythm-connector|lift,together|en|
back-on-74|Back on 74|Jungle|UK|2023|neo-soul,funk|rhythm-connector|lift,together|en|
dont-start-now|Don’t Start Now|Dua Lipa|UK|2019|dance-pop,disco|rhythm-connector|lift,together|en|
24k-magic|24K Magic|Bruno Mars|US|2016|funk-pop,rnb|rhythm-connector|lift,together|en|
i-wanna-dance|I Wanna Dance with Somebody|Whitney Houston|US|1987|dance-pop,soul|rhythm-connector|lift,together|en|https://www.youtube.com/watch?v=eH3giaIzONA
dancing-queen|Dancing Queen|ABBA|SE|1976|disco,pop|rhythm-connector|lift,together|sv|
get-lucky|Get Lucky|Daft Punk feat. Pharrell Williams|FR|2013|disco,funk|rhythm-connector|lift,together|fr|
treasure|Treasure|Bruno Mars|US|2012|funk-pop,disco|rhythm-connector|lift,together|en|
hype-boy|Hype Boy|NewJeans|KR|2022|k-pop,rnb|rhythm-connector|lift,together|ko|
super-shy|Super Shy|NewJeans|KR|2023|k-pop,dance-pop|rhythm-connector|lift,together|ko|https://www.youtube.com/watch?v=ArmDp-zijuc
dynamite|Dynamite|BTS|KR|2020|k-pop,disco-pop|rhythm-connector|lift,together|ko|https://www.youtube.com/watch?v=gdZLi9oWNZg
butter|Butter|BTS|KR|2021|k-pop,dance-pop|rhythm-connector|lift,together|ko|
what-is-love|What is Love?|TWICE|KR|2018|k-pop,dance-pop|rhythm-connector|lift,together|ko|
fancy|FANCY|TWICE|KR|2019|k-pop,dance-pop|rhythm-connector|lift,together|ko|
queencard|Queencard|(G)I-DLE|KR|2023|k-pop,dance-pop|rhythm-connector|lift,together|ko|
i-am-ive|I AM|IVE|KR|2023|k-pop,dance-pop|rhythm-connector|lift,together|ko|
despacito|Despacito|Luis Fonsi feat. Daddy Yankee|PR|2017|latin-pop,reggaeton|rhythm-connector|lift,together|es|https://www.youtube.com/watch?v=kJQP7kiw5Fk
360-charli|360|Charli xcx|UK|2024|hyperpop,electropop|electric-explorer|explore,lift|en|
money-machine|money machine|100 gecs|US|2019|hyperpop,experimental|electric-explorer|explore,lift|en|
new-magic-wand|NEW MAGIC WAND|Tyler, The Creator|US|2019|alternative-hip-hop,experimental|electric-explorer|explore,lift|en|
feel-good-inc|Feel Good Inc.|Gorillaz|UK|2005|alternative,electronic|electric-explorer|explore,lift|en|
musician|Musician|Porter Robinson|US|2021|electronic,synth-pop|electric-explorer|explore,lift|en|
xs-rina|XS|Rina Sawayama|UK|2020|art-pop,electropop|electric-explorer|explore,lift|en|
stfu-rina|STFU!|Rina Sawayama|UK|2020|nu-metal,art-pop|electric-explorer|explore,lift|en|
supernova-aespa|Supernova|aespa|KR|2024|k-pop,electropop|electric-explorer|explore,lift|ko|
armageddon-aespa|Armageddon|aespa|KR|2024|k-pop,experimental-pop|electric-explorer|explore,lift|ko|
virtual-angel|Virtual Angel|ARTMS|KR|2024|k-pop,dream-pop|electric-explorer|explore,lift|ko|
cyberpunk-ateez|Cyberpunk|ATEEZ|KR|2022|k-pop,synthwave|electric-explorer|explore,lift|ko|
seventh-sense|The 7th Sense|NCT U|KR|2016|k-pop,alternative-rnb|electric-explorer|explore,lift|ko|
simon-says|Simon Says|NCT 127|KR|2018|k-pop,experimental-pop|electric-explorer|explore,lift|ko|
kick-back|KICK BACK|Kenshi Yonezu|JP|2022|j-rock,electronic-rock|electric-explorer|explore,lift|ja|
usseewa|Usseewa|Ado|JP|2020|j-pop,rock|electric-explorer|explore,lift|ja|
odo-ado|Odo|Ado|JP|2021|j-pop,electronic|electric-explorer|explore,lift|ja|
kaibutsu|Kaibutsu|YOASOBI|JP|2021|j-pop,electropop|electric-explorer|explore,lift|ja|
gimme-chocolate|Gimme Chocolate!!|BABYMETAL|JP|2014|kawaii-metal,electronic|electric-explorer|explore,lift|ja|
raingurl|Raingurl|Yaeji|US|2017|house,electronic|electric-explorer|explore,lift|en|
bad-guy|bad guy|Billie Eilish|US|2019|electropop,alternative|electric-explorer|explore,lift|en|https://www.youtube.com/watch?v=DyDfgMOUjCI
shake-it-off|Shake It Off|Taylor Swift|US|2014|pop,dance-pop|golden-chorus|lift,together|en|https://www.youtube.com/watch?v=nfWlot6h_JM
good-as-hell|Good as Hell|Lizzo|US|2016|pop,soul|golden-chorus|lift,together|en|
i-aint-worried|I Ain’t Worried|OneRepublic|US|2022|pop,pop-rock|golden-chorus|lift,together|en|
roar|Roar|Katy Perry|US|2013|pop,anthem|golden-chorus|lift,together|en|
firework|Firework|Katy Perry|US|2010|pop,anthem|golden-chorus|lift,together|en|
count-on-me|Count on Me|Bruno Mars|US|2010|pop,acoustic|golden-chorus|lift,together|en|
happy|Happy|Pharrell Williams|US|2013|pop,soul|golden-chorus|lift,together|en|
walking-sunshine|Walking on Sunshine|Katrina and the Waves|UK|1985|pop-rock,new-wave|golden-chorus|lift,together|en|https://www.youtube.com/watch?v=iPUmE-tne5U
you-belong-with-me|You Belong with Me|Taylor Swift|US|2008|country-pop,pop|golden-chorus|lift,together|en|
as-it-was|As It Was|Harry Styles|UK|2022|pop,synth-pop|golden-chorus|lift,together|en|
beautiful-day|Beautiful Day|U2|IE|2000|rock,anthem|golden-chorus|lift,together|en|
love-wins-all|Love wins all|IU|KR|2024|k-pop,ballad|golden-chorus|lift,together|ko|
celebrity-iu|Celebrity|IU|KR|2021|k-pop,dance-pop|golden-chorus|lift,together|ko|
eight-iu|eight|IU feat. SUGA|KR|2020|k-pop,pop-rock|golden-chorus|lift,together|ko|
feel-special|Feel Special|TWICE|KR|2019|k-pop,dance-pop|golden-chorus|lift,together|ko|
into-new-world|Into The New World|Girls’ Generation|KR|2007|k-pop,anthem|golden-chorus|lift,together|ko|
gee|Gee|Girls’ Generation|KR|2009|k-pop,dance-pop|golden-chorus|lift,together|ko|
spring-day|Spring Day|BTS|KR|2017|k-pop,alternative-pop|golden-chorus|lift,together|ko|
permission-dance|Permission to Dance|BTS|KR|2021|k-pop,dance-pop|golden-chorus|lift,together|ko|
sky-full-stars|A Sky Full of Stars|Coldplay|UK|2014|pop-rock,edm|golden-chorus|lift,together|en|`;

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function hashNumber(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function parseTrack(line) {
  const [id, title, artist, region, year, genres, preset, contexts, language, youtube] = line.split('|');
  const platforms = youtube ? { youtube } : {};
  const baseTags = {
    'midnight-dreamer': ['dreamy', 'night', 'emotional'],
    'neon-runner': ['drive', 'impact', 'urban'],
    'warm-vinyl': ['warm', 'organic', 'intimate'],
    'cosmic-architect': ['experimental', 'layered', 'instrumental'],
    'quiet-cinematic': ['cinematic', 'calm', 'focus'],
    'rhythm-connector': ['groove', 'dance', 'social'],
    'electric-explorer': ['novel', 'electronic', 'dynamic'],
    'golden-chorus': ['chorus', 'warm', 'uplifting']
  }[preset] || [];
  const genreList = genres.split(',').filter(Boolean);
  const contextList = contexts.split(',').filter(Boolean);
  const base = ARCHETYPE_BY_ID[preset]?.centroid || { energy: 50, warmth: 50, novelty: 50, organic: 50, complexity: 50, sociality: 50 };
  const profile = Object.freeze(Object.fromEntries(Object.keys(base).map((axis, index) => {
    const jitter = ((hashNumber(`${id}:${axis}`) >>> (index % 8)) % 17) - 8;
    return [axis, Math.round(clamp(base[axis] + jitter))];
  })));
  return Object.freeze({
    id, title, artist, region, year: Number(year), decade: Math.floor(Number(year) / 10) * 10,
    language, genres: Object.freeze(genreList), preset,
    contexts: Object.freeze(contextList), tags: Object.freeze([...new Set([...baseTags, ...genreList])]),
    platforms: Object.freeze(platforms), profile
  });
}

export const TRACKS = Object.freeze(RAW_TRACKS.trim().split('\n').map(parseTrack));
export const CATALOG_STATS = Object.freeze({
  total: TRACKS.length,
  asian: TRACKS.filter((track) => ['KR', 'JP', 'TH', 'CN', 'TW', 'ID', 'PH', 'SG'].includes(track.region)).length,
  regions: Object.freeze([...new Set(TRACKS.map((track) => track.region))]),
  decades: Object.freeze([...new Set(TRACKS.map((track) => track.decade))].sort()),
  genres: Object.freeze([...new Set(TRACKS.flatMap((track) => track.genres))].sort())
});
