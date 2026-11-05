// =====================================================================
// COMPARTIDO entre Estoico (index.html) y Entreno (entreno.html)
// Configuración de hábitos, fechas y cálculo semanal. Se carga como
// <script> clásico antes que el resto y queda en window.EstoicoShared.
// =====================================================================
(function () {
  'use strict';

  const ESTOICO_KEY = 'trivium.v2';
  const DIAS_CICLO = 84; // 12 semanas

  const HABITS = [
    { id: 'python', category: 'mente', name: 'Aprender Python', icon: 'code', weeklyTarget: 3, weight: 4 },
    { id: 'lectura', category: 'mente', name: 'Leer', icon: 'book', weeklyTarget: 3, weight: 4 },
    { id: 'entrenar', category: 'cuerpo', name: 'Entrenar', icon: 'dumbbell', weeklyTarget: 4, weight: 5 },
    { id: 'agua', category: 'cuerpo', name: 'Agua +2L', icon: 'drop', weeklyTarget: 7, weight: 5 },
    { id: 'alcohol', category: 'cuerpo', name: 'No alcohol', icon: 'glass-off', weeklyTarget: 7, weight: 5 },
    { id: 'azucar', category: 'cuerpo', name: 'No azúcar', icon: 'ban', weeklyTarget: 5, weight: 5 },
    { id: 'meditar', category: 'alma', name: 'Meditar', icon: 'wind', weeklyTarget: 4, weight: 3 },
    { id: 'ayudar', category: 'alma', name: 'Ayudar a alguien', icon: 'heart', weeklyTarget: 1, weight: 3 }
  ];

  // 'YYYY-MM-DD' en hora local
  function dateKey(d = new Date()) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // Fecha local a mediodía (evita saltos por cambio de horario al mostrarla)
  function parseDate(k) {
    return new Date(k + 'T12:00:00');
  }

  function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }

  // Días de calendario entre dos claves 'YYYY-MM-DD' (b - a), sin depender de la hora del día
  function dayDiff(a, b) {
    const [y1, m1, d1] = a.split('-').map(Number);
    const [y2, m2, d2] = b.split('-').map(Number);
    return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 864e5);
  }

  // Semana del ciclo (sin limitar: puede ser < 1 antes de empezar o > 12 al terminar)
  function weekNumber(cycleStart, dateStr = dateKey()) {
    return Math.floor(dayDiff(cycleStart, dateStr) / 7) + 1;
  }

  // Posición de una fecha dentro del ciclo: { week: 1..12, dow: 0..6 } o null si queda afuera
  function position(cycleStart, dateStr) {
    const idx = dayDiff(cycleStart, dateStr);
    if (idx < 0 || idx >= DIAS_CICLO) return null;
    return { week: Math.floor(idx / 7) + 1, dow: idx % 7 };
  }

  // Cumplimiento (%) y puntos de una semana a partir de los días marcados por hábito
  function computeWeek(habitsByDay) {
    let completion = 0, points = 0;
    HABITS.forEach((h) => {
      const n = ((habitsByDay || {})[h.id] || []).length;
      if (n >= h.weeklyTarget) points += h.weight;
      completion += Math.min(100, Math.round((n / h.weeklyTarget) * 100)) / HABITS.length;
    });
    return { completion: Math.round(completion), points };
  }

  // ---------- Íconos (estilo Lucide, trazo 1.75) ----------
  const ICONS = {
    check: '<path d="M20 6 9 17l-5-5"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/>',
    chart: '<path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3"/>',
    quote: '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2H4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h3c0 3-1 4-4 5M15 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2h-4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h3c0 3-1 4-4 5"/>',
    dumbbell: '<path d="M6 7v10M18 7v10M3 9.5v5M21 9.5v5M6 12h12"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    trend: '<path d="M22 7l-8.5 8.5-5-5L2 17M16 7h6v6"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    sliders: '<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/>',
    code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    drop: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5S12.5 5.5 12 3c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z"/>',
    'glass-off': '<path d="M8 22h8M12 15v7M7 3h10l-.8 6.5A4.2 4.2 0 0 1 12 15a4.2 4.2 0 0 1-4.2-5.5zM3 3l18 18"/>',
    ban: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
    wind: '<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2M9.6 4.6A2 2 0 1 1 11 8H2M12.6 19.4A2 2 0 1 0 14 16H2"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    back: '<path d="m12 19-7-7 7-7M19 12H5"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/>'
  };

  // Sprite con todos los íconos, insertado una vez al principio del <body>
  (function injectSprite() {
    const symbols = Object.entries(ICONS).map(([id, p]) => `<symbol id="i-${id}" viewBox="0 0 24 24">${p}</symbol>`).join('');
    document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${symbols}</svg>`);
  })();

  function icon(name, cls = '') {
    return `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  }

  // ---------- Aviso (toast) ----------
  // Requiere <div class="toast" id="toast" role="status" aria-live="polite"></div>
  let toastTimer;
  // ic: nombre del ícono (por defecto un check); null para avisos sin ícono, como errores
  function toast(msg, ms = 2400, ic = 'check') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.innerHTML = (ic ? icon(ic) : '') + '<span></span>';
    el.lastChild.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  }

  // ---------- Service worker ----------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('No se pudo registrar el service worker:', err));
    });
  }

  window.EstoicoShared = { ESTOICO_KEY, DIAS_CICLO, HABITS, dateKey, parseDate, addDays, dayDiff, weekNumber, position, computeWeek, icon, toast };
})();
