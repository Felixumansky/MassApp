/* Exercise library — Hebrew names, grouped by muscle.
   Each muscle has an id, label, accent color (CSS var name), and an icon emoji-free key. */

export const MUSCLES = [
  { id: 'chest', label: 'חזה', color: '#fb7185' },
  { id: 'back', label: 'גב', color: '#38bdf8' },
  { id: 'shoulders', label: 'כתפיים', color: '#fbbf24' },
  { id: 'biceps', label: 'יד קדמית', color: '#a78bfa' },
  { id: 'triceps', label: 'יד אחורית', color: '#f472b6' },
  { id: 'legs', label: 'רגליים', color: '#c6f24e' },
  { id: 'glutes', label: 'ישבן', color: '#fb923c' },
  { id: 'core', label: 'בטן', color: '#2dd4bf' },
];

export const muscleById = (id) => MUSCLES.find((m) => m.id === id) || MUSCLES[0];

export const EXERCISES = [
  // chest
  { id: 'bench-press', name: 'לחיצת חזה במוט', muscle: 'chest' },
  { id: 'incline-db-press', name: 'לחיצת חזה בשיפוע (משקולות)', muscle: 'chest' },
  { id: 'chest-fly', name: 'פרפר במכונה', muscle: 'chest' },
  { id: 'pushup', name: 'שכיבות סמיכה', muscle: 'chest' },
  { id: 'dips', name: 'מקבילים', muscle: 'chest' },
  // back
  { id: 'deadlift', name: 'דדליפט', muscle: 'back' },
  { id: 'pullup', name: 'מתח', muscle: 'back' },
  { id: 'bent-row', name: 'חתירה במוט בהטיה', muscle: 'back' },
  { id: 'lat-pulldown', name: 'פולי עליון', muscle: 'back' },
  { id: 'seated-row', name: 'חתירה בישיבה', muscle: 'back' },
  // shoulders
  { id: 'ohp', name: 'לחיצת כתפיים מעל הראש', muscle: 'shoulders' },
  { id: 'lateral-raise', name: 'הרחקת כתפיים לצדדים', muscle: 'shoulders' },
  { id: 'face-pull', name: 'משיכת פנים', muscle: 'shoulders' },
  { id: 'rear-delt-fly', name: 'פרפר אחורי', muscle: 'shoulders' },
  // biceps
  { id: 'barbell-curl', name: 'כפיפת מרפק במוט', muscle: 'biceps' },
  { id: 'db-curl', name: 'כפיפת מרפק במשקולות', muscle: 'biceps' },
  { id: 'hammer-curl', name: 'כפיפת פטיש', muscle: 'biceps' },
  // triceps
  { id: 'triceps-pushdown', name: 'פשיטת מרפק בפולי', muscle: 'triceps' },
  { id: 'overhead-ext', name: 'פשיטת מרפק מעל הראש', muscle: 'triceps' },
  { id: 'skull-crusher', name: 'סקאל קראשר', muscle: 'triceps' },
  // legs
  { id: 'squat', name: 'סקוואט', muscle: 'legs' },
  { id: 'leg-press', name: 'לחיצת רגליים', muscle: 'legs' },
  { id: 'leg-ext', name: 'פשיטת ברך', muscle: 'legs' },
  { id: 'leg-curl', name: 'כפיפת ברך', muscle: 'legs' },
  { id: 'calf-raise', name: 'הרמת עקבים', muscle: 'legs' },
  // glutes
  { id: 'hip-thrust', name: 'היפ ת׳ראסט', muscle: 'glutes' },
  { id: 'rdl', name: 'דדליפט רומני', muscle: 'glutes' },
  { id: 'lunge', name: 'לאנג׳', muscle: 'glutes' },
  // core
  { id: 'plank', name: 'פלאנק', muscle: 'core' },
  { id: 'hanging-leg-raise', name: 'הרמת רגליים בתלייה', muscle: 'core' },
  { id: 'cable-crunch', name: 'כפיפת בטן בפולי', muscle: 'core' },
];

export const exerciseById = (id) => EXERCISES.find((e) => e.id === id);

export function resolveExercise(id, customExercises = []) {
  return (customExercises || []).find((e) => e.id === id) || exerciseById(id);
}

export function routineExerciseId(entry) {
  return typeof entry === 'string' ? entry : entry?.exerciseId;
}

export function routineExerciseTargets(entry) {
  return typeof entry === 'string'
    ? { targetSets: 3, targetReps: '' }
    : {
        targetSets: Number(entry?.targetSets) || 3,
        targetReps: entry?.targetReps || '',
      };
}
