// Figura de nivel de Estoico: una sola plantilla SVG que evoluciona del nivel 1 al 12.
// Silueta plana (como el logo) pintada con currentColor; los detalles son cortes
// transparentes hechos con una máscara, así funciona sobre cualquier fondo.
(function (global) {
  'use strict';
  const f = n => Math.round(n * 100) / 100;

  function figuraNivel(L, uid) {
    L = Math.min(12, Math.max(1, L | 0));
    const id = 'fn' + L + (uid ? '-' + uid : '');
    const t = (L - 1) / 11;                  // 0 → 1
    const hunch = Math.max(0, 1 - t * 3.2);  // encorvado solo en los primeros niveles
    const C = 24;

    // Proporciones que crecen con el nivel
    const S = 5.6 + 6.4 * t;    // medio ancho de hombros
    const W = 4.3 + 1.5 * t;    // medio ancho de cintura
    const H = 4.9 + 1.7 * t;    // medio ancho de cadera
    const A = 2.1 + 3.4 * t;    // grosor de brazo
    const B = 0.2 + 2.4 * t;    // bíceps
    const Lb = 0.3 + 1.6 * t;   // muslo
    const r = 3.5;              // cabeza (constante)
    const headY = 7.6 + hunch * 1.8;
    const shY = 13.4 + hunch * 1.4;
    const slope = hunch * 3.2;  // hombros caídos
    const waistY = 26.6, hemY = 32.6, footY = 44.6;
    const spread = 3.3 + 3.0 * t;   // postura más abierta
    const neckW = 1.3 + 0.9 * t;

    const white = [], black = [], laurel = [];

    white.push(`<circle cx="${C}" cy="${f(headY)}" r="${r}"/>`);
    white.push(`<rect x="${f(C - neckW)}" y="${f(headY + r - 1)}" width="${f(neckW * 2)}" height="${f(shY - headY - r + 2)}"/>`);
    white.push(`<path d="M${f(C - S)} ${f(shY + slope)}Q${C} ${f(shY - 1.8)} ${f(C + S)} ${f(shY + slope)}L${f(C + W)} ${waistY}L${f(C - W)} ${waistY}Z"/>`);
    white.push(`<path d="M${f(C - W)} ${waistY - 0.3}L${f(C + W)} ${waistY - 0.3}L${f(C + H + 0.9)} ${hemY}L${f(C - H - 0.9)} ${hemY}Z"/>`);

    for (const s of [1, -1]) {
      const x = v => f(C + s * v);
      // Pierna
      const xi = 0.85, xo = H, fo = spread + 1.5, fi = spread - 1.5, my = (hemY + footY) / 2;
      white.push(`<path d="M${x(xi)} ${hemY - 1}L${x(xo)} ${hemY - 1}Q${x(xo + Lb)} ${f(my)} ${x(fo)} ${footY}L${x(fi)} ${footY}Q${x(xi + 0.3)} ${f(my + 2)} ${x(xi)} ${hemY - 1}Z"/>`);
      // Brazo: hombro redondo, bíceps arriba y antebrazo que se afina hacia la mano
      const sx = S - 0.6, sy = shY + slope + 0.2, hx = S + 0.3 + 1.2 * t, hy = 30.8;
      white.push(`<path d="M${x(sx - A * 0.25)} ${f(sy - 0.8)}` +
        `C${x(sx + A * 0.7 + B)} ${f(sy - 0.4)} ${x(hx + A * 0.45 + B)} ${f(sy + 5)} ${x(hx + A * 0.28)} ${hy}` +
        `Q${x(hx)} ${f(hy + 1.2)} ${x(hx - A * 0.28)} ${hy}` +
        `C${x(hx - A * 0.3)} ${f(sy + 9)} ${x(sx - A * 0.35)} ${f(sy + 6)} ${x(sx - A * 0.45)} ${f(sy + 3.4)}Z"/>`);
      // Corte que separa el brazo del torso
      black.push(`<path d="M${x(sx - A * 0.45)} ${f(sy + 3.4)}C${x(sx - A * 0.35)} ${f(sy + 6)} ${x(hx - A * 0.3)} ${f(sy + 9)} ${x(hx - A * 0.28)} ${hy}"/>`);
      // Pectorales (desde el nivel 4)
      if (L >= 4) {
        const p0 = Math.min(S * 0.6, sx - A * 0.45 - 0.6);
        black.push(`<path d="M${x(p0)} ${f(shY + 4.6)}Q${x(p0 * 0.5)} ${f(shY + 6.4)} ${x(0.5)} ${f(shY + 5.4)}"/>`);
      }
    }

    // Detalles que se suman con el nivel
    black.push(`<path d="M${f(C - W)} ${waistY}H${f(C + W)}"/>`);          // cinturón (siempre)
    black.push(`<path d="M${C} ${waistY + 1.5}V${hemY + 0.5}"/>`);          // pliegue de la túnica (siempre)
    if (L >= 6) black.push(`<path d="M${C} ${f(shY + 2.4)}V${waistY - 1.2}"/>`);   // esternón
    if (L >= 8) black.push(`<path d="M${f(C - W * 0.55)} ${f(shY + 8.6)}H${f(C + W * 0.55)}"/>`);  // abdominales 1
    if (L >= 10) black.push(`<path d="M${f(C - W * 0.55)} ${f(shY + 11)}H${f(C + W * 0.55)}"/>`);  // abdominales 2
    if (L >= 12) {                                                           // corona de laurel final: hojas alrededor de la cabeza
      const R = r + 1.5, cy = headY + 0.4;
      for (const s of [1, -1]) for (const deg of [28, 62, 96]) {
        const a = deg * Math.PI / 180, px = C + s * R * Math.sin(a), py = cy - R * Math.cos(a);
        const rot = s * deg + (s > 0 ? -30 : 30);
        laurel.push(`<ellipse cx="${f(px)}" cy="${f(py)}" rx="1.35" ry="0.62" transform="rotate(${f(rot)} ${f(px)} ${f(py)})"/>`);
      }
    }

    return `<svg class="fig" viewBox="0 0 48 48" aria-hidden="true" focusable="false">` +
      `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="48">` +
      `<rect width="48" height="48" fill="#000"/>` +
      `<g fill="#fff">${white.join('')}</g>` +
      (laurel.length ? `<g fill="#fff">${laurel.join('')}</g>` : '') +
      `<g fill="none" stroke="#000" stroke-width="1.1" stroke-linecap="round">${black.join('')}</g>` +
      `</mask></defs><rect width="48" height="48" fill="currentColor" mask="url(#${id})"/></svg>`;
  }

  global.figuraNivel = figuraNivel;
})(typeof window !== 'undefined' ? window : globalThis);
