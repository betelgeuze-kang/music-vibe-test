const track = (entry) => Object.freeze({
  ...entry,
  profile: Object.freeze(entry.profile),
  contexts: Object.freeze(entry.contexts),
  tags: Object.freeze(entry.tags)
});

export const TRACKS = Object.freeze([
  track({ id: 'space-song', title: 'Space Song', artist: 'Beach House', profile: { energy: 28, warmth: 66, novelty: 62, organic: 46, complexity: 58, sociality: 18 }, contexts: ['night', 'reset'], tags: ['dreamy', 'night', 'spacious'] }),
  track({ id: 'about-you', title: 'About You', artist: 'The 1975', profile: { energy: 38, warmth: 72, novelty: 54, organic: 48, complexity: 52, sociality: 26 }, contexts: ['night', 'reset'], tags: ['dreamy', 'memory', 'night'] }),
  track({ id: 'apocalypse', title: 'Apocalypse', artist: 'Cigarettes After Sex', profile: { energy: 20, warmth: 68, novelty: 44, organic: 58, complexity: 34, sociality: 14 }, contexts: ['night', 'reset'], tags: ['slow', 'dreamy', 'intimate'] }),
  track({ id: 'wait', title: 'Wait', artist: 'M83', profile: { energy: 38, warmth: 64, novelty: 70, organic: 34, complexity: 72, sociality: 22 }, contexts: ['night', 'focus'], tags: ['cinematic', 'dreamy', 'build'] }),
  track({ id: 'holocene', title: 'Holocene', artist: 'Bon Iver', profile: { energy: 24, warmth: 82, novelty: 48, organic: 84, complexity: 58, sociality: 18 }, contexts: ['reset', 'night'], tags: ['acoustic', 'calm', 'reflection'] }),
  track({ id: 'bloom', title: 'Bloom', artist: 'The Paper Kites', profile: { energy: 26, warmth: 88, novelty: 34, organic: 92, complexity: 38, sociality: 24 }, contexts: ['reset', 'night'], tags: ['acoustic', 'warm', 'intimate'] }),
  track({ id: 'through-the-night', title: 'Through the Night', artist: 'IU', profile: { energy: 20, warmth: 94, novelty: 30, organic: 82, complexity: 34, sociality: 28 }, contexts: ['reset', 'night'], tags: ['warm', 'acoustic', 'voice'] }),
  track({ id: 'pink-white', title: 'Pink + White', artist: 'Frank Ocean', profile: { energy: 44, warmth: 84, novelty: 58, organic: 62, complexity: 56, sociality: 42 }, contexts: ['reset', 'together'], tags: ['warm', 'groove', 'sunlight'] }),
  track({ id: 'seasons', title: 'seasons', artist: 'wave to earth', profile: { energy: 34, warmth: 82, novelty: 44, organic: 78, complexity: 42, sociality: 30 }, contexts: ['reset', 'night'], tags: ['warm', 'organic', 'walk'] }),
  track({ id: 'good-days', title: 'Good Days', artist: 'SZA', profile: { energy: 42, warmth: 78, novelty: 58, organic: 54, complexity: 58, sociality: 38 }, contexts: ['reset', 'lift'], tags: ['warm', 'healing', 'groove'] }),

  track({ id: 'avril-14th', title: 'Avril 14th', artist: 'Aphex Twin', profile: { energy: 18, warmth: 54, novelty: 82, organic: 66, complexity: 76, sociality: 8 }, contexts: ['focus', 'explore', 'reset'], tags: ['instrumental', 'experimental', 'calm'] }),
  track({ id: 'dayvan-cowboy', title: 'Dayvan Cowboy', artist: 'Boards of Canada', profile: { energy: 46, warmth: 48, novelty: 86, organic: 32, complexity: 82, sociality: 18 }, contexts: ['focus', 'explore'], tags: ['instrumental', 'experimental', 'spacious'] }),
  track({ id: 'emerald-rush', title: 'Emerald Rush', artist: 'Jon Hopkins', profile: { energy: 70, warmth: 34, novelty: 84, organic: 18, complexity: 92, sociality: 28 }, contexts: ['focus', 'explore'], tags: ['electronic', 'build', 'focus'] }),
  track({ id: 'strobe', title: 'Strobe', artist: 'deadmau5', profile: { energy: 64, warmth: 42, novelty: 72, organic: 12, complexity: 86, sociality: 36 }, contexts: ['focus', 'explore'], tags: ['electronic', 'build', 'instrumental'] }),
  track({ id: 'everything-right-place', title: 'Everything In Its Right Place', artist: 'Radiohead', profile: { energy: 44, warmth: 28, novelty: 88, organic: 24, complexity: 88, sociality: 18 }, contexts: ['focus', 'explore'], tags: ['experimental', 'layered', 'focus'] }),
  track({ id: 'giorgio-moroder', title: 'Giorgio by Moroder', artist: 'Daft Punk', profile: { energy: 72, warmth: 46, novelty: 78, organic: 20, complexity: 90, sociality: 52 }, contexts: ['focus', 'explore', 'lift'], tags: ['electronic', 'build', 'story'] }),
  track({ id: 'musician', title: 'Musician', artist: 'Porter Robinson', profile: { energy: 76, warmth: 64, novelty: 86, organic: 12, complexity: 74, sociality: 58 }, contexts: ['explore', 'lift'], tags: ['electronic', 'novel', 'bright'] }),
  track({ id: '360', title: '360', artist: 'Charli xcx', profile: { energy: 82, warmth: 38, novelty: 88, organic: 8, complexity: 66, sociality: 74 }, contexts: ['explore', 'lift', 'together'], tags: ['electronic', 'novel', 'social'] }),
  track({ id: 'money-machine', title: 'money machine', artist: '100 gecs', profile: { energy: 92, warmth: 22, novelty: 98, organic: 4, complexity: 72, sociality: 58 }, contexts: ['explore', 'lift'], tags: ['experimental', 'electronic', 'chaotic'] }),
  track({ id: 'new-magic-wand', title: 'NEW MAGIC WAND', artist: 'Tyler, The Creator', profile: { energy: 90, warmth: 28, novelty: 86, organic: 18, complexity: 76, sociality: 60 }, contexts: ['explore', 'lift'], tags: ['intense', 'novel', 'rhythm'] }),

  track({ id: 'uptown-funk', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', profile: { energy: 92, warmth: 82, novelty: 38, organic: 62, complexity: 34, sociality: 96 }, contexts: ['lift', 'together'], tags: ['dance', 'groove', 'chorus'] }),
  track({ id: 'levitating', title: 'Levitating', artist: 'Dua Lipa', profile: { energy: 86, warmth: 70, novelty: 46, organic: 30, complexity: 34, sociality: 90 }, contexts: ['lift', 'together'], tags: ['dance', 'bright', 'social'] }),
  track({ id: 'dynamite', title: 'Dynamite', artist: 'BTS', profile: { energy: 88, warmth: 86, novelty: 36, organic: 42, complexity: 30, sociality: 96 }, contexts: ['lift', 'together'], tags: ['bright', 'chorus', 'social'] }),
  track({ id: 'september', title: 'September', artist: 'Earth, Wind & Fire', profile: { energy: 84, warmth: 92, novelty: 32, organic: 78, complexity: 38, sociality: 98 }, contexts: ['lift', 'together'], tags: ['groove', 'warm', 'social'] }),
  track({ id: 'back-on-74', title: 'Back on 74', artist: 'Jungle', profile: { energy: 72, warmth: 84, novelty: 52, organic: 66, complexity: 46, sociality: 88 }, contexts: ['lift', 'together'], tags: ['groove', 'warm', 'dance'] }),
  track({ id: 'cuff-it', title: 'CUFF IT', artist: 'Beyoncé', profile: { energy: 82, warmth: 80, novelty: 48, organic: 58, complexity: 44, sociality: 94 }, contexts: ['lift', 'together'], tags: ['dance', 'chorus', 'social'] }),
  track({ id: 'shake-it-off', title: 'Shake It Off', artist: 'Taylor Swift', profile: { energy: 88, warmth: 82, novelty: 28, organic: 52, complexity: 26, sociality: 96 }, contexts: ['lift', 'together'], tags: ['bright', 'chorus', 'social'] }),
  track({ id: 'super-shy', title: 'Super Shy', artist: 'NewJeans', profile: { energy: 76, warmth: 74, novelty: 50, organic: 26, complexity: 38, sociality: 82 }, contexts: ['lift', 'together'], tags: ['bright', 'groove', 'social'] }),

  track({ id: 'humble', title: 'HUMBLE.', artist: 'Kendrick Lamar', profile: { energy: 88, warmth: 26, novelty: 62, organic: 22, complexity: 58, sociality: 72 }, contexts: ['lift', 'focus'], tags: ['rhythm', 'confidence', 'impact'] }),
  track({ id: 'power', title: 'POWER', artist: 'Kanye West', profile: { energy: 94, warmth: 44, novelty: 58, organic: 34, complexity: 64, sociality: 82 }, contexts: ['lift', 'focus', 'together'], tags: ['impact', 'confidence', 'chorus'] }),
  track({ id: 'believer', title: 'Believer', artist: 'Imagine Dragons', profile: { energy: 94, warmth: 48, novelty: 34, organic: 58, complexity: 34, sociality: 84 }, contexts: ['lift', 'focus', 'together'], tags: ['impact', 'drive', 'chorus'] }),
  track({ id: 'run-boy-run', title: 'Run Boy Run', artist: 'Woodkid', profile: { energy: 88, warmth: 40, novelty: 58, organic: 76, complexity: 68, sociality: 72 }, contexts: ['focus', 'lift'], tags: ['cinematic', 'drive', 'organic'] })
]);
