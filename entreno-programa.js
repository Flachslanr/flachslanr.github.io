// =====================================================================
// PROGRAMA DE ENTRENAMIENTO
// Todo el contenido del plan vive acá: ejercicios, días, fases y la
// escalera de la transición. Para cambiar el plan, editá solo este archivo.
// =====================================================================

export const SEMANAS = 12;
export const INICIO_POR_DEFECTO = '2026-09-28';

// Orden de la secuencia: la app propone siempre la sesión que sigue a la última guardada.
export const SECUENCIA = ['push', 'pull', 'legs', 'upper'];

// ---------- Fases del ciclo ----------
export function fase(w) {
  if (w <= 2) return { nombre: 'Adaptación', texto: 'Rango bajo de reps con técnica limpia, 2 reps en reserva.' };
  if (w <= 5) return { nombre: 'Carga', texto: 'Apuntá al rango alto. Cuando la app te marque "Subí", subí la dificultad.' };
  if (w === 6) return { nombre: 'Descarga + test', texto: 'Mitad de las series en todo. En Pull A, test de máximo de dominadas.' };
  if (w <= 11) return { nombre: 'Intensificación', texto: 'Más volumen con chaleco, press con pies en el suelo y L-sit en soportes.' };
  return { nombre: 'Descarga + test final', texto: 'Mitad de series. Test de dominadas en Pull A. Objetivo: 10.' };
}
export const esDescarga = (w) => w === 6 || w === 12;

// ---------- Prescripciones que cambian con la semana ----------
const lastrada = (w) => {
  if (w <= 2) return { series: 5, lo: 2, hi: 2, texto: '5 × 2' };
  if (w <= 5) return { series: 5, lo: 3, hi: 3, texto: '5 × 3' };
  if (w === 6 || w === 12) return { series: 1, lo: 1, hi: 99, texto: 'Test: 1 serie máx. sin chaleco', test: true };
  if (w <= 8) return { series: 6, lo: 3, hi: 3, texto: '6 × 3' };
  return { series: 5, lo: 4, hi: 4, texto: '5 × 4' };
};
const emom = (w) => {
  const t = { 1: [8, 3], 2: [9, 3], 3: [10, 3], 4: [11, 3], 5: [12, 3], 6: [6, 3], 7: [10, 3], 8: [11, 3], 9: [12, 3], 10: [8, 4], 11: [10, 4], 12: [6, 3] }[w] || [8, 3];
  return { series: 1, lo: t[0] * t[1], hi: t[0] * t[1], texto: `${t[0]} min × ${t[1]} reps`, total: true };
};

// ---------- Biblioteca de ejercicios ----------
// u: unidad del registro ('reps' | 's' | 'ok' | 'rondas' | 'total')
// rx: prescripción (objeto o función de la semana) → series, rango lo–hi, texto
// yt: búsqueda de YouTube
// sube: qué hacer cuando completás todas las series en el tope del rango
export const EJ = {
  hs: { n: 'Handstand libre', u: 's', d: 45, rx: { series: 8, lo: 0, hi: 99, texto: '8 intentos' }, sinSugerencia: true,
    yt: 'freestanding handstand tutorial balance', c: 'Dedos activos, hombros empujando al techo, costillas cerradas. Anotá los segundos de cada intento. Para salir, girá una mano.' },
  lsit: { n: 'L-sit', u: 's', d: 60, rx: (w) => ({ series: 4, lo: 12, hi: 20, texto: w <= 6 ? '4 × 12–20 s · paralelas' : '4 × 12–20 s · soportes' }),
    yt: 'L-sit progression tutorial parallettes', c: 'Hombros abajo, lejos de las orejas. Rodillas bloqueadas, puntas estiradas.', sube: 'sumá 5 s por serie o pasá a los soportes (más bajo, más compresión).' },
  negpress: { n: 'Negativas de press', u: 'reps', d: 90, rx: { series: 4, lo: 3, hi: 3, texto: '4 × 3 · bajada de 4–5 s' },
    yt: 'press to handstand negatives tutorial', c: 'Desde handstand contra la pared (panza a la pared) bajá lento en tuck o straddle hasta quedar sentado en tuck o L.', sube: 'alargá la bajada a 6–8 s o hacelas con piernas en pike.' },
  fondos: { n: 'Fondos en paralelas con chaleco', u: 'reps', d: 120, rx: { series: 4, lo: 6, hi: 8, texto: '4 × 6–8' },
    yt: 'chest dips form tutorial', c: 'Torso inclinado adelante para cargar pecho. Bajá hasta que el hombro pase el codo.', sube: 'sumá 1 serie (5 × 6–8) o hacé la bajada en 3 s.' },
  flexdef: { n: 'Flexiones profundas en soportes', u: 'reps', d: 90, rx: { series: 3, lo: 10, hi: 15, texto: '3 × 10–15' },
    yt: 'deficit push ups handles tutorial', c: 'El pecho baja por debajo de las manos, pausa de 1 s abajo.', sube: 'ponete el chaleco y volvé al rango bajo.' },
  pikepu: { n: 'Pike push-ups con pies en el banco', u: 'reps', d: 90, rx: { series: 3, lo: 6, hi: 10, texto: '3 × 6–10' },
    yt: 'elevated pike push up tutorial', c: 'Caderas sobre los hombros, la cabeza baja por delante de las manos formando un triángulo.', sube: 'poné las manos sobre los soportes para ganar recorrido.' },
  rueda: { n: 'Rueda abdominal', u: 'reps', d: 60, rx: { series: 3, lo: 8, hi: 12, texto: '3 × 8–12' },
    yt: 'ab wheel rollout proper form', c: 'Pelvis en retroversión, sin dejar caer la cadera. Primero de rodillas.', sube: 'más recorrido, o rollouts de pie contra una pared como tope.' },
  hollow: { n: 'Hollow body hold', u: 's', d: 45, rx: { series: 3, lo: 30, hi: 40, texto: '3 × 30–40 s' },
    yt: 'hollow body hold tutorial', c: 'Zona lumbar pegada al mat. Es la misma forma del cuerpo que en el handstand.', sube: 'hacé hollow rocks 3 × 20.' },

  domlast: { n: 'Dominadas con chaleco 10 kg', u: 'reps', d: 180, rx: lastrada,
    yt: 'weighted pull ups technique', c: 'Estrictas: desde brazos estirados hasta el mentón sobre la barra. Si no sale una rep, completá con negativas con chaleco de 5 s.', sube: 'en la próxima fase el plan sube solo; mientras tanto, pausa de 1 s arriba.' },
  chin: { n: 'Dominadas supinas', u: 'reps', d: 150, rx: { series: 3, lo: 5, hi: 8, texto: '3 × máx. − 1' },
    yt: 'chin up proper form', c: 'Dejá 1–2 reps en reserva. Agarre al ancho de hombros.', sube: 'hacé la última serie con chaleco.' },
  remo: { n: 'Remo invertido bajo las paralelas', u: 'reps', d: 90, rx: { series: 3, lo: 8, hi: 12, texto: '3 × 8–12' },
    yt: 'inverted row parallel bars', c: 'Cuerpo recto, pecho a la barra, pausa de 1 s arriba.', sube: 'pies sobre el banco, o con chaleco.' },
  facepull: { n: 'Face pulls con banda', u: 'reps', d: 45, rx: { series: 3, lo: 15, hi: 15, texto: '3 × 15' },
    yt: 'resistance band face pull', c: 'Codos altos, rotá hacia afuera al final. Cuida el hombro para el handstand.', sube: 'usá una banda más dura.' },
  legraise: { n: 'Elevaciones de piernas colgado', u: 'reps', d: 75, rx: { series: 3, lo: 8, hi: 10, texto: '3 × 8–10' },
    yt: 'hanging leg raise strict tutorial', c: 'Sin balanceo, piernas estiradas hasta 90° o más. Es compresión pura para el press.', sube: 'subí los pies hasta la barra (toes to bar).' },
  lateral: { n: 'Plancha lateral', u: 's', d: 30, rx: { series: 3, lo: 30, hi: 45, texto: '3 × 30–45 s por lado' },
    yt: 'side plank proper form', c: 'Cadera alta y alineada. Anotá los segundos del lado más débil.', sube: 'elevá la pierna de arriba o sumá el chaleco.' },

  cmj: { n: 'Salto vertical con contramovimiento', u: 'reps', d: 90, rx: { series: 4, lo: 5, hi: 5, texto: '4 × 5' },
    yt: 'countermovement jump technique', c: 'Máxima altura en cada salto. Aterrizaje silencioso con rodillas alineadas; reseteá entre saltos.', sube: 'mantené 5 reps y pasá a saltos al banco o con chaleco. No sumes reps: la calidad es lo que cuenta.' },
  broad: { n: 'Salto largo', u: 'reps', d: 90, rx: { series: 4, lo: 3, hi: 3, texto: '4 × 3' },
    yt: 'broad jump technique', c: 'Brazos atrás y adelante con fuerza. Aterrizá y estabilizá 2 s antes del siguiente.', sube: 'mantené 3 reps y encadená 2 saltos seguidos sin pausa.' },
  skater: { n: 'Saltos patinador', u: 'reps', d: 60, rx: { series: 3, lo: 6, hi: 6, texto: '3 × 6 por lado' },
    yt: 'skater jumps exercise', c: 'Caé en una pierna y frená el movimiento antes de rebotar al otro lado.', sube: 'más distancia lateral, no más reps.' },
  bulgara: { n: 'Sentadilla búlgara con chaleco', u: 'reps', d: 90, rx: { series: 4, lo: 8, hi: 10, texto: '4 × 8–10 por pierna' },
    yt: 'bulgarian split squat form', c: 'Pie trasero sobre el banco. Torso levemente inclinado para cargar glúteo.', sube: 'bajada de 3 s y pausa abajo, o salto en la subida.' },
  rdl1: { n: 'Peso muerto rumano a una pierna', u: 'reps', d: 75, rx: { series: 3, lo: 8, hi: 10, texto: '3 × 8–10 por pierna' },
    yt: 'single leg romanian deadlift form', c: 'Con chaleco. Cadera cuadrada al piso, bajá hasta sentir el isquio.', sube: 'pausa de 2 s abajo o banda pisada para más resistencia.' },
  curlfem: { n: 'Curl femoral deslizante', u: 'reps', d: 75, rx: { series: 3, lo: 8, hi: 12, texto: '3 × 8–12' },
    yt: 'sliding hamstring curl towel', c: 'Talones sobre una toalla en piso liso, cadera arriba todo el recorrido.', sube: 'hacelo a una pierna.' },
  cosaca: { n: 'Sentadilla cosaca', u: 'reps', d: 60, rx: { series: 3, lo: 6, hi: 8, texto: '3 × 6–8 por lado' },
    yt: 'cossack squat tutorial', c: 'Talón apoyado, bajá lo más que puedas con control.', sube: 'con chaleco.' },
  finisher: { n: 'Intervalos 30 s / 30 s', u: 'rondas', d: 30, rx: { series: 1, lo: 10, hi: 10, texto: '10 rondas' },
    yt: 'burpee mountain climber hiit 30 30', c: 'Alterná burpees, mountain climbers y jumping jacks. Anotá las rondas completas.', sube: 'trabajo 40 s / descanso 20 s.' },
  '9090': { n: '90/90 con transiciones', u: 'ok', d: 0, rx: { series: 1, texto: '2 × 8 por lado' }, yt: '90 90 hip switch mobility', c: 'Rotá de lado a lado sin usar las manos.' },
  pancake: { n: 'Pancake activo', u: 'ok', d: 0, rx: { series: 1, texto: '3 × 45 s' }, yt: 'pancake stretch active tutorial', c: 'Piernas abiertas, torso adelante con espalda larga. Es la flexibilidad del press en straddle.' },
  pike: { n: 'Pike activo sentado', u: 'ok', d: 0, rx: { series: 1, texto: '3 × 30 s' }, yt: 'active pike stretch compression', c: 'Piernas juntas, pliegue desde la cadera. Terminá cada serie con 5 elevaciones de pies.' },
  couch: { n: 'Couch stretch', u: 'ok', d: 0, rx: { series: 1, texto: '2 × 45 s por lado' }, yt: 'couch stretch hip flexor', c: 'Flexor de cadera. Glúteo apretado del lado estirado.' },
  frog: { n: 'Frog stretch', u: 'ok', d: 0, rx: { series: 1, texto: '2 × 60 s' }, yt: 'frog stretch hip mobility', c: 'Mecé la cadera suave adelante y atrás.' },

  pressel: { n: 'Press con pies elevados', u: 'reps', d: 90, rx: (w) => ({ series: 5, lo: 3, hi: 3, texto: w <= 6 ? '5 × 3 · pies en el banco' : '5 × 3 · pies en el suelo, pared atrás' }),
    yt: 'elevated straddle press handstand drill', c: 'Manos en el piso, caminá las manos cerca, llevá las caderas sobre los hombros y despegá los pies. Straddle al principio.', sube: 'bajá la altura de los pies o probá en pike.' },
  compsop: { n: 'L-sit → tuck → caderas arriba', u: 'reps', d: 90, rx: { series: 4, lo: 3, hi: 3, texto: '4 × 3' },
    yt: 'L sit to tuck press handstand parallettes', c: 'En los soportes: de L-sit recogé a tuck y empujá para subir las caderas lo más alto que puedas.', sube: 'intentá llegar a tuck handstand con la pared como red.' },
  emom: { n: 'EMOM de dominadas', u: 'total', d: 0, rx: emom,
    yt: 'pull up emom workout', c: 'Al inicio de cada minuto hacé las reps indicadas y descansá el resto. Nunca al fallo. Anotá el total de reps.' },
  negdom: { n: 'Negativas de dominada', u: 'reps', d: 90, rx: { series: 3, lo: 3, hi: 3, texto: '3 × 3 · bajada de 5 s' },
    yt: 'negative pull ups tutorial', c: 'Subí con salto o apoyo y bajá en 5 s controlados hasta brazos estirados.', sube: 'hacelas con chaleco.' },
  pseudo: { n: 'Flexiones pseudo planche', u: 'reps', d: 90, rx: { series: 3, lo: 6, hi: 10, texto: '3 × 6–10' },
    yt: 'pseudo planche push ups tutorial', c: 'En los soportes, manos a la altura de la cintura, hombros por delante de las manos.', sube: 'llevá los hombros más adelante de las manos.' },
  arquera: { n: 'Flexiones arqueras', u: 'reps', d: 75, rx: { series: 3, lo: 5, hi: 8, texto: '3 × 5–8 por lado' },
    yt: 'archer push up tutorial', c: 'Pecho unilateral. El brazo que estira queda recto y activo.', sube: 'con chaleco, o pasá a flexiones a un brazo asistidas.' },
  pikelift: { n: 'Pike lifts sentado', u: 'reps', d: 45, rx: { series: 3, lo: 10, hi: 10, texto: '3 × 10' },
    yt: 'seated pike leg lifts compression', c: 'Manos al lado de las rodillas, elevá los pies estirados sin tocar el piso.', sube: 'pausa de 2 s arriba en cada rep.' }
};

// ---------- Días ----------
export const DIAS = {
  push: { nombre: 'Push A', sub: 'Pecho + transición L-sit → handstand', dur: '~65 min', color: 'var(--push)',
    calent: ['Muñecas: círculos y balanceos en cuadrupedia con palmas y dorsos (2 min)', 'Flexiones escapulares 2 × 10', 'Dislocaciones con banda 2 × 10', 'Pike push-ups suaves 1 × 8', '3 kick-ups a la pared'],
    bloques: [
      { t: 'Habilidad', nota: 'Siempre primero, fresco', ej: ['hs', 'lsit', 'negpress'] },
      { t: 'Fuerza', nota: 'Pecho y hombro', ej: ['fondos', 'flexdef', 'pikepu'] },
      { t: 'Abdominales', ej: ['rueda', 'hollow'] }
    ] },
  pull: { nombre: 'Pull A', sub: 'Fuerza máxima de dominadas', dur: '~55 min', color: 'var(--pull)',
    calent: ['Dislocaciones con banda 2 × 10', 'Colgado pasivo 30 s', 'Dominadas escapulares 2 × 8', 'Face pulls con banda 1 × 15', '2 dominadas fáciles con banda'],
    bloques: [
      { t: 'Fuerza', nota: 'Descansos largos', ej: ['domlast', 'chin'] },
      { t: 'Espalda complementaria', ej: ['remo', 'facepull'] },
      { t: 'Abdominales', ej: ['legraise', 'lateral'] }
    ] },
  legs: { nombre: 'Piernas', sub: 'Pliometría → fuerza → cardio → movilidad', dur: '~70 min', color: 'var(--legs)',
    calent: ['Skipping y saltos suaves 2 min', 'Balanceos de pierna 10 por lado', 'World’s greatest stretch 5 por lado', 'Puente de glúteo 15', 'Sentadilla profunda con pausa 30 s'],
    bloques: [
      { t: 'Pliometría', nota: 'Máxima intención', ej: ['cmj', 'broad', 'skater'] },
      { t: 'Fuerza', ej: ['bulgara', 'rdl1', 'curlfem', 'cosaca'] },
      { t: 'Cardio', nota: 'Finisher de 10 min', ej: ['finisher'] },
      { t: 'Movilidad de cadera', nota: 'Cierre', ej: ['9090', 'pancake', 'pike', 'couch', 'frog'] }
    ] },
  upper: { nombre: 'Upper B', sub: 'Volumen de dominadas + práctica del press', dur: '~70 min', color: 'var(--upper)',
    calent: ['Muñecas 2 min, igual que Push A', 'Dislocaciones con banda 2 × 10', 'Dominadas escapulares 2 × 8', 'Flexiones escapulares 2 × 10', '3 kick-ups a la pared'],
    bloques: [
      { t: 'Habilidad', nota: 'La transición por partes', ej: ['hs', 'pressel', 'compsop'] },
      { t: 'Dominadas · volumen', ej: ['emom', 'negdom'] },
      { t: 'Empuje complementario', ej: ['pseudo', 'arquera'] },
      { t: 'Abdominales', ej: ['rueda', 'pikelift'] }
    ] }
};

export const ESCALERA = [
  { t: 'Base', cr: 'Handstand libre 10 s y L-sit 20 s' },
  { t: 'Compresión', cr: '10 pike lifts sentado y L-sit 25 s' },
  { t: 'Negativas de press', cr: 'Bajar de handstand a tuck/L en 5 s, 3 reps controladas' },
  { t: 'Press con pies elevados', cr: '3 reps desde el banco en straddle' },
  { t: 'Press con pared', cr: 'Straddle press desde el suelo, pared como red' },
  { t: 'Straddle press libre', cr: '1–3 reps desde el suelo sin pared' },
  { t: 'L-sit → straddle press', cr: 'Desde L-sit en soportes hasta handstand' },
  { t: 'L-sit → pike press', cr: 'La transición completa con piernas juntas' }
];

export function rx(id, w) {
  const e = EJ[id];
  const r = typeof e.rx === 'function' ? e.rx(w) : e.rx;
  if (esDescarga(w) && !r.test && r.series > 1 && e.u !== 'ok') {
    const s = Math.max(1, Math.ceil(r.series / 2));
    return { ...r, series: s, texto: r.texto.replace(/^\d+/, String(s)) + ' · descarga' };
  }
  return r;
}

export const ytUrl = (id) => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(EJ[id].yt);
