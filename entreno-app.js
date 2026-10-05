// =====================================================================
// ENTRENO — interfaz
// =====================================================================
import { SEMANAS, SECUENCIA, DIAS, EJ, ESCALERA, fase, rx, ytUrl, esDescarga } from './entreno-programa.js';
import { S, guardar, guardarSesion, borrarSesion, ordenadas, ultimaDe, mejorDe, serieDe, exportar, importar, marcarEnEstoico } from './entreno-store.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const hoyISO = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const fmt = (iso) => { const [, m, d] = iso.split('-'); return `${d}/${m}`; };
const mmss = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');

function semanaActual() {
  const ini = new Date(S.inicio + 'T00:00:00'), now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.min(SEMANAS, Math.max(1, Math.floor((now - ini) / (7 * 864e5)) + 1));
}
function proxima() {
  const u = ordenadas()[0];
  if (!u) return SECUENCIA[0];
  return SECUENCIA[(SECUENCIA.indexOf(u.dia) + 1) % SECUENCIA.length];
}
function toast(t, ms = 2400) {
  const el = $('#toast'); el.textContent = t; el.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => (el.hidden = true), ms);
}

// ---------- Encabezado ----------
function renderHeader() {
  const w = semanaActual(), f = fase(w);
  $('#h-semana').textContent = `Semana ${w} de ${SEMANAS}`;
  $('#h-fase').textContent = f.nombre;
  $('#h-bar').style.width = (w / SEMANAS) * 100 + '%';
}

// ---------- Sugerencia de progresión ----------
function sugerencia(id, w) {
  const e = EJ[id], r = rx(id, w);
  if (e.sinSugerencia || e.u === 'ok' || r.test || esDescarga(w)) return null;
  const last = ultimaDe(id); if (!last) return null;
  const v = last.v.filter((x) => x !== null && x !== '').map(Number);
  if (e.u === 'total') return v[0] >= r.lo ? { tipo: 'ok', txt: 'Completaste el EMOM la última vez. El plan suma un minuto por semana.' } : null;
  if (v.length < r.series) return { tipo: 'seguir', txt: `La última vez hiciste ${v.length} de ${r.series} series. Completalas todas antes de subir.` };
  if (v.every((x) => x >= r.hi)) return { tipo: 'sube', txt: e.sube ? 'Subí: ' + e.sube : 'Subí la dificultad.' };
  if (v.some((x) => x < r.lo)) return { tipo: 'mantener', txt: `Mantené: buscá llegar a ${r.lo} en todas las series.` };
  return { tipo: 'seguir', txt: `Seguí: sumá reps hasta ${r.hi} en todas las series.` };
}
const TIP = { sube: ['var(--ok)', 'Subí'], mantener: ['var(--warn)', 'Mantené'], seguir: ['var(--accent)', 'Seguí'], ok: ['var(--ok)', 'Bien'] };

// ---------- Vista: sesión ----------
let diaSel = null;
const YT_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15.1V8.9L15.5 12z"/></svg>';

function renderSesion() {
  const w = semanaActual(), f = fase(w), prox = proxima();
  if (!diaSel) diaSel = prox;
  const D = DIAS[diaSel], borr = S.borradores[diaSel] || {};
  let h = '';
  h += `<div class="chips" role="group" aria-label="Elegir sesión">${SECUENCIA.map((k) => `
    <button class="chip" style="--c:${DIAS[k].color}" data-dia="${k}" aria-pressed="${k === diaSel}"><i></i>${DIAS[k].nombre}<small>${k === prox ? 'próxima' : '&nbsp;'}</small></button>`).join('')}</div>`;
  h += `<div class="phase"><b>${esc(f.nombre)}.</b> ${esc(f.texto)}</div>`;
  h += `<div style="--c:${D.color};display:grid;gap:14px">`;
  h += `<div class="dayhead"><h2>${esc(D.nombre)}</h2><p class="dim">${esc(D.sub)}</p><span class="meta">${D.dur}</span></div>`;
  h += `<label class="switch card" style="padding:10px 14px">Mantener la pantalla encendida <input type="checkbox" id="wake" ${wakeLock ? 'checked' : ''}></label>`;
  h += `<details class="warm"><summary>Calentamiento · 8–10 min</summary><ul>${D.calent.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></details>`;
  D.bloques.forEach((b) => {
    h += `<div class="block"><div class="block-t"><h3>${esc(b.t)}</h3>${b.nota ? `<span>${esc(b.nota)}</span>` : ''}</div>`;
    b.ej.forEach((id) => { h += tarjeta(id, w, borr[id] || []); });
    h += `</div>`;
  });
  h += `<div class="card" style="display:grid;gap:10px"><label class="label" for="nota">Notas de la sesión</label>
    <textarea id="nota" placeholder="Sensaciones, molestias, qué ajustar">${esc(borr._nota || '')}</textarea>
    <button class="btn primary" id="guardar" type="button">Guardar sesión</button>
    <p class="faint" style="font-size:12px">Al guardar se marca "Entrenar" en Estoico para hoy.</p></div>`;
  h += `</div>`;
  $('#view-sesion').innerHTML = h;
}

function tarjeta(id, w, dv) {
  const e = EJ[id], r = rx(id, w), last = ultimaDe(id), sug = sugerencia(id, w);
  let h = `<article class="ex"><div class="ex-head"><div><div class="ex-name">${esc(e.n)}</div><div class="rx">${esc(r.texto)}</div></div>
    <a class="yt" href="${ytUrl(id)}" target="_blank" rel="noopener">${YT_ICON}Ver</a></div>
    <p class="cue">${esc(e.c)}</p>`;
  if (sug) { const [c, l] = TIP[sug.tipo]; h += `<div class="tip" style="--t:${c}">${esc(sug.txt).replace(/^(Subí|Mantené|Seguí):/, `<b>$1:</b>`)}</div>`; }
  if (e.u === 'ok') {
    h += `<label class="check"><input type="checkbox" data-ex="${id}" data-i="0" ${dv[0] ? 'checked' : ''}> Hecho</label>`;
  } else {
    if (last) h += `<div class="prev">Última vez (${fmt(last.fecha)}): <b>${last.v.filter((x) => x !== null && x !== '').join(' · ')}</b></div>`;
    const n = r.series, wide = e.u === 'total' || e.u === 'rondas';
    h += `<div class="sets${wide ? ' wide' : ''}">`;
    for (let i = 0; i < n; i++) {
      const ph = last && last.v[i] != null ? last.v[i] : '';
      const lab = n > 1 ? 'S' + (i + 1) : e.u === 'total' ? 'reps total' : e.u;
      h += `<label>${lab}<input inputmode="decimal" data-ex="${id}" data-i="${i}" placeholder="${esc(ph)}" value="${esc(dv[i] ?? '')}" aria-label="${esc(e.n)} serie ${i + 1}"></label>`;
    }
    h += `</div><div class="row">${n > 1 ? `<span class="unit">${e.u === 's' ? 'segundos' : e.u}</span>` : ''}${e.d ? `<button class="btn" type="button" data-rest="${e.d}" data-lbl="${esc(e.n)}">Descanso ${e.d >= 60 ? mmss(e.d) : e.d + ' s'}</button>` : ''}</div>`;
  }
  return h + `</article>`;
}

$('#view-sesion').addEventListener('click', (ev) => {
  const c = ev.target.closest('[data-dia]');
  if (c) { diaSel = c.dataset.dia; renderSesion(); scrollTo({ top: 0 }); return; }
  const r = ev.target.closest('[data-rest]');
  if (r) { timer(Number(r.dataset.rest), r.dataset.lbl); return; }
  if (ev.target.id === 'guardar') guardarHoy();
});
$('#view-sesion').addEventListener('change', (ev) => { if (ev.target.id === 'wake') toggleWake(ev.target.checked); });
$('#view-sesion').addEventListener('input', (ev) => {
  const t = ev.target, b = (S.borradores[diaSel] = S.borradores[diaSel] || {});
  if (t.dataset.ex) {
    const a = (b[t.dataset.ex] = b[t.dataset.ex] || []);
    a[Number(t.dataset.i)] = t.type === 'checkbox' ? (t.checked ? 1 : '') : t.value.replace(',', '.');
  } else if (t.id === 'nota') b._nota = t.value;
  guardar();
});

function guardarHoy() {
  const valores = {}; let algo = false;
  document.querySelectorAll('#view-sesion [data-ex]').forEach((inp) => {
    let v = inp.type === 'checkbox' ? (inp.checked ? 1 : null) : inp.value.trim() === '' ? null : Number(inp.value.replace(',', '.'));
    if (v !== null && isNaN(v)) v = null;
    if (v !== null) algo = true;
    (valores[inp.dataset.ex] = valores[inp.dataset.ex] || [])[Number(inp.dataset.i)] = v;
  });
  if (!algo) { toast('Cargá al menos una serie antes de guardar'); return; }
  const fecha = hoyISO();
  const ok = guardarSesion({ id: fecha + '_' + diaSel, fecha, ts: Date.now(), dia: diaSel, semana: semanaActual(), valores, nota: $('#nota').value.trim() });
  if (!ok) { toast('No se pudo guardar. Liberá espacio en el teléfono y probá de nuevo.'); return; }
  const est = marcarEnEstoico(fecha);
  const msg = { marcado: 'Sesión guardada · "Entrenar" marcado en Estoico', 'ya-marcado': 'Sesión guardada · Estoico ya tenía hoy marcado' }[est] || 'Sesión guardada';
  toast(msg, 3200);
  diaSel = null; renderAll(); scrollTo({ top: 0 });
}

// ---------- Temporizador ----------
const T = { end: 0, iv: null, ac: null };
function beep() {
  try {
    const ac = T.ac; if (!ac) return;
    [0, 0.3, 0.6].forEach((o) => { const os = ac.createOscillator(), g = ac.createGain(); os.frequency.value = 880; g.gain.value = 0.2; os.connect(g); g.connect(ac.destination); os.start(ac.currentTime + o); os.stop(ac.currentTime + o + 0.18); });
  } catch (e) { /* sin sonido */ }
  try { navigator.vibrate?.([200, 100, 200]); } catch (e) { /* iPhone no vibra desde la web */ }
}
function timer(sec, lbl) {
  try { if (!T.ac) T.ac = new (window.AudioContext || window.webkitAudioContext)(); T.ac.resume?.(); } catch (e) { /* */ }
  T.end = Date.now() + sec * 1000; T.sonado = false;
  $('#t-lbl').textContent = lbl; $('#timer').hidden = false; $('#timer').classList.remove('done');
  clearInterval(T.iv); tick(); T.iv = setInterval(tick, 250);
}
function tick() {
  const r = Math.max(0, Math.ceil((T.end - Date.now()) / 1000));
  $('#t-time').textContent = mmss(r);
  if (r === 0 && !T.sonado) { T.sonado = true; $('#timer').classList.add('done'); $('#t-lbl').textContent = 'A la próxima serie'; beep(); }
}
$('#t-plus').onclick = () => { T.end = Math.max(T.end, Date.now()) + 15000; T.sonado = false; $('#timer').classList.remove('done'); clearInterval(T.iv); T.iv = setInterval(tick, 250); tick(); };
$('#t-stop').onclick = () => { clearInterval(T.iv); $('#timer').hidden = true; };
document.addEventListener('visibilitychange', () => { if (!document.hidden && !$('#timer').hidden) tick(); });

// ---------- Pantalla encendida ----------
let wakeLock = null;
async function toggleWake(on) {
  try {
    if (on) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); }
    else { await wakeLock?.release(); wakeLock = null; }
  } catch (e) { toast('Este teléfono no permite mantener la pantalla encendida desde la app'); const c = $('#wake'); if (c) c.checked = false; }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && $('#wake')?.checked && !wakeLock) toggleWake(true); });

// ---------- Vista: plan ----------
function renderPlan() {
  $('#view-plan').innerHTML = `
  <div class="card prose"><p class="label">Cómo se ordenan las sesiones</p>
    <div class="seq">${SECUENCIA.map((k, i) => `<div style="--c:${DIAS[k].color}">${DIAS[k].nombre}<small>${i + 1}</small></div>`).join('')}</div>
    <p class="dim">Entrenás 4 veces por semana el día que puedas. La app siempre te propone la sesión que sigue a la última que guardaste. Dejá al menos un día libre entre Pull A y Upper B si podés.</p></div>
  <div class="card prose"><p class="label">Cardio</p><ul>
    <li><b>Finisher</b> al cierre de Piernas: 10 rondas de 30 s fuerte y 30 s suave.</li>
    <li><b>Zona 2 opcional</b> en un día libre: 30–40 min de trote suave, bici o caminata rápida en subida. Tenés que poder hablar en frases completas.</li>
    <li>Nada intenso el día antes de Pull A o Upper B.</li></ul></div>
  <div class="card prose"><p class="label">Las 12 semanas</p><table><thead><tr><th>Sem.</th><th>Foco</th></tr></thead><tbody>
    <tr><td>1–2</td><td>Adaptación. Dominadas con chaleco 5 × 2.</td></tr>
    <tr><td>3–5</td><td>Carga. Chaleco 5 × 3. EMOM sube 1 min por semana hasta 12.</td></tr>
    <tr><td>6</td><td>Descarga (mitad de series) y test de dominadas.</td></tr>
    <tr><td>7–11</td><td>Chaleco 6 × 3 y luego 5 × 4. EMOM de 4 reps. Press con pies en el suelo. L-sit en soportes.</td></tr>
    <tr><td>12</td><td>Descarga y test final. Objetivo: 10 dominadas.</td></tr></tbody></table></div>
  <div class="card prose"><p class="label">Cómo progresar</p><ul>
    <li><b>Doble progresión.</b> Cada ejercicio tiene un rango. Cuando todas las series llegan al tope, la app te marca <b>Subí</b> y te dice qué cambiar.</li>
    <li><b>Reps en reserva.</b> Terminá cada serie con 1–2 reps en el tanque. El fallo queda para los tests.</li>
    <li><b>Pliometría.</b> No se progresa sumando reps: se mantiene la cantidad y se busca más altura o distancia.</li>
    <li><b>La movilidad de piernas es parte del press.</b> El pancake y el pike te van a permitir pasar del press en straddle al press en pike.</li>
    <li><b>Dolor no es esfuerzo.</b> Si una articulación duele, cortá ese ejercicio en la sesión.</li></ul></div>
  <div class="card prose"><p class="label">Extra opcional · grease the groove</p><p class="dim">Desde la semana 3, en días libres: 4–5 series de 2–3 dominadas estrictas repartidas en el día, siempre lejos del fallo. No el día antes de Pull A.</p></div>`;
}

// ---------- Vista: progreso ----------
let exGraf = 'domlast', delPend = null;
function grafico(pts, { max, meta, unidad } = {}) {
  const W = 320, H = 160, L = 26, R = 10, T0 = 16, B = 24;
  const top = max || Math.max(4, ...pts.map((p) => p.v), meta || 0) * 1.15;
  const x = (i) => (pts.length < 2 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (pts.length - 1));
  const y = (v) => T0 + (H - T0 - B) * (1 - v / top);
  const ticks = [0, top / 2, top].map((v) => Math.round(v));
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución">`;
  ticks.forEach((v) => { s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#2A2E38"/><text x="${L - 6}" y="${y(v) + 3}" font-size="9" text-anchor="end" fill="#747985" font-family="JetBrains Mono,monospace">${v}</text>`; });
  if (meta) s += `<line x1="${L}" x2="${W - R}" y1="${y(meta)}" y2="${y(meta)}" stroke="#93AE86" stroke-dasharray="4 4" stroke-width="1.5"/><text x="${W - R}" y="${y(meta) - 5}" font-size="10" text-anchor="end" fill="#93AE86">objetivo ${meta}</text>`;
  if (!pts.length) return s + `<text x="${W / 2}" y="${H / 2}" font-size="12" text-anchor="middle" fill="#747985">Sin registros todavía</text></svg>`;
  if (pts.length > 1) {
    s += `<path d="M${x(0)},${y(0)} ${pts.map((p, i) => `L${x(i)},${y(p.v)}`).join(' ')} L${x(pts.length - 1)},${y(0)} Z" fill="#E8C9A0" opacity=".08"/>`;
    s += `<polyline fill="none" stroke="#E8C9A0" stroke-width="2" points="${pts.map((p, i) => x(i) + ',' + y(p.v)).join(' ')}"/>`;
  }
  pts.forEach((p, i) => {
    const last = i === pts.length - 1;
    s += `<circle cx="${x(i)}" cy="${y(p.v)}" r="${last ? 4.5 : 3}" fill="#E8C9A0"/>`;
    if (last || pts.length <= 8) s += `<text x="${x(i)}" y="${y(p.v) - 8}" font-size="10" text-anchor="middle" fill="#EDEAE3">${p.v}${unidad || ''}</text>`;
    if (i === 0 || last || pts.length <= 6) s += `<text x="${x(i)}" y="${H - 6}" font-size="9" text-anchor="middle" fill="#747985" font-family="JetBrains Mono,monospace">${fmt(p.fecha)}</text>`;
  });
  return s + '</svg>';
}
function renderProgreso() {
  const nivel = S.nivel || 1;
  const tests = S.pruebas.slice().sort((a, b) => a.fecha.localeCompare(b.fecha));
  const ult = tests[tests.length - 1];
  const opciones = Object.keys(EJ).filter((k) => EJ[k].u !== 'ok').map((k) => `<option value="${k}" ${k === exGraf ? 'selected' : ''}>${esc(EJ[k].n)}</option>`).join('');
  const hist = ordenadas().slice(0, 40);
  $('#view-progreso').innerHTML = `
  <div class="stats">
    <div class="stat"><div class="v">${ult ? ult.reps : '–'}<small> / 10</small></div><div class="l">Dominadas</div></div>
    <div class="stat"><div class="v">${mejorDe('hs') || '–'}<small> s</small></div><div class="l">Mejor handstand</div></div>
    <div class="stat"><div class="v">${mejorDe('lsit') || '–'}<small> s</small></div><div class="l">Mejor L-sit</div></div>
  </div>
  <div class="card"><p class="label">Máximo de dominadas estrictas</p><div class="chart">${grafico(tests.map((t) => ({ fecha: t.fecha, v: t.reps })), { max: 12, meta: 10 })}</div>
    <div class="form" style="margin-top:10px"><label>Fecha<input type="date" id="p-fecha" value="${hoyISO()}"></label><label>Reps<input inputmode="numeric" id="p-reps" style="width:70px"></label><button class="btn" id="p-add" type="button">Agregar test</button></div>
    <p class="faint" style="font-size:12px;margin-top:8px">Testeá en las semanas 6 y 12, al inicio de Pull A.</p></div>
  <div class="card"><p class="label">Evolución por ejercicio</p>
    <div class="form"><label style="flex:1">Ejercicio<select id="ex-sel" class="field">${opciones}</select></label></div>
    <div class="chart" style="margin-top:8px">${grafico(serieDe(exGraf), { unidad: EJ[exGraf].u === 's' ? 's' : '' })}</div>
    <p class="faint" style="font-size:12px">Mejor serie de cada sesión.</p></div>
  <div class="block"><div class="block-t"><h3>Escalera L-sit → handstand</h3><span>Tocá en qué escalón estás</span></div>
    <ol class="ladder">${ESCALERA.map((l, i) => { const n = i + 1, cls = n < nivel ? 'done' : n === nivel ? 'cur' : ''; return `<li><button class="${cls}" data-nivel="${n}" aria-current="${n === nivel ? 'step' : 'false'}"><span class="n">${n < nivel ? '✓' : n}</span><span><span class="t">${esc(l.t)}</span><span class="cr">${esc(l.cr)}</span></span></button></li>`; }).join('')}</ol></div>
  <div class="block"><div class="block-t"><h3>Historial</h3><span>${S.sesiones.length} sesiones</span></div>
    ${hist.length ? `<ul class="hist">${hist.map((s) => { const D = DIAS[s.dia] || { nombre: s.dia, color: 'var(--faint)' }; return `<li style="--c:${D.color}"><span><b>${fmt(s.fecha)}</b> · ${esc(D.nombre)} · sem ${s.semana}${s.nota ? `<span class="note">${esc(s.nota)}</span>` : ''}</span><button class="btn ghost ${delPend === s.id ? 'danger' : ''}" data-del="${esc(s.id)}" type="button">${delPend === s.id ? '¿Borrar?' : 'Borrar'}</button></li>`; }).join('')}</ul>` : '<p class="faint">Cuando guardes tu primera sesión aparece acá.</p>'}</div>`;
}
$('#view-progreso').addEventListener('change', (ev) => { if (ev.target.id === 'ex-sel') { exGraf = ev.target.value; renderProgreso(); } });
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
  if (ev.target.id === 'p-add') {
    const f = $('#p-fecha').value, r = Number(($('#p-reps').value || '').trim());
    if (!f || !r) { toast('Completá la fecha y las reps'); return; }
    S.pruebas = S.pruebas.filter((p) => p.fecha !== f).concat([{ fecha: f, reps: r }]);
    guardar(); toast('Test guardado'); renderProgreso();
  }
});

// ---------- Vista: ajustes ----------
function renderAjustes() {
  const estoico = (() => { try { return JSON.parse(localStorage.getItem('trivium.v2') || 'null'); } catch (e) { return null; } })();
  $('#view-ajustes').innerHTML = `
  <div class="card" style="display:grid;gap:10px"><p class="label">Ciclo</p>
    <div class="form"><label>Inicio del programa<input type="date" id="inicio" value="${esc(S.inicio)}"></label><button class="btn" id="set-inicio" type="button">Guardar</button></div>
    <p class="faint" style="font-size:12px">La semana del programa se calcula desde esta fecha.</p></div>
  <div class="card" style="display:grid;gap:10px"><p class="label">Copia de respaldo</p>
    <p class="dim" style="font-size:13px">Tus datos viven solo en este teléfono. Exportá una copia cada tanto y guardala en Archivos o mandátela por mail.</p>
    <div class="row"><button class="btn primary" id="exp" type="button">Exportar copia</button><button class="btn" id="imp-btn" type="button">Importar copia</button></div>
    <input type="file" id="imp-file" accept=".json,application/json,text/plain" hidden>
    <textarea id="exp-txt" readonly hidden></textarea></div>
  <div class="card" style="display:grid;gap:6px"><p class="label">Estoico</p>
    <p class="dim" style="font-size:13px">${estoico && estoico.cycleStart ? `Conectado. Ciclo de Estoico iniciado el ${fmt(estoico.cycleStart)}. Cada sesión guardada marca "Entrenar" ese día.` : 'Todavía no encuentro un ciclo de Estoico en este teléfono. Abrí Entreno desde el botón de Estoico para que compartan datos.'}</p></div>
  <p class="faint" style="font-size:11px;text-align:center;font-family:var(--mono)">Entreno v1.0 · ${S.sesiones.length} sesiones guardadas</p>`;
}
$('#view-ajustes').addEventListener('click', async (ev) => {
  const id = ev.target.id;
  if (id === 'set-inicio') { const v = $('#inicio').value; if (v) { S.inicio = v; guardar(); toast('Inicio actualizado'); renderAll(); } }
  if (id === 'exp') {
    const txt = exportar(), nombre = `entreno-${hoyISO()}.json`;
    try {
      const file = new File([txt], nombre, { type: 'application/json' });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'Copia de Entreno' }); return; }
    } catch (e) { if (e.name === 'AbortError') return; }
    try {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); a.download = nombre; a.click();
      toast('Copia descargada');
    } catch (e) {
      const t = $('#exp-txt'); t.value = txt; t.hidden = false; t.select(); toast('Copiá el texto y guardalo');
    }
  }
  if (id === 'imp-btn') $('#imp-file').click();
});
$('#view-ajustes').addEventListener('change', async (ev) => {
  if (ev.target.id !== 'imp-file' || !ev.target.files[0]) return;
  try { const n = importar(await ev.target.files[0].text()); toast(`Copia importada · ${n} sesiones`); renderAll(); }
  catch (e) { toast(e.message || 'No se pudo leer el archivo'); }
});

// ---------- Navegación ----------
function setView(v) {
  document.querySelectorAll('.view').forEach((el) => (el.hidden = el.id !== 'view-' + v));
  document.querySelectorAll('.nav [data-view]').forEach((b) => b.setAttribute('aria-selected', b.dataset.view === v));
  scrollTo({ top: 0 });
}
document.querySelector('.nav').addEventListener('click', (ev) => { const b = ev.target.closest('[data-view]'); if (b) setView(b.dataset.view); });

function renderAll() { renderHeader(); renderSesion(); renderPlan(); renderProgreso(); renderAjustes(); }
renderAll();
