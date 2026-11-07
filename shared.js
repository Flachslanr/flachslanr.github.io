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
    { id: 'python', category: 'mente', name: 'Aprender Python', icon: 'code', weeklyTarget: 3 },
    { id: 'lectura', category: 'mente', name: 'Leer', icon: 'book', weeklyTarget: 3 },
    { id: 'entrenar', category: 'cuerpo', name: 'Entrenar', icon: 'dumbbell', weeklyTarget: 4 },
    { id: 'agua', category: 'cuerpo', name: 'Agua +2L', icon: 'drop', weeklyTarget: 7 },
    { id: 'alcohol', category: 'cuerpo', name: 'No alcohol', icon: 'glass-off', weeklyTarget: 7 },
    { id: 'azucar', category: 'cuerpo', name: 'No azúcar', icon: 'ban', weeklyTarget: 5 },
    { id: 'meditar', category: 'alma', name: 'Meditar', icon: 'wind', weeklyTarget: 4 },
    { id: 'regalo', category: 'alma', name: 'Hacer un regalo', icon: 'gift', weeklyTarget: 1 }
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

  // Cumplimiento (%) de una semana: promedio de cada hábito respecto de su meta (tope 100)
  function computeWeek(habitsByDay) {
    let completion = 0;
    HABITS.forEach((h) => {
      const n = ((habitsByDay || {})[h.id] || []).length;
      completion += Math.min(100, Math.round((n / h.weeklyTarget) * 100)) / HABITS.length;
    });
    return { completion: Math.round(completion) };
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
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    back: '<path d="m12 19-7-7 7-7M19 12H5"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/>',
    play: '<path d="M6 4l14 8-14 8z"/>',
    timer: '<circle cx="12" cy="14" r="8"/><path d="M10 2h4M12 14l3-3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    column: '<path d="M3 4h18M5 7h14M6 20h12M3 22h18M7.5 7v13M10.5 7v13M13.5 7v13M16.5 7v13"/>'
  };

  // Sprite con todos los íconos, insertado una vez al principio del <body>
  (function injectSprite() {
    const symbols = Object.entries(ICONS).map(([id, p]) => `<symbol id="i-${id}" viewBox="0 0 24 24">${p}</symbol>`).join('');
    document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${symbols}</svg>`);
  })();

  function icon(name, cls = '') {
    return `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  }

  // Fracción del ciclo de 84 días ya recorrida (0 a 1)
  function cycleProgress(cycleStart, today = dateKey()) {
    return Math.max(0, Math.min(1, (dayDiff(cycleStart, today) + 1) / DIAS_CICLO));
  }

  // Anillo de progreso del encabezado (p de 0 a 1)
  function ring(p, text, label) {
    const C = 138.23, off = (C * (1 - Math.max(0, Math.min(1, p)))).toFixed(1);
    return `<svg class="ring" viewBox="0 0 52 52" role="img" aria-label="${label}"><circle class="bgc" cx="26" cy="26" r="22"/>` +
      `<circle class="fg" cx="26" cy="26" r="22" stroke-dasharray="${C}" stroke-dashoffset="${off}" transform="rotate(-90 26 26)"/>` +
      `<text x="26" y="30" text-anchor="middle" aria-hidden="true">${text}</text></svg>`;
  }

  // Check que se dibuja (el trazo se anima con CSS)
  const CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

  // ---------- Micro-interacciones ----------
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reinicia una animación CSS basada en una clase (pop, bump, pop-halo)
  function pop(el, cls = 'pop') {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    const off = (ev) => { if (ev.target === el) { el.classList.remove(cls); el.removeEventListener('animationend', off); } };
    el.addEventListener('animationend', off);
  }

  // Número que cuenta hasta el valor nuevo. Recuerda el último valor en data-n.
  function countUp(el, to, fmt = String, ms = 500) {
    if (!el) return;
    const from = el.dataset.n === undefined ? to : Number(el.dataset.n);
    el.dataset.n = to;
    cancelAnimationFrame(el._raf);
    if (from === to || reduceMotion()) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(Math.round(from + (to - from) * e));
      if (k < 1) el._raf = requestAnimationFrame(step);
    };
    el._raf = requestAnimationFrame(step);
  }

  // Confetti breve (≈1,6 s) desde un elemento o desde arriba al centro.
  // Solo para logros: semana al 100% y récords. No corre con movimiento reducido.
  function confetti(origin) {
    if (reduceMotion()) return;
    const c = document.createElement('canvas');
    c.className = 'confetti';
    c.setAttribute('aria-hidden', 'true');
    const W = innerWidth, H = innerHeight, dpr = Math.min(2, devicePixelRatio || 1);
    c.width = W * dpr; c.height = H * dpr;
    document.body.appendChild(c);
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    const cs = getComputedStyle(document.body);
    const cols = ['--accent', '--bronce', '--patina', '--mente', '--alma', '--text'].map((v) => cs.getPropertyValue(v).trim()).filter(Boolean);
    let ox = W / 2, oy = H * 0.3;
    if (origin) { const r = origin.getBoundingClientRect(); ox = r.left + r.width / 2; oy = r.top + r.height / 2; }
    const P = Array.from({ length: 70 }, (_, i) => {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.85, s = 7 + Math.random() * 8;
      return { x: ox, y: oy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, w: 5 + Math.random() * 4, h: 9 + Math.random() * 5,
        r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.35, c: cols[i % cols.length] };
    });
    const DUR = 1600, t0 = performance.now();
    let last = t0;
    const frame = (t) => {
      const k = (t - t0) / DUR, dt = Math.min(3, (t - last) / 16.67); // normalizado a 60 fps
      last = t;
      ctx.clearRect(0, 0, W, H);
      if (k >= 1) { c.remove(); return; }
      ctx.globalAlpha = k < 0.65 ? 1 : 1 - (k - 0.65) / 0.35;
      P.forEach((p) => {
        p.vy += 0.32 * dt;
        const drag = Math.pow(0.975, dt);
        p.vx *= drag; p.vy *= drag;
        p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 1.7)) + 1);
        ctx.restore();
      });
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  // ---------- Accesibilidad ----------
  // Pestañas de la barra inferior: aria-selected, foco itinerante y flechas.
  // onSelect(vista) se llama al tocar o al moverse con el teclado.
  // Devuelve select(vista) para marcar la pestaña activa desde la app.
  function tabs(onSelect) {
    const bar = document.querySelector('.tabbar');
    const list = [...bar.querySelectorAll('[role="tab"]')];
    const select = (v) => list.forEach((t) => {
      const on = t.dataset.view === v;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
    });
    bar.addEventListener('click', (ev) => { const b = ev.target.closest('[data-view]'); if (b) onSelect(b.dataset.view); });
    bar.addEventListener('keydown', (ev) => {
      const i = list.indexOf(document.activeElement);
      let j = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: list.length - 1 }[ev.key];
      if (i < 0 || j === undefined) return;
      ev.preventDefault();
      j = (j + list.length) % list.length;
      list[j].focus();
      if (list[j].dataset.view) onSelect(list[j].dataset.view);
    });
    return select;
  }

  // Diálogo modal: deja inerte el resto de la página, mueve el foco adentro
  // y devuelve close(restaurar) para soltarlo y volver el foco a donde estaba.
  function dialog(el, focusEl) {
    const prev = document.activeElement;
    const others = [...document.body.children].filter((c) => c !== el && !c.contains(el) && c.tagName !== 'SCRIPT' && !c.matches('.toast, .scrim, .update-pill'));
    others.forEach((c) => { c.inert = true; });
    (focusEl || el.querySelector('input, button, [tabindex]'))?.focus({ preventScroll: true });
    return function close(restore = true) {
      others.forEach((c) => { c.inert = false; });
      if (restore && prev && document.contains(prev)) prev.focus({ preventScroll: true });
    };
  }

  // ---------- Copia de respaldo ----------
  // Comparte el archivo (hoja de iOS para guardarlo en Archivos o mandarlo)
  // o lo descarga. Devuelve 'compartido', 'descargado' o 'cancelado'; si
  // ninguna vía funciona, lanza un error para que la app muestre el texto.
  async function exportFile(txt, nombre, titulo) {
    try {
      const file = new File([txt], nombre, { type: 'application/json' });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: titulo }); return 'compartido'; }
    } catch (e) { if (e.name === 'AbortError') return 'cancelado'; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' }));
    a.download = nombre;
    a.click();
    return 'descargado';
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
  // Cuando se publica una versión nueva y toma el control con la app abierta,
  // se ofrece recargar (no se recarga sola para no cortar lo que estés haciendo).
  function showUpdate() {
    if (document.getElementById('update-pill')) return;
    const b = document.createElement('button');
    b.id = 'update-pill';
    b.type = 'button';
    b.className = 'update-pill';
    b.innerHTML = icon('refresh') + '<span>Hay una versión nueva. Actualizar</span>';
    b.onclick = () => location.reload();
    document.body.appendChild(b);
  }

  if ('serviceWorker' in navigator) {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) showUpdate(); });
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('No se pudo registrar el service worker:', err));
    });
  }

  window.EstoicoShared = { ESTOICO_KEY, DIAS_CICLO, HABITS, dateKey, parseDate, addDays, dayDiff, weekNumber, position, computeWeek, cycleProgress, ring, CHECK_SVG, icon, toast, pop, countUp, confetti, reduceMotion, tabs, dialog, exportFile };
})();
