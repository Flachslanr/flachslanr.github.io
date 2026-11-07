// =====================================================================
// ENTRENO — interfaz
// =====================================================================
import { SEMANAS, SECUENCIA, DIAS, EJ, ESCALERA, fase, rx, ytUrl, esDescarga } from './entreno-programa.js';
import { S, guardar, guardarSesion, borrarSesion, ordenadas, ultimaDe, mejorDe, serieDe, exportar, leerCopia, aplicarCopia, marcarEnEstoico, cicloEstoico } from './entreno-store.js';
const SH = window.EstoicoShared;

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const hoyISO = () => SH.dateKey();
const fmt = (iso) => { const [, m, d] = iso.split('-'); return `${d}/${m}`; };
const mmss = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
const num = (v) => String(v).replace('.', ',');
const vacio = (v) => v === null || v === undefined || v === '';
const UNIDAD = { reps: 'reps', s: 'segundos', rondas: 'rondas', total: 'reps totales' };

function semanaActual() {
  return Math.min(SEMANAS, Math.max(1, SH.weekNumber(S.inicio)));
}
function proxima() {
  const u = ordenadas()[0];
  if (!u) return SECUENCIA[0];
  return SECUENCIA[(SECUENCIA.indexOf(u.dia) + 1) % SECUENCIA.length];
}
const toast = (t, ms, ic) => SH.toast(t, ms, ic);
const err = (t) => SH.toast(t, 3200, null);

// ---------- Encabezado ----------
function renderHeader() {
  const w = semanaActual(), p = SH.cycleProgress(S.inicio), pct = Math.round(p * 100);
  $('#h-eyebrow').textContent = `Calistenia, semana ${w} de ${SEMANAS}`;
  $('#h-ring').innerHTML = SH.ring(p, pct + '%', `Programa recorrido al ${pct}%`);
}

// ---------- Sugerencia de progresión ----------
function sugerencia(id, w) {
  const e = EJ[id], r = rx(id, w);
  if (e.sinSugerencia || e.u === 'ok' || r.test || esDescarga(w)) return null;
  const last = ultimaDe(id); if (!last) return null;
  const v = last.v.filter((x) => !vacio(x)).map(Number);
  if (e.u === 'total') return v[0] >= r.lo ? { tipo: 'ok', txt: 'Completaste el EMOM la última vez. El plan suma un minuto por semana.' } : null;
  if (v.length < r.series) return { tipo: 'seguir', txt: `La última vez hiciste ${v.length} de ${r.series} series. Completalas todas antes de subir.` };
  if (v.every((x) => x >= r.hi)) return { tipo: 'sube', txt: e.sube ? 'Subí: ' + e.sube : 'Subí la dificultad.' };
  if (v.some((x) => x < r.lo)) return { tipo: 'mantener', txt: `Mantené: buscá llegar a ${r.lo} en todas las series.` };
  return { tipo: 'seguir', txt: `Seguí: sumá reps hasta ${r.hi} en todas las series.` };
}
const TIP = { sube: 'var(--patina)', mantener: 'var(--warn)', seguir: 'var(--mente)', ok: 'var(--patina)' };

// ---------- Vista: sesión ----------
let diaSel = null;
const YT_ICON = '<svg class="yt-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15.1V8.9L15.5 12z"/></svg>';
const borrador = () => (S.borradores[diaSel] = S.borradores[diaSel] || {});

function renderSesion() {
  const w = semanaActual(), f = fase(w), prox = proxima();
  if (!diaSel) diaSel = prox;
  const D = DIAS[diaSel], borr = S.borradores[diaSel] || {};
  const nEj = D.bloques.reduce((a, b) => a + b.ej.length, 0);
  let h = '';
  h += `<div class="chips" role="group" aria-label="Elegir sesión">${SECUENCIA.map((k) => `
    <button class="chip" type="button" style="--c:${DIAS[k].color}" data-dia="${k}" aria-pressed="${k === diaSel}"><span class="dot" aria-hidden="true"></span>${DIAS[k].nombre}<small>${k === prox ? 'próxima' : ''}</small></button>`).join('')}</div>`;
  h += `<div class="dayhead" style="--c:${D.color}"><p class="eyebrow">${esc(D.nombre)}: ${nEj} ejercicios en ${esc(D.dur)}</p><h2>${esc(D.sub).replace(/(\w)-(\w)/g, '$1\u2011$2')}</h2></div>`;
  h += `<div class="phase">${SH.icon('trend')}<div><b>${esc(f.nombre)}.</b> ${esc(f.texto)}</div></div>`;
  h += `<label class="card row-card">Mantener la pantalla encendida<input class="toggle" type="checkbox" id="wake" ${wakeLock ? 'checked' : ''}></label>`;
  h += `<details class="warm"><summary>Calentamiento de 8 a 10 minutos</summary><ul>${D.calent.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></details>`;
  D.bloques.forEach((b) => {
    h += `<div class="section-h"><h3>${esc(b.t)}</h3>${b.nota ? `<span>${esc(b.nota)}</span>` : ''}</div>`;
    b.ej.forEach((id) => { h += tarjeta(id, w, borr[id] || [], D.color); });
  });
  h += `<div class="card notes"><label class="eyebrow" for="nota">Notas de la sesión</label>
    <textarea class="field" id="nota" placeholder="Sensaciones, molestias, qué ajustar">${esc(borr._nota || '')}</textarea>
    <button class="btn btn-primary btn-lg btn-block" id="guardar" type="button">${SH.icon('check')}Guardar sesión</button>
    <p class="hint">Al guardar se marca "Entrenar" en Estoico para hoy.</p></div>`;
  $('#view-sesion').innerHTML = h;
}

function tarjeta(id, w, dv, color) {
  const e = EJ[id], r = rx(id, w), last = ultimaDe(id), sug = sugerencia(id, w);
  let h = `<article class="ex" style="--c:${color}" data-card="${id}">
    <div class="ex-h"><div class="ex-name">${esc(e.n)}</div><div class="rx">${esc(r.texto)}</div></div>`;
  if (e.u === 'ok') {
    h += `<div class="ok-row"><button class="check" type="button" data-ok="${id}" aria-pressed="${!!dv[0]}" aria-label="${esc(e.n)} hecho">${SH.CHECK_SVG}</button>Hecho</div>`;
  } else {
    if (last) h += `<p class="prev">Última vez (${fmt(last.fecha)}): <b>${last.v.filter((x) => !vacio(x)).map(num).join(', ')}</b></p>`;
    if (sug) h += `<div class="tip" style="--t:${TIP[sug.tipo]}">${esc(sug.txt).replace(/^(Subí|Mantené|Seguí):/, '<b>$1:</b>')}</div>`;
    const n = r.series, sig = Array.from({ length: n }, (_, i) => i).find((i) => vacio(dv[i]));
    h += `<div class="sets" style="grid-template-columns:repeat(${n <= 6 ? n : Math.ceil(n / 2)},1fr)">`;
    for (let i = 0; i < n; i++) {
      const v = dv[i], hecho = !vacio(v);
      const lab = n > 1 ? 'S' + (i + 1) : UNIDAD[e.u] || e.u;
      h += `<button class="set${hecho ? ' done' : ''}${i === sig ? ' next' : ''}" type="button" data-set="${id}" data-i="${i}" aria-label="${esc(e.n)}, serie ${i + 1}: ${hecho ? num(v) + ' ' + (UNIDAD[e.u] || e.u) : 'sin cargar'}">${hecho ? num(v) : '–'}<small>${lab}</small></button>`;
    }
    h += `</div>`;
  }
  h += `<div class="ex-foot"><a class="pill" href="${ytUrl(id)}" target="_blank" rel="noopener">${YT_ICON}Técnica</a>`;
  if (e.d) h += `<button class="pill" type="button" data-rest="${e.d}" data-lbl="${esc(e.n)}">${SH.icon('timer')}Descanso ${e.d >= 60 ? mmss(e.d) : e.d + ' s'}</button>`;
  h += `</div><p class="cue">${esc(e.c)}</p>`;
  return h + `</article>`;
}

// Redibuja solo la tarjeta de un ejercicio (no mueve el scroll)
function refrescarTarjeta(id) {
  const el = document.querySelector(`[data-card="${id}"]`);
  if (!el) return;
  el.outerHTML = tarjeta(id, semanaActual(), (S.borradores[diaSel] || {})[id] || [], DIAS[diaSel].color);
}

$('#view-sesion').addEventListener('click', (ev) => {
  const c = ev.target.closest('[data-dia]');
  if (c) { diaSel = c.dataset.dia; renderSesion(); scrollTo({ top: 0 }); return; }
  const st = ev.target.closest('[data-set]');
  if (st) { abrirHoja(st.dataset.set, Number(st.dataset.i), st); return; }
  const ok = ev.target.closest('[data-ok]');
  if (ok) {
    const id = ok.dataset.ok, b = borrador(), hecho = !b[id]?.[0];
    b[id] = [hecho ? 1 : ''];
    guardar(); refrescarTarjeta(id);
    const nb = document.querySelector(`[data-ok="${id}"]`);
    nb?.focus({ preventScroll: true });
    if (hecho) SH.pop(nb);
    return;
  }
  const r = ev.target.closest('[data-rest]');
  if (r) { timer(Number(r.dataset.rest), r.dataset.lbl); return; }
  if (ev.target.closest('#guardar')) guardarHoy();
});
$('#view-sesion').addEventListener('change', (ev) => { if (ev.target.id === 'wake') toggleWake(ev.target.checked); });
$('#view-sesion').addEventListener('input', (ev) => {
  if (ev.target.id === 'nota') { borrador()._nota = ev.target.value; guardar(); }
});

function guardarHoy() {
  const w = semanaActual(), D = DIAS[diaSel], borr = S.borradores[diaSel] || {};
  const valores = {}; let algo = false;
  D.bloques.forEach((b) => b.ej.forEach((id) => {
    const n = EJ[id].u === 'ok' ? 1 : rx(id, w).series, src = borr[id] || [];
    valores[id] = Array.from({ length: n }, (_, i) => {
      if (vacio(src[i])) return null;
      const v = Number(String(src[i]).replace(',', '.'));
      if (isNaN(v)) return null;
      algo = true;
      return v;
    });
  }));
  if (!algo) { err('Cargá al menos una serie antes de guardar'); return; }
  const fecha = hoyISO();
  const ok = guardarSesion({ id: fecha + '_' + diaSel, fecha, ts: Date.now(), dia: diaSel, semana: w, valores, nota: $('#nota').value.trim() });
  if (!ok) { err('No se pudo guardar. Liberá espacio en el teléfono y probá de nuevo.'); return; }
  const est = marcarEnEstoico(fecha);
  const msg = { marcado: 'Sesión guardada. "Entrenar" quedó marcado en Estoico', 'ya-marcado': 'Sesión guardada. Estoico ya tenía hoy marcado' }[est] || 'Sesión guardada';
  toast(msg, 3200);
  diaSel = null; renderAll(); scrollTo({ top: 0 });
}

// ---------- Hoja para cargar una serie ----------
const H = { id: null, i: 0, origen: null };
function abrirHoja(id, i, origen) {
  const e = EJ[id], r = rx(id, semanaActual()), dv = borrador()[id] || [], last = ultimaDe(id);
  Object.assign(H, { id, i, origen });
  // Valor inicial: lo ya cargado, lo de la última vez, la serie anterior o el mínimo del rango
  const ini = [dv[i], last?.v[i], dv[i - 1], r.lo < 99 ? r.lo : 0].find((v) => !vacio(v));
  $('#sh-ex').textContent = e.n;
  $('#sh-title').textContent = r.series > 1 ? `Serie ${i + 1} de ${r.series}` : 'Resultado';
  $('#sh-prev').textContent = last && !vacio(last.v[i]) ? `Última vez: ${num(last.v[i])} ${UNIDAD[e.u] || e.u}` : `Objetivo: ${r.texto}`;
  $('#sh-val').value = num(ini ?? 0);
  $('#sh-unit').textContent = UNIDAD[e.u] || e.u;
  $('#sh-save-rest').hidden = !e.d;
  $('#sh-save').classList.toggle('btn-primary', !e.d);
  $('#sh-clear').hidden = vacio(dv[i]);
  $('#scrim').classList.add('show');
  $('#sheet').inert = false;
  $('#sheet').classList.add('show');
  // El resto de la página queda inerte mientras la hoja está abierta
  H.soltar = SH.dialog($('#sheet'), $('#sh-title'));
}
function cerrarHoja() {
  $('#scrim').classList.remove('show');
  $('#sheet').classList.remove('show');
  $('#sheet').inert = true;
  H.soltar?.(false); H.soltar = null;
  const id = H.id, i = H.i;
  H.id = null;
  document.querySelector(`[data-set="${id}"][data-i="${i}"]`)?.focus({ preventScroll: true });
}
function pasoDe(id) { return EJ[id].u === 's' ? 5 : 1; }
function leerValor() {
  const v = Number(String($('#sh-val').value).replace(',', '.'));
  return isNaN(v) || v < 0 ? null : v;
}
function guardarSerie(conDescanso) {
  const v = leerValor();
  if (v === null) { err('Ingresá un número válido'); return; }
  const { id, i } = H, b = borrador();
  // Récord: supera la mejor marca guardada y todo lo cargado hoy en ese ejercicio
  const hoy = (b[id] || []).filter((x) => !vacio(x)).map((x) => Number(String(x).replace(',', '.')));
  const mejor = mejorDe(id), record = mejor > 0 && v > Math.max(mejor, ...hoy);
  (b[id] = b[id] || [])[i] = String(v);
  guardar(); refrescarTarjeta(id); cerrarHoja();
  const btn = document.querySelector(`[data-set="${id}"][data-i="${i}"]`);
  SH.pop(btn);
  if (record) {
    SH.confetti(btn);
    toast(`Récord nuevo en ${EJ[id].n}: ${num(v)} ${UNIDAD[EJ[id].u] || EJ[id].u}`, 3600, 'trend');
  }
  if (conDescanso && EJ[id].d) timer(EJ[id].d, `${EJ[id].n}, serie ${i + 1}`);
}
function paso(dir) {
  const v = leerValor() ?? 0;
  $('#sh-val').value = num(Math.max(0, v + dir * pasoDe(H.id)));
  SH.pop($('#sh-val'), 'bump');
}
$('#sh-minus').onclick = () => paso(-1);
$('#sh-plus').onclick = () => paso(1);
$('#sh-save').onclick = () => guardarSerie(false);
$('#sh-save-rest').onclick = () => guardarSerie(true);
$('#sh-clear').onclick = () => {
  const { id, i } = H, b = borrador();
  if (b[id]) b[id][i] = '';
  guardar(); refrescarTarjeta(id); cerrarHoja();
};
$('#sh-val').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') guardarSerie(true); });
$('#scrim').onclick = cerrarHoja;
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && H.id) cerrarHoja(); });

// ---------- Temporizador de descanso ----------
const RING = 169.65;
const T = { end: 0, total: 1, iv: null, ac: null, sonado: false };
function beep() {
  try {
    const ac = T.ac; if (!ac) return;
    [0, 0.3, 0.6].forEach((o) => { const os = ac.createOscillator(), g = ac.createGain(); os.frequency.value = 880; g.gain.value = 0.2; os.connect(g); g.connect(ac.destination); os.start(ac.currentTime + o); os.stop(ac.currentTime + o + 0.18); });
  } catch (e) { /* sin sonido */ }
  try { navigator.vibrate?.([200, 100, 200]); } catch (e) { /* iPhone no vibra desde la web */ }
}
function timer(sec, lbl) {
  try { if (!T.ac) T.ac = new (window.AudioContext || window.webkitAudioContext)(); T.ac.resume?.(); } catch (e) { /* */ }
  T.total = sec; T.end = Date.now() + sec * 1000; T.sonado = false;
  $('#t-title').textContent = 'Descanso';
  $('#t-lbl').textContent = lbl || '';
  $('#timer').classList.remove('done');
  $('#timer').classList.add('show');
  document.body.classList.add('timer-on');
  clearInterval(T.iv); tick(); T.iv = setInterval(tick, 250);
}
function tick() {
  const ms = Math.max(0, T.end - Date.now()), r = Math.ceil(ms / 1000);
  $('#t-time').textContent = mmss(r);
  $('#t-ring').setAttribute('stroke-dashoffset', (RING * (1 - ms / (T.total * 1000))).toFixed(2));
  if (r === 0 && !T.sonado) {
    T.sonado = true; clearInterval(T.iv);
    $('#timer').classList.add('done');
    $('#t-title').textContent = 'A la próxima serie';
    beep();
  }
}
$('#t-plus').onclick = () => {
  T.end = Math.max(T.end, Date.now()) + 15000;
  T.total = Math.max(T.total, Math.ceil((T.end - Date.now()) / 1000));
  T.sonado = false;
  $('#timer').classList.remove('done');
  $('#t-title').textContent = 'Descanso';
  clearInterval(T.iv); T.iv = setInterval(tick, 250); tick();
};
$('#t-stop').onclick = () => {
  clearInterval(T.iv);
  $('#timer').classList.remove('show');
  document.body.classList.remove('timer-on');
};
document.addEventListener('visibilitychange', () => { if (!document.hidden && $('#timer').classList.contains('show')) tick(); });

// ---------- Pantalla encendida ----------
let wakeLock = null;
async function toggleWake(on) {
  try {
    if (on) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); }
    else { await wakeLock?.release(); wakeLock = null; }
  } catch (e) { err('Este teléfono no permite mantener la pantalla encendida desde la app'); const c = $('#wake'); if (c) c.checked = false; }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && $('#wake')?.checked && !wakeLock) toggleWake(true); });

// ---------- Vista: plan ----------
const FASES = [
  [1, 2, 'Adaptación', 'Dominadas con chaleco 5 × 2. Técnica limpia, 2 reps en reserva.'],
  [3, 5, 'Carga', 'Chaleco 5 × 3. El EMOM sube 1 min por semana hasta 12.'],
  [6, 6, 'Descarga + test', 'Mitad de las series y test de dominadas.'],
  [7, 11, 'Intensificación', 'Chaleco 6 × 3 y luego 5 × 4. EMOM de 4 reps. Press con pies en el suelo. L-sit en soportes.'],
  [12, 12, 'Descarga + test final', 'Mitad de las series. Objetivo: 10 dominadas.']
];
function renderPlan() {
  const w = semanaActual();
  $('#view-plan').innerHTML = `
  <div class="section-h" style="margin-top:0"><h2>Las 12 semanas</h2><span class="eyebrow">Hoy: semana ${w}</span></div>
  <div class="card">${FASES.map(([a, b, n, d]) => {
    const now = w >= a && w <= b;
    return `<div class="ph${now ? ' now' : ''}"><span class="eyebrow">Sem. ${a === b ? a : a + '–' + b}</span><div><b>${n}</b>${now ? '<span class="tag">ahora</span>' : ''}<p>${d}</p></div></div>`;
  }).join('')}</div>
  <div class="section-h"><h2>Cómo se ordenan</h2></div>
  <div class="card prose">
    <div class="seq">${SECUENCIA.map((k, i) => `<div style="--c:${DIAS[k].color}">${DIAS[k].nombre}<small>${i + 1}</small></div>`).join('')}</div>
    <p class="dim">Entrenás 4 veces por semana el día que puedas. La app siempre te propone la sesión que sigue a la última que guardaste. Dejá al menos un día libre entre Pull A y Upper B si podés.</p></div>
  <div class="section-h"><h2>Cardio</h2></div>
  <div class="card prose"><ul>
    <li><b>Finisher</b> al cierre de Piernas: 10 rondas de 30 s fuerte y 30 s suave.</li>
    <li><b>Zona 2 opcional</b> en un día libre: 30–40 min de trote suave, bici o caminata rápida en subida. Tenés que poder hablar en frases completas.</li>
    <li>Nada intenso el día antes de Pull A o Upper B.</li></ul></div>
  <div class="section-h"><h2>Cómo progresar</h2></div>
  <div class="card prose"><ul>
    <li><b>Doble progresión.</b> Cada ejercicio tiene un rango. Cuando todas las series llegan al tope, la app te marca <b>Subí</b> y te dice qué cambiar.</li>
    <li><b>Reps en reserva.</b> Terminá cada serie con 1–2 reps en el tanque. El fallo queda para los tests.</li>
    <li><b>Pliometría.</b> No se progresa sumando reps: se mantiene la cantidad y se busca más altura o distancia.</li>
    <li><b>La movilidad de piernas es parte del press.</b> El pancake y el pike te van a permitir pasar del press en straddle al press en pike.</li>
    <li><b>Dolor no es esfuerzo.</b> Si una articulación duele, cortá ese ejercicio en la sesión.</li></ul></div>
  <div class="section-h"><h2>Extra opcional</h2><span>grease the groove</span></div>
  <div class="card prose"><p class="dim">Desde la semana 3, en días libres: 4–5 series de 2–3 dominadas estrictas repartidas en el día, siempre lejos del fallo. No el día antes de Pull A.</p></div>`;
}

// ---------- Vista: progreso ----------
let exGraf = 'domlast', delPend = null;

// Gráfico de línea con el récord marcado y etiquetas directas
function grafico(pts, { max, meta, unidad = '', etiqueta = 'Evolución', vacioTxt = 'Sin registros todavía' } = {}) {
  const W = 320, H = 170, L = 28, R = 12, T0 = 22, B = 22;
  const top = max || Math.max(4, ...pts.map((p) => p.v), meta || 0) * 1.15;
  const x = (i) => (pts.length < 2 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (pts.length - 1));
  const y = (v) => T0 + (H - T0 - B) * (1 - v / top);
  const ticks = [0, top / 2, top].map((v) => Math.round(v));
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(etiqueta)}">`;
  ticks.forEach((v) => { s += `<line class="g-grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="g-axis" x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`; });
  if (meta) s += `<line class="g-meta" x1="${L}" x2="${W - R}" y1="${y(meta)}" y2="${y(meta)}"/><text class="g-meta-t" x="${L + 4}" y="${y(meta) - 6}" text-anchor="start">Meta ${meta}</text>`;
  if (!pts.length) return s + `<text class="g-empty" x="${(L + W - R) / 2}" y="${H / 2}" text-anchor="middle">${esc(vacioTxt)}</text></svg>`;
  const best = Math.max(...pts.map((p) => p.v)), iPR = pts.findIndex((p) => p.v === best);
  if (pts.length > 1) {
    s += `<path class="g-area" d="M${x(0)},${y(0)} ${pts.map((p, i) => `L${x(i)},${y(p.v)}`).join(' ')} L${x(pts.length - 1)},${y(0)} Z"/>`;
    s += `<polyline class="g-line" points="${pts.map((p, i) => x(i) + ',' + y(p.v)).join(' ')}"/>`;
  }
  const muchos = pts.length > 8;
  pts.forEach((p, i) => {
    const cx = x(i), cy = y(p.v), pr = i === iPR && pts.length > 1, last = i === pts.length - 1;
    const anchor = pts.length > 1 && i === 0 ? 'start' : pts.length > 1 && last ? 'end' : 'middle';
    const lx = anchor === 'start' ? cx - 4 : anchor === 'end' ? cx + 4 : cx;
    if (pr) {
      s += `<path class="g-pr" d="M${cx} ${cy - 7} L${cx + 7} ${cy} L${cx} ${cy + 7} L${cx - 7} ${cy}Z"/>`;
      s += `<text class="g-lbl-pr" x="${lx}" y="${cy - 12}" text-anchor="${anchor}">Récord: ${num(p.v)}${unidad}</text>`;
    } else {
      s += `<circle class="g-pt" cx="${cx}" cy="${cy}" r="${muchos ? 3 : 4.5}"/>`;
      if (!muchos || last) s += `<text class="g-lbl" x="${lx}" y="${cy - 10}" text-anchor="${anchor}">${num(p.v)}${unidad}</text>`;
    }
    if (i === 0 || last || pts.length <= 6) s += `<text class="g-axis" x="${lx}" y="${H - 4}" text-anchor="${anchor}">${fmt(p.fecha)}</text>`;
  });
  return s + '</svg>';
}

function resumenTests(tests) {
  if (!tests.length) return 'Testeá en las semanas 6 y 12, al inicio de Pull A.';
  const best = Math.max(...tests.map((t) => t.reps)), meta = best >= 10 ? 'Llegaste a la meta.' : `Te faltan ${10 - best} para la meta.`;
  if (tests.length === 1) return `Primer test: ${tests[0].reps}. ${meta}`;
  const d = tests[tests.length - 1].reps - tests[0].reps;
  const cambio = d === 0 ? 'Mismo resultado que en el primer test.'
    : `${d > 0 ? '+' : ''}${d} ${Math.abs(d) === 1 ? 'dominada' : 'dominadas'} desde el primer test.`;
  return `${cambio} ${meta}`;
}

function renderProgreso() {
  const nivel = S.nivel || 1;
  const tests = S.pruebas.slice().sort((a, b) => a.fecha.localeCompare(b.fecha));
  const ult = tests[tests.length - 1];
  const dTests = tests.length > 1 ? ult.reps - tests[0].reps : null;
  const serie = serieDe(exGraf), uEj = EJ[exGraf].u === 's' ? ' s' : '';
  const opciones = Object.keys(EJ).filter((k) => EJ[k].u !== 'ok').map((k) => `<option value="${k}" ${k === exGraf ? 'selected' : ''}>${esc(EJ[k].n)}</option>`).join('');
  const hist = ordenadas().slice(0, 40);
  const hs = mejorDe('hs'), ls = mejorDe('lsit');
  $('#view-progreso').innerHTML = `
  <div class="tiles">
    <div class="tile"><p class="eyebrow">Dominadas</p><b>${ult ? ult.reps : '–'}<small> / 10</small></b><small class="${dTests > 0 ? 'up' : ''}">${dTests === null ? (ult ? 'primer test' : 'sin tests') : (dTests > 0 ? '+' : '') + dTests + ' en el ciclo'}</small></div>
    <div class="tile"><p class="eyebrow">Handstand</p><b>${hs ? num(hs) + '<small> s</small>' : '–'}</b><small>mejor marca</small></div>
    <div class="tile"><p class="eyebrow">L-sit</p><b>${ls ? num(ls) + '<small> s</small>' : '–'}</b><small>mejor marca</small></div>
  </div>
  <div class="section-h"><h2>Test de dominadas</h2><span class="eyebrow">Meta 10</span></div>
  <div class="card"><div class="chart">${grafico(tests.map((t) => ({ fecha: t.fecha, v: t.reps })), { max: 12, meta: 10, vacioTxt: 'Cargá tu primer test abajo', etiqueta: 'Máximo de dominadas estrictas por test. ' + resumenTests(tests) })}</div>
    <p class="chart-sum">${resumenTests(tests)}</p>
    <div class="form"><label>Fecha<input class="field" type="date" id="p-fecha" value="${hoyISO()}"></label><label>Reps<input class="field" inputmode="numeric" id="p-reps" style="width:76px"></label><button class="btn" id="p-add" type="button">${SH.icon('plus')}Agregar test</button></div></div>
  <div class="section-h"><h2>Por ejercicio</h2><span>mejor serie de cada sesión</span></div>
  <div class="card">
    <label class="sr-only" for="ex-sel">Ejercicio</label><select id="ex-sel" class="field">${opciones}</select>
    <div class="chart" style="margin-top:var(--s3)">${grafico(serie, { unidad: uEj.trim(), vacioTxt: 'Todavía no lo cargaste en una sesión', etiqueta: 'Mejor serie por sesión: ' + EJ[exGraf].n })}</div>
    ${serie.length ? `<p class="chart-sum">Mejor: <b>${num(Math.max(...serie.map((p) => p.v)))}${uEj}</b>. Última: ${num(serie[serie.length - 1].v)}${uEj}. En ${serie.length} ${serie.length === 1 ? 'sesión' : 'sesiones'}</p>` : ''}</div>
  <div class="section-h"><h2>Escalera al handstand</h2><span class="eyebrow">Paso ${nivel} de ${ESCALERA.length}</span></div>
  <div class="card">
    <div class="ladder-bar" aria-hidden="true">${ESCALERA.map((_, i) => `<i class="${i < nivel ? 'on' : ''}"></i>`).join('')}</div>
    <p class="hint" style="margin-bottom:var(--s3)">Tocá el escalón en el que estás.</p>
    <ol class="ladder">${ESCALERA.map((l, i) => { const n = i + 1, cls = n < nivel ? 'done' : n === nivel ? 'cur' : ''; return `<li><button class="${cls}" type="button" data-nivel="${n}" aria-current="${n === nivel ? 'step' : 'false'}"><span class="n">${n < nivel ? SH.icon('check') : n}</span><span><span class="t">${esc(l.t)}</span><span class="cr">${esc(l.cr)}</span></span></button></li>`; }).join('')}</ol></div>
  <div class="section-h"><h2>Historial</h2><span class="eyebrow">${S.sesiones.length} ${S.sesiones.length === 1 ? 'sesión' : 'sesiones'}</span></div>
  ${hist.length ? `<ul class="hist">${hist.map((s) => { const D = DIAS[s.dia] || { nombre: s.dia, color: 'var(--faint)' }; return `<li style="--c:${D.color}"><span><b>${fmt(s.fecha)}</b> ${esc(D.nombre)}, semana ${s.semana}${s.nota ? `<span class="note">${esc(s.nota)}</span>` : ''}</span><button class="btn btn-ghost ${delPend === s.id ? 'btn-danger' : ''}" data-del="${esc(s.id)}" type="button">${delPend === s.id ? '¿Borrar?' : 'Borrar'}</button></li>`; }).join('')}</ul>` : '<p class="card empty">Cuando guardes tu primera sesión aparece acá.</p>'}`;
}
$('#view-progreso').addEventListener('change', (ev) => { if (ev.target.id === 'ex-sel') { exGraf = ev.target.value; renderProgreso(); $('#ex-sel').focus(); } });
$('#view-progreso').addEventListener('click', (ev) => {
  const nv = ev.target.closest('[data-nivel]');
  if (nv) { S.nivel = Number(nv.dataset.nivel); guardar(); renderProgreso(); return; }
  const dl = ev.target.closest('[data-del]');
  if (dl) {
    const id = dl.dataset.del;
    if (delPend === id) { delPend = null; borrarSesion(id); toast('Sesión borrada'); renderAll(); }
    else { delPend = id; renderProgreso(); }
    return;
  }
  if (ev.target.closest('#p-add')) {
    const f = $('#p-fecha').value, r = Number(($('#p-reps').value || '').trim());
    if (!f || !r) { err('Completá la fecha y las reps'); return; }
    const otros = S.pruebas.filter((p) => p.fecha !== f), mejor = Math.max(0, ...otros.map((p) => p.reps));
    S.pruebas = otros.concat([{ fecha: f, reps: r }]);
    guardar(); renderProgreso();
    if (mejor > 0 && r > mejor) {
      SH.confetti($('#view-progreso .chart'));
      toast(r >= 10 ? `¡${r} dominadas! Llegaste a la meta` : `Récord nuevo en el test: ${r} dominadas`, 3600, 'trend');
    } else toast('Test guardado');
  }
});

// ---------- Vista: ajustes ----------
function renderAjustes() {
  const estoico = cicloEstoico();
  const distinto = estoico?.cycleStart && estoico.cycleStart !== S.inicio;
  $('#view-ajustes').innerHTML = `
  <div class="section-h" style="margin-top:0"><h2>Ciclo</h2></div>
  <div class="card">
    <div class="form" style="margin-top:0"><label style="flex:1">Inicio del programa<input class="field" type="date" id="inicio" value="${esc(S.inicio)}" style="width:100%"></label><button class="btn" id="set-inicio" type="button">Guardar</button></div>
    <p class="hint" style="margin-top:var(--s2)">La semana del programa se calcula desde esta fecha.</p>${distinto ? `
    <p class="notice" style="margin-top:var(--s3)">Tu ciclo de Estoico empezó el ${fmt(estoico.cycleStart)}, así que las dos apps muestran semanas distintas.</p>
    <button class="btn btn-block" id="usar-estoico" type="button" style="margin-top:var(--s2)">Usar el inicio de Estoico</button>` : ''}</div>
  <div class="section-h"><h2>Copia de respaldo</h2></div>
  <div class="card stack">
    <p class="dim" style="font-size:14px">Tus datos viven solo en este teléfono. Exportá una copia cada tanto y guardala en Archivos o mandátela por mail.</p>
    <div class="btn-row"><button class="btn btn-primary" id="exp" type="button">Exportar copia</button><button class="btn" id="imp-btn" type="button">Importar copia</button></div>
    <input type="file" id="imp-file" accept=".json,application/json,text/plain" hidden>
    <textarea class="field" id="exp-txt" readonly hidden></textarea></div>
  <div class="section-h"><h2>Estoico</h2></div>
  <div class="card"><p class="dim" style="font-size:14px">${estoico && estoico.cycleStart ? `Conectado. Ciclo de Estoico iniciado el ${fmt(estoico.cycleStart)}. Cada sesión guardada marca "Entrenar" ese día.` : 'Todavía no hay un ciclo de Estoico en este teléfono. Empezá uno en Estoico y cada sesión que guardes va a marcar "Entrenar".'}</p></div>
  <p class="version">Entreno v1.4, ${S.sesiones.length} ${S.sesiones.length === 1 ? 'sesión guardada' : 'sesiones guardadas'}</p>`;
}
$('#view-ajustes').addEventListener('click', async (ev) => {
  const id = ev.target.closest('button')?.id;
  if (id === 'set-inicio') { const v = $('#inicio').value; if (v) { S.inicio = v; guardar(); toast('Inicio actualizado'); renderAll(); } }
  if (id === 'usar-estoico') { const c = cicloEstoico()?.cycleStart; if (c) { S.inicio = c; guardar(); toast('Inicio igualado al de Estoico'); renderAll(); } }
  if (id === 'exp') {
    const txt = exportar();
    try {
      if (await SH.exportFile(txt, `entreno-${hoyISO()}.json`, 'Copia de Entreno') === 'descargado') toast('Copia descargada');
    } catch (e) {
      const t = $('#exp-txt'); t.value = txt; t.hidden = false; t.select(); toast('Copiá el texto y guardalo');
    }
  }
  if (id === 'imp-btn') $('#imp-file').click();
});
$('#view-ajustes').addEventListener('change', async (ev) => {
  if (ev.target.id !== 'imp-file' || !ev.target.files[0]) return;
  try {
    const d = leerCopia(await ev.target.files[0].text());
    const ok = confirm(`La copia tiene ${d.sesiones.length} sesiones. Va a reemplazar ${S.sesiones.length === 1 ? 'la sesión' : 'las ' + S.sesiones.length + ' sesiones'} que tenés ahora en este teléfono. ¿Seguir?`);
    if (ok) { const n = aplicarCopia(d); toast(`Copia importada: ${n} sesiones`); renderAll(); }
  } catch (e) { err(e.message || 'No se pudo leer el archivo'); }
  ev.target.value = '';
});

// ---------- Navegación ----------
const selectTab = SH.tabs(setView);
function setView(v) {
  document.querySelectorAll('.view').forEach((el) => (el.hidden = el.id !== 'view-' + v));
  selectTab(v);
  scrollTo({ top: 0 });
}

function renderAll() { renderHeader(); renderSesion(); renderPlan(); renderProgreso(); renderAjustes(); }
renderAll();
