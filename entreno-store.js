// =====================================================================
// DATOS: guardado local, copia de respaldo y puente con Estoico
// =====================================================================
import { INICIO_POR_DEFECTO } from './entreno-programa.js';

const KEY = 'entreno.v1';
const ESTOICO_KEY = 'trivium.v2';

// Lo que ya registraste en la versión anterior (Barra y Paralelas).
// Se carga una sola vez, la primera vez que abrís la app en un dispositivo sin datos.
const IMPORTADO = {
  sesiones: [
    { id: '2026-09-28_pull', fecha: '2026-09-28', dia: 'pull', semana: 1, ts: 1790620117163, nota: 'Increible',
      valores: { chin: [6, 6, 6], domlast: [4, 4, 3, 3, 2, 2], facepull: [12, 12, 12], lateral: [30, 30, 30], legraise: [8, 8, 8], remo: [10, 10, 10] } },
    { id: '2026-09-29_push', fecha: '2026-09-29', dia: 'push', semana: 1, ts: 1790716632739, nota: 'Molestia en la muñeca izquierda! Desp flama',
      valores: { flexdef: [15, 15, 15], fondos: [6, 7, 6, 6], hollow: [28, 28, 30], hs: [5, 3, 6, 4, 5, 2, 3, 2], lsit: [20, 20, 20, 18], negpress: [3, 3, 3, 3], pikepu: [4, 6, 6], rueda: [8, 8, 8] } },
    { id: '2026-10-01_legs', fecha: '2026-10-01', dia: 'legs', semana: 1, ts: 1790857590016, nota: 'No llegue a hacer movilidad, pero me sentí genial! Puedo mas',
      valores: { broad: [3, 6, 6, 6], bulgara: [8, 10, 10, 10], cmj: [5, 5, 10, 10], cosaca: [6, 6, null], curlfem: [12, 12, null], finisher: [5], rdl1: [8, 10, 10], skater: [6, 6, 10] } }
  ],
  pruebas: [{ fecha: '2026-09-28', reps: 6 }]
};

function base() {
  return { v: 1, inicio: INICIO_POR_DEFECTO, nivel: 1, sesiones: [], pruebas: [], borradores: {} };
}

function leer() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...base(), ...JSON.parse(raw) };
  } catch (e) { console.warn('No se pudieron leer los datos', e); }
  const s = base();
  s.sesiones = IMPORTADO.sesiones.map((x) => ({ ...x }));
  s.pruebas = IMPORTADO.pruebas.map((x) => ({ ...x }));
  return s;
}

export const S = leer();

export function guardar() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); return true; }
  catch (e) { console.warn(e); return false; }
}
guardar();

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
export function importar(texto) {
  const j = JSON.parse(texto);
  const d = j && j.app === 'entreno' ? j.datos : null;
  if (!d || !Array.isArray(d.sesiones)) throw new Error('El archivo no es una copia de Entreno.');
  Object.assign(S, base(), d);
  guardar();
  return S.sesiones.length;
}

// ---------- Puente con Estoico ----------
// Estoico guarda en 'trivium.v2' los días marcados de cada hábito por semana del ciclo.
// Al guardar una sesión, marcamos "Entrenar" ese día. No tocamos el nivel: Estoico lo
// recalcula cuando lo abrís y registrás.
export function marcarEnEstoico(fecha) {
  try {
    const raw = localStorage.getItem(ESTOICO_KEY);
    if (!raw) return 'sin-estoico';
    const st = JSON.parse(raw);
    if (!st.cycleStart) return 'sin-ciclo';
    const dia = Math.floor((new Date(fecha + 'T12:00:00') - new Date(st.cycleStart + 'T12:00:00')) / 864e5);
    if (dia < 0 || dia >= 84) return 'fuera-de-ciclo';
    const semana = Math.floor(dia / 7) + 1, dw = dia % 7, k = 'week_' + semana;
    st.weeklyData = st.weeklyData || {};
    const wd = st.weeklyData[k] = st.weeklyData[k] || { habits: {}, points: 0, completion: 0 };
    wd.habits = wd.habits || {};
    const arr = wd.habits.entrenar = wd.habits.entrenar || [];
    if (arr.includes(dw)) return 'ya-marcado';
    arr.push(dw);
    // Mismo cálculo de cumplimiento y puntos que hace Estoico (sin tocar el nivel)
    const H = { python: [3, 4], lectura: [3, 4], entrenar: [4, 5], agua: [7, 5], alcohol: [7, 5], azucar: [5, 5], meditar: [4, 3], ayudar: [1, 3] };
    let comp = 0, pts = 0;
    Object.entries(H).forEach(([id, [obj, peso]]) => {
      const n = (wd.habits[id] || []).length;
      if (n >= obj) pts += peso;
      comp += Math.min(100, Math.round((n / obj) * 100)) / 8;
    });
    wd.completion = Math.round(comp);
    wd.points = pts;
    localStorage.setItem(ESTOICO_KEY, JSON.stringify(st));
    return 'marcado';
  } catch (e) {
    console.warn('No se pudo marcar en Estoico', e);
    return 'error';
  }
}
