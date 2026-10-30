import { getProfileArchetype, localize } from '../../domain/profile.mjs?v=qg1';
import { recordTheme, renderRecordArt } from '../../brand/record-art.mjs?result=rs1';
import { escapeHtml } from '../helpers.mjs?weekly=m4w1&listening=ln1&journal=jn1';

export function listenerCard(profile, label, language) {
  const archetype = getProfileArchetype(profile);
  const theme = recordTheme(archetype.id);
  return `<article class="listener-card" style="--record-paper:${theme.paper}">
    <span class="listener-card__label">${escapeHtml(label)}</span>
    <div class="listener-card__art">${renderRecordArt(archetype.id)}</div>
    <strong>${escapeHtml(localize(archetype.name, language))}</strong>
    <p>${escapeHtml(localize(archetype.tagline, language))}</p>
  </article>`;
}
