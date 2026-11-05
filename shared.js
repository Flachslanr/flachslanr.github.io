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
    { id: 'python', category: 'mente', name: 'Aprender Python', icon: '🐍', weeklyTarget: 3, weight: 4 },
    { id: 'lectura', category: 'mente', name: 'Leer', icon: '📖', weeklyTarget: 3, weight: 4 },
    { id: 'entrenar', category: 'cuerpo', name: 'Entrenar', icon: '💪', weeklyTarget: 4, weight: 5 },
    { id: 'agua', category: 'cuerpo', name: 'Agua +2L', icon: '💧', weeklyTarget: 7, weight: 5 },
    { id: 'alcohol', category: 'cuerpo', name: 'No alcohol', icon: '🍷', weeklyTarget: 7, weight: 5 },
    { id: 'azucar', category: 'cuerpo', name: 'No azúcar', icon: '🍬', weeklyTarget: 5, weight: 5 },
    { id: 'meditar', category: 'alma', name: 'Meditar', icon: '🧘', weeklyTarget: 4, weight: 3 },
    { id: 'ayudar', category: 'alma', name: 'Ayudar a alguien', icon: '🙏', weeklyTarget: 1, weight: 3 }
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

  window.EstoicoShared = { ESTOICO_KEY, DIAS_CICLO, HABITS, dateKey, parseDate, addDays, dayDiff, weekNumber, position, computeWeek };
})();
