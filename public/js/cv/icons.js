/* Jeu d'icônes tracées (16×16), injectées telles quelles dans le document du CV. */

const paths = {
  mail: '<path d="M1.8 3.8h12.4v8.4H1.8z"/><path d="m1.8 4.4 6.2 4.6 6.2-4.6"/>',
  phone: '<path d="M3 2.6h2.7l1 2.9-1.6 1.1a9 9 0 0 0 4.3 4.3l1.1-1.6 2.9 1V13a1 1 0 0 1-1.1 1A11.6 11.6 0 0 1 2 3.7 1 1 0 0 1 3 2.6z"/>',
  pin: '<path d="M8 14.4s4.9-4.7 4.9-8A4.9 4.9 0 0 0 3.1 6.4c0 3.3 4.9 8 4.9 8z"/><circle cx="8" cy="6.3" r="1.9"/>',
  globe: '<circle cx="8" cy="8" r="6.2"/><path d="M1.9 8h12.2"/><path d="M8 1.8c2.9 3.4 2.9 9 0 12.4M8 1.8C5.1 5.2 5.1 10.8 8 14.2"/>',
  link: '<path d="M6.6 9.4a3 3 0 0 0 4.2 0l2-2a3 3 0 1 0-4.2-4.2l-.9.9"/><path d="M9.4 6.6a3 3 0 0 0-4.2 0l-2 2a3 3 0 1 0 4.2 4.2l.9-.9"/>',
  linkedin: '<rect x="1.8" y="1.8" width="12.4" height="12.4" rx="2.4"/><path d="M4.6 6.9v4.3M4.6 4.6v.1M7.4 11.2V6.9M7.4 8.6a1.9 1.9 0 0 1 3.8 0v2.6"/>',
  github: '<path d="M5.6 4.6 2.2 8l3.4 3.4M10.4 4.6 13.8 8l-3.4 3.4"/>',
  cal: '<rect x="2" y="3.2" width="12" height="10.8" rx="1.6"/><path d="M2 6.4h12M5.4 1.9v2.6M10.6 1.9v2.6"/>',
  user: '<circle cx="8" cy="5.4" r="2.9"/><path d="M2.6 14c.6-2.9 2.8-4.4 5.4-4.4S12.8 11.1 13.4 14"/>',
  id: '<rect x="1.8" y="3" width="12.4" height="10" rx="1.8"/><circle cx="5.8" cy="7.4" r="1.6"/><path d="M3.4 11.4c.4-1.3 1.3-2 2.4-2s2 .7 2.4 2M10 6.6h2.6M10 9.4h2.6"/>',
  car: '<path d="M2 10.4V8l1.6-3.4h8.8L14 8v2.4"/><path d="M2 10.4h12v1.8h-2.4v-1.8M4.4 12.2H2v-1.8"/><circle cx="4.8" cy="10.4" r="1.1"/><circle cx="11.2" cy="10.4" r="1.1"/>',

  /* pastilles de rubrique */
  briefcase: '<rect x="2" y="4.9" width="12" height="8.4" rx="1.4"/><path d="M5.9 4.9V3.7a1.3 1.3 0 0 1 1.3-1.3h1.6a1.3 1.3 0 0 1 1.3 1.3v1.2M2 8.4h12"/>',
  cap: '<path d="M8 2.3 14.7 5.7 8 9.1 1.3 5.7z"/><path d="M4.2 7.3v3.4c0 1.2 1.7 2.2 3.8 2.2s3.8-1 3.8-2.2V7.3"/>',
  chart: '<path d="M2.3 13.5h11.4"/><path d="M4.2 13.5V8.6M8 13.5V4.9M11.8 13.5V6.8"/>',
  users: '<circle cx="6.1" cy="5.6" r="2.4"/><path d="M1.9 13.4c.5-2.4 2.2-3.9 4.2-3.9s3.7 1.5 4.2 3.9"/><path d="M10.7 3.6a2.4 2.4 0 0 1 0 4.5M11.7 9.9c1.4.5 2.2 1.7 2.5 3.5"/>',
  flag: '<path d="M3.7 14.1V2.3M3.7 3.1h8.2L10.3 5.7l1.6 2.6H3.7"/>',
  award: '<circle cx="8" cy="6.1" r="3.7"/><path d="m5.9 9.3-.8 4.6L8 12.3l2.9 1.6-.8-4.6"/>',
  spark: '<path d="M8 1.8 9.6 6 13.9 7.6 9.6 9.2 8 13.5 6.4 9.2 2.1 7.6 6.4 6z"/>',
};

/** Renvoie le balisage SVG d'une icône, ou une chaîne vide si inconnue. */
export function icon(name, size = 13) {
  if (!paths[name]) return '';
  return `<svg class="ico" viewBox="0 0 16 16" width="${size}" height="${size}" fill="none" `
    + `stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" `
    + `aria-hidden="true">${paths[name]}</svg>`;
}
