/* Avatar générique utilisé dans les aperçus de la galerie, pour montrer
   où la photo se place dans chaque modèle. Ce n'est pas une photographie :
   une silhouette neutre, encodée en SVG, donc sans fichier externe. */

const AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e3e9f3"/>
      <stop offset="1" stop-color="#c6d0e2"/>
    </linearGradient>
    <clipPath id="frame"><rect width="240" height="240"/></clipPath>
  </defs>
  <rect width="240" height="240" fill="url(#bg)"/>
  <g clip-path="url(#frame)" fill="#93a0b8">
    <circle cx="120" cy="94" r="41"/>
    <ellipse cx="120" cy="233" rx="76" ry="82"/>
  </g>
</svg>`;

export const PLACEHOLDER_AVATAR = `data:image/svg+xml,${encodeURIComponent(AVATAR_SVG)}`;
