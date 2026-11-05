// =====================================================================
// DATOS: guardado local, copia de respaldo y puente con Estoico
// =====================================================================
const KEY = 'entreno.v1';
const SH = window.EstoicoShared;

// Inicio por defecto para un teléfono nuevo: el del ciclo de Estoico si existe; si no, hoy.
function inicioEstoico() {
  try { return JSON.parse(localStorage.getItem(SH.ESTOICO_KEY) || 'null')?.cycleStart || null; }
  catch (e) { return null; }
}

function base() {
  return { v: 1, inicio: inicioEstoico() || SH.dateKey(), nivel: 1, sesiones: [], pruebas: [], borradores: {} };
}

function respaldar(motivo) {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) localStorage.setItem(KEY + '.bak', JSON.stringify({ motivo, fecha: new Date().toISOString(), raw }));
  } catch (e) { console.warn('No se pudo guardar la copia de seguridad', e); }
}

function leer() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...base(), ...JSON.parse(raw) };
  } catch (e) {
    // Datos ilegibles: se guardan aparte y no se pisan hasta que registres algo nuevo.
    console.warn('No se pudieron leer los datos', e);
    respaldar('ilegible');
  }
  return base();
}

export const S = leer();

export function guardar() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); return true; }
  catch (e) { console.warn(e); return false; }
}

// ---------- Sesiones ----------
export function guardarSesion(doc) {
  S.sesiones = S.sesiones.filter((s) => s.id !== doc.id).concat([doc]);
  delete S.borradores[doc.dia];
  return guardar();
}
export function borrarSesion(id) {
  S.sesiones = S.sesiones.filter((s) => s.id !== id);
  guardar();
}
export const ordenadas = () => S.sesiones.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));

export function ultimaDe(exId) {
  for (const s of ordenadas()) {
    const v = s.valores && s.valores[exId];
    if (v && v.some((x) => x !== null && x !== '')) return { fecha: s.fecha, v };
  }
  return null;
}
export function mejorDe(exId) {
  let m = 0;
  S.sesiones.forEach((s) => (s.valores?.[exId] || []).forEach((x) => { if (Number(x) > m) m = Number(x); }));
  return m;
}
export function serieDe(exId) {
  // Para gráficos: mejor valor de cada sesión, en orden cronológico
  return S.sesiones.slice().sort((a, b) => (a.ts || 0) - (b.ts || 0))
    .filter((s) => s.valores?.[exId]?.some((x) => x !== null))
    .map((s) => ({ fecha: s.fecha, v: Math.max(...s.valores[exId].filter((x) => x !== null).map(Number)) }));
}

// ---------- Copia de respaldo ----------
export function exportar() {
  return JSON.stringify({ app: 'entreno', exportado: new Date().toISOString(), datos: S }, null, 2);
}
// Lee y valida una copia sin aplicarla todavía
export function leerCopia(texto) {
  let j;
  try { j = JSON.parse(texto); } catch (e) { throw new Error('El archivo no es una copia de Entreno.'); }
  const d = j && j.app === 'entreno' ? j.datos : null;
  if (!d || !Array.isArray(d.sesiones)) throw new Error('El archivo no es una copia de Entreno.');
  return d;
}
// Reemplaza los datos actuales por la copia (antes guarda un respaldo de lo actual)
export function aplicarCopia(d) {
  respaldar('antes-de-importar');
  Object.keys(S).forEach((k) => delete S[k]);
  Object.assign(S, base(), d);
  guardar();
  return S.sesiones.length;
}

// ---------- Puente con Estoico ----------
// Estoico guarda en 'trivium.v2' los días marcados de cada hábito por semana del ciclo.
// Al guardar una sesión, marcamos "Entrenar" ese día. El nivel lo deriva Estoico
// de las semanas cerradas, así que acá solo se actualizan cumplimiento y puntos.
export function cicloEstoico() {
  try { return JSON.parse(localStorage.getItem(SH.ESTOICO_KEY) || 'null'); }
  catch (e) { return null; }
}

export function marcarEnEstoico(fecha) {
  try {
    const st = cicloEstoico();
    if (!st) return 'sin-estoico';
    if (!st.cycleStart) return 'sin-ciclo';
    const pos = SH.position(st.cycleStart, fecha);
    if (!pos) return 'fuera-de-ciclo';
    const k = 'week_' + pos.week;
    st.weeklyData = st.weeklyData || {};
    const wd = st.weeklyData[k] = st.weeklyData[k] || { habits: {}, points: 0, completion: 0 };
    wd.habits = wd.habits || {};
    const arr = wd.habits.entrenar = wd.habits.entrenar || [];
    if (arr.includes(pos.dow)) return 'ya-marcado';
    arr.push(pos.dow);
    Object.assign(wd, SH.computeWeek(wd.habits));
    localStorage.setItem(SH.ESTOICO_KEY, JSON.stringify(st));
    return 'marcado';
  } catch (e) {
    console.warn('No se pudo marcar en Estoico', e);
    return 'error';
  }
}
