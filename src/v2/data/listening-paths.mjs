export const LISTENING_PATHS = Object.freeze({ night:'night-walk', focus:'focused-afternoon', lift:'a-little-lift', together:'between-conversations' });
export function guidePath(id, language = 'kr') {
  const slug = Object.hasOwn(LISTENING_PATHS,id) ? LISTENING_PATHS[id] : '';
  return `${language === 'en' ? '/en' : ''}/listening/${slug ? `${slug}/` : ''}`;
}
