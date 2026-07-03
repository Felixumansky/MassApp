/**
 * build-exercises.mjs — generates src/lib/exercisesCatalog.js from the
 * ExerciseDB open dataset (hasaneyldrm/exercises-dataset, ~1,324 exercises).
 *
 * Run:  node scripts/build-exercises.mjs
 *
 * What it does:
 *  - Fetches (and caches) data/exercises.json from the dataset repo.
 *  - Trims each record to a lean shape (drops 5 unused languages + the duplicate
 *    `instructions` blob; keeps English `instruction_steps` only).
 *  - Maps the dataset's `target` muscle → one of MassApp's 8 muscle groups.
 *  - Produces a bilingual name: English (`name_en`) is always kept; a Hebrew
 *    `name` is composed by a glossary-based translator (equipment / movement /
 *    modifier aware) so it reads in natural Hebrew word order.
 *  - Emits LEGACY_ALIASES so old routine/workout ids (e.g. 'bench-press')
 *    resolve to the equivalent new catalog id, and overrides those entries'
 *    Hebrew with the app's original curated names.
 *  - Appends a few RETAINED legacy exercises that have no clean dataset match.
 *  - Instruction steps: Hebrew is the primary `steps` (looked up per-sentence in
 *    scripts/steps.he.json — a pre-translated EN→HE map covering the whole
 *    dataset); the English originals are kept in `steps_en`.
 *
 * Output is committed; re-run only when the source dataset changes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC_URL = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json';
const CACHE = path.join(HERE, 'exercises.raw.json'); // gitignored
const OUT = path.join(HERE, '..', 'src', 'lib', 'exercisesCatalog.js');

// ---------------------------------------------------------------------------
// 1. Muscle mapping: dataset `target` → one of MassApp's 8 groups.
//    (Falls back to body_part when a target is somehow unmapped.)
// ---------------------------------------------------------------------------
const MUSCLE_BY_TARGET = {
  pectorals: 'chest',
  'serratus anterior': 'chest',
  lats: 'back',
  'upper back': 'back',
  traps: 'back',
  spine: 'back',
  biceps: 'biceps',
  forearms: 'biceps',
  triceps: 'triceps',
  delts: 'shoulders',
  'levator scapulae': 'shoulders',
  quads: 'legs',
  hamstrings: 'legs',
  calves: 'legs',
  adductors: 'legs',
  abductors: 'glutes',
  glutes: 'glutes',
  abs: 'core',
  'cardiovascular system': 'core',
};
const MUSCLE_BY_BODYPART = {
  chest: 'chest',
  back: 'back',
  shoulders: 'shoulders',
  neck: 'shoulders',
  'upper arms': 'biceps',
  'lower arms': 'biceps',
  'upper legs': 'legs',
  'lower legs': 'legs',
  waist: 'core',
  cardio: 'core',
};
const mapMuscle = (e) => MUSCLE_BY_TARGET[e.target] || MUSCLE_BY_BODYPART[e.body_part] || 'core';

// ---------------------------------------------------------------------------
// 2. Hebrew translator (glossary-based). English name is always kept as the
//    secondary label, so imperfect Hebrew is acceptable — it never hides info.
// ---------------------------------------------------------------------------

// Equipment → Hebrew phrase WITH its natural preposition (appended after the move).
const EQUIP = {
  'ez barbell': 'עם מוט EZ',
  'olympic barbell': 'עם מוט אולימפי',
  'trap bar': 'עם מוט טרפ',
  barbell: 'עם מוט',
  dumbbell: 'עם משקולות',
  cable: 'בפולי',
  'smith machine': "במכונת סמית'",
  'leverage machine': 'במכונה',
  'sled machine': 'במכונת מזחלת',
  'resistance band': 'עם גומיית התנגדות',
  band: 'עם גומייה',
  kettlebell: 'עם קטלבל',
  'medicine ball': 'עם כדור כוח',
  'stability ball': 'עם כדור פיזיו',
  'bosu ball': 'על בוסו',
  'wheel roller': 'עם גלגלת',
  weighted: 'עם משקל',
  assisted: 'בסיוע',
  'body weight': '(משקל גוף)',
  rope: 'עם חבל',
  roller: 'עם גלגלת',
  hammer: 'עם פטיש',
  sled: 'עם מזחלת',
};

// Movement "head" phrases (multi-word first). This is the core of the name.
const MOVES = {
  'incline bench press': 'לחיצת חזה בשיפוע',
  'decline bench press': 'לחיצת חזה בשיפוע שלילי',
  'bench press': 'לחיצת חזה',
  'chest press': 'לחיצת חזה',
  'shoulder press': 'לחיצת כתפיים',
  'overhead press': 'לחיצה מעל הראש',
  'military press': 'לחיצה צבאית',
  'push press': 'פוש פרס',
  'floor press': 'לחיצה מהרצפה',
  'leg press': 'לחיצת רגליים',
  'calf press': 'לחיצת שוקיים',
  'push-up': 'שכיבת סמיכה',
  'push up': 'שכיבת סמיכה',
  pushup: 'שכיבת סמיכה',
  'pull-up': 'מתח',
  'pull up': 'מתח',
  pullup: 'מתח',
  'chin-up': 'מתח אחיזה תחתית',
  'chin up': 'מתח אחיזה תחתית',
  'lat pulldown': 'פולי עליון',
  pulldown: 'משיכת פולי',
  'bent over row': 'חתירה בהטיה',
  'upright row': 'חתירה זקופה',
  'rear delt row': 'חתירת כתף אחורית',
  row: 'חתירה',
  'romanian deadlift': 'דדליפט רומני',
  'stiff leg deadlift': 'דדליפט רגליים ישרות',
  deadlift: 'דדליפט',
  'lateral raise': 'הרחקת כתפיים לצדדים',
  'front raise': 'הרמה קדמית',
  'leg raise': 'הרמת רגליים',
  'hip raise': 'הרמת אגן',
  'calf raise': 'הרמת עקבים',
  'reverse fly': 'פרפר הפוך',
  fly: 'פרפר',
  'hammer curl': 'כפיפת פטיש',
  'preacher curl': 'כפיפת מרפק בכיסא הטפה',
  'wrist curl': 'כפיפת שורש כף היד',
  'leg curl': 'כפיפת ברך',
  'bicep curl': 'כפיפת מרפק',
  'biceps curl': 'כפיפת מרפק',
  curl: 'כפיפת מרפק',
  'triceps extension': 'פשיטת מרפק',
  'tricep extension': 'פשיטת מרפק',
  'leg extension': 'פשיטת ברך',
  'back extension': 'פשיטת גב',
  hyperextension: 'פשיטת גב',
  extension: 'פשיטה',
  'triceps pushdown': 'פשיטת מרפק בפולי',
  pushdown: 'פשיטת מרפק בפולי',
  kickback: 'בעיטה אחורית',
  pullover: 'פולאובר',
  'hip thrust': 'היפ תראסט',
  'glute bridge': 'גשר ישבן',
  bridge: 'גשר',
  'good morning': 'גוד מורנינג',
  'reverse crunch': 'כפיפת בטן הפוכה',
  crunch: 'כפיפת בטן',
  'sit-up': 'כפיפת בטן מלאה',
  'sit up': 'כפיפת בטן מלאה',
  situp: 'כפיפת בטן מלאה',
  'russian twist': 'פיתול רוסי',
  twist: 'פיתול',
  'side bend': 'כפיפה צדית',
  'side plank': 'פלאנק צדי',
  plank: 'פלאנק',
  shrug: 'משיכת כתפיים',
  dip: 'מקבילים',
  'front squat': 'סקוואט קדמי',
  'hack squat': 'האק סקוואט',
  'split squat': 'סקוואט מפוצל',
  'goblet squat': 'סקוואט גובלט',
  'full squat': 'סקוואט',
  squat: 'סקוואט',
  lunge: 'לאנג׳',
  'step up': 'עלייה על ספסל',
  'step-up': 'עלייה על ספסל',
  thruster: 'תראסטר',
  clean: 'קלין',
  snatch: 'סנאץ׳',
  'face pull': 'משיכת פנים',
  raise: 'הרמה',
  press: 'לחיצה',
  stretch: 'מתיחה',
  crossover: 'קרוסאובר',
  'cross-over': 'קרוסאובר',
};

// Modifier tokens/phrases (translated and appended after the head, in order).
const MODS = {
  incline: 'בשיפוע',
  decline: 'בשיפוע שלילי',
  seated: 'בישיבה',
  standing: 'בעמידה',
  lying: 'בשכיבה',
  kneeling: 'בכריעה',
  prone: 'בשכיבה על הבטן',
  supine: 'בשכיבה על הגב',
  'single arm': 'ביד אחת',
  'one arm': 'ביד אחת',
  'single leg': 'ברגל אחת',
  'one leg': 'ברגל אחת',
  'two arm': 'בשתי ידיים',
  'close grip': 'אחיזה צרה',
  'close-grip': 'אחיזה צרה',
  'wide grip': 'אחיזה רחבה',
  'wide-grip': 'אחיזה רחבה',
  'neutral grip': 'אחיזה ניטרלית',
  'reverse grip': 'אחיזה הפוכה',
  'behind neck': 'מאחורי העורף',
  'behind head': 'מאחורי העורף',
  overhead: 'מעל הראש',
  alternate: 'לסירוגין',
  alternating: 'לסירוגין',
  reverse: 'הפוך',
  wide: 'רחב',
  narrow: 'צר',
  front: 'קדמי',
  rear: 'אחורי',
  side: 'צדי',
  lateral: 'לצדדים',
  high: 'גבוה',
  low: 'נמוך',
  middle: 'אמצעי',
  bent: 'בהטיה',
  'v-bar': 'עם ידית V',
  rope: 'עם חבל',
};

// Tokens to drop entirely (media/gender/versioning noise).
const DROP = new Set(['male', 'female', 'version', 'v', 'pov', 'the', 'a', 'with', 'to', 'of', 'on', 'and', 'in']);

const clean = (name) =>
  String(name)
    .toLowerCase()
    .replace(/\((?:male|female)\)/g, ' ') // gender markers
    .replace(/\(([^)]*pov[^)]*)\)/g, ' ') // camera-angle markers
    .replace(/\bv\.?\s*\d+\b/g, ' ') // "v. 2"
    .replace(/[()]/g, ' ')
    .replace(/[^a-z0-9°\- ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Greedy longest-phrase matcher over a dictionary; returns {he, rest}.
function extract(tokens, dict) {
  const keys = Object.keys(dict).sort((a, b) => b.split(/[ -]/).length - a.split(/[ -]/).length);
  const text = ' ' + tokens.join(' ') + ' ';
  for (const k of keys) {
    const needle = ' ' + k.replace(/-/g, ' ') + ' ';
    const norm = text.replace(/-/g, ' ');
    const at = norm.indexOf(needle);
    if (at !== -1) {
      const before = norm.slice(1, at).trim();
      const after = norm.slice(at + needle.length - 1).trim();
      const rest = [...before.split(' '), ...after.split(' ')].filter(Boolean);
      return { he: dict[k], rest };
    }
  }
  return null;
}

const coverage = { full: 0, partial: 0, none: 0 };

function toHebrew(nameEn) {
  let tokens = clean(nameEn).split(' ').filter(Boolean);

  // equipment (at most one)
  let equipHe = '';
  const eq = extract(tokens, EQUIP);
  if (eq) {
    equipHe = eq.he;
    tokens = eq.rest;
  }

  // movement head
  const mv = extract(tokens, MOVES);
  let headHe = '';
  if (mv) {
    headHe = mv.he;
    tokens = mv.rest;
  }

  // remaining → modifiers
  const modParts = [];
  let leftover = 0;
  // multi-word modifiers first
  let guard = 0;
  while (guard++ < 12) {
    const m = extract(tokens, MODS);
    if (!m) break;
    modParts.push(m.he);
    tokens = m.rest;
  }
  for (const t of tokens) {
    if (DROP.has(t)) continue;
    if (/^\d+°?$/.test(t) || /^\d+\/\d+$/.test(t)) {
      modParts.push(t);
      continue;
    }
    leftover++; // untranslated english token
  }

  if (!headHe) {
    coverage.none++;
    return null; // signal: no confident Hebrew → caller falls back to English
  }
  if (leftover > 0) coverage.partial++;
  else coverage.full++;

  return [headHe, ...modParts, equipHe].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// 3. Legacy aliases: old MassApp id → dataset id (+ curated Hebrew override).
//    Resolved from the dataset by these ids (verified against the data).
// ---------------------------------------------------------------------------
const ALIASES = {
  'bench-press': { id: '0025', he: 'לחיצת חזה במוט' },
  'incline-db-press': { id: '0314', he: 'לחיצת חזה בשיפוע (משקולות)' },
  'chest-fly': { id: '0596', he: 'פרפר במכונה' },
  pushup: { id: '0662', he: 'שכיבות סמיכה' },
  dips: { id: '0251', he: 'מקבילים' },
  deadlift: { id: '0032', he: 'דדליפט' },
  pullup: { id: '0652', he: 'מתח' },
  'bent-row': { id: '0027', he: 'חתירה במוט בהטיה' },
  'lat-pulldown': { id: '2330', he: 'פולי עליון' },
  'seated-row': { id: '0861', he: 'חתירה בישיבה' },
  ohp: { id: '0426', he: 'לחיצת כתפיים מעל הראש' },
  'lateral-raise': { id: '0334', he: 'הרחקת כתפיים לצדדים' },
  'rear-delt-fly': { id: '0383', he: 'פרפר אחורי' },
  'barbell-curl': { id: '0031', he: 'כפיפת מרפק במוט' },
  'db-curl': { id: '0294', he: 'כפיפת מרפק במשקולות' },
  'hammer-curl': { id: '0313', he: 'כפיפת פטיש' },
  'triceps-pushdown': { id: '0241', he: 'פשיטת מרפק בפולי' },
  'overhead-ext': { id: '0109', he: 'פשיטת מרפק מעל הראש' },
  'skull-crusher': { id: '0061', he: 'סקאל קראשר' },
  squat: { id: '0043', he: 'סקוואט' },
  'leg-press': { id: '0739', he: 'לחיצת רגליים' },
  'leg-ext': { id: '0585', he: 'פשיטת ברך' },
  'leg-curl': { id: '0586', he: 'כפיפת ברך' },
  'calf-raise': { id: '0605', he: 'הרמת עקבים' },
  rdl: { id: '0085', he: 'דדליפט רומני' },
  lunge: { id: '0054', he: 'לאנג׳' },
  'hanging-leg-raise': { id: '0472', he: 'הרמת רגליים בתלייה' },
  'cable-crunch': { id: '0175', he: 'כפיפת בטן בפולי' },
};

// Legacy exercises with no clean dataset equivalent — kept as-is.
const RETAINED = [
  { id: 'face-pull', name: 'משיכת פנים', name_en: 'Face Pull', muscle: 'shoulders' },
  { id: 'hip-thrust', name: 'היפ ת׳ראסט', name_en: 'Hip Thrust', muscle: 'glutes' },
  { id: 'plank', name: 'פלאנק', name_en: 'Plank', muscle: 'core' },
];

// ---------------------------------------------------------------------------
// 4. Build
// ---------------------------------------------------------------------------
async function loadRaw() {
  if (fs.existsSync(CACHE)) return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  console.log('Fetching dataset…');
  const res = await fetch(SRC_URL);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  fs.writeFileSync(CACHE, JSON.stringify(data));
  return data;
}

const raw = await loadRaw();

// EN→HE per-sentence translations of every unique instruction step.
const STEPS_HE = JSON.parse(fs.readFileSync(path.join(HERE, 'steps.he.json'), 'utf8'));
let stepsMissing = 0;

// dataset id → new alias id, and dataset id → curated Hebrew override
const idToAliasHe = {};
for (const a of Object.values(ALIASES)) idToAliasHe[a.id] = a.he;

const catalog = raw.map((e) => {
  const nameHe = idToAliasHe[e.id] || toHebrew(e.name) || e.name;
  const stepsEn = Array.isArray(e.instruction_steps?.en) ? e.instruction_steps.en : [];
  const stepsHe = stepsEn.map((s) => {
    if (STEPS_HE[s]) return STEPS_HE[s];
    stepsMissing++;
    return s; // untranslated fallback — stays English
  });
  return {
    id: 'edb-' + e.id,
    name: nameHe,
    name_en: e.name,
    muscle: mapMuscle(e),
    equipment: e.equipment || '',
    target: e.target || '',
    bodyPart: e.body_part || '',
    secondaryMuscles: Array.isArray(e.secondary_muscles) ? e.secondary_muscles : [],
    steps: stepsHe,
    steps_en: stepsEn,
    mediaId: e.media_id || '',
  };
});

for (const r of RETAINED) catalog.push({ ...r, equipment: '', target: '', bodyPart: '', secondaryMuscles: [], steps: [], steps_en: [], mediaId: '' });

// LEGACY_ALIASES: old id → new catalog id
const legacyAliases = {};
for (const [oldId, a] of Object.entries(ALIASES)) legacyAliases[oldId] = 'edb-' + a.id;

// muscle distribution sanity
const byMuscle = {};
for (const c of catalog) byMuscle[c.muscle] = (byMuscle[c.muscle] || 0) + 1;

const header = `// AUTO-GENERATED by scripts/build-exercises.mjs — do not edit by hand.\n// Source: ExerciseDB open dataset (github.com/hasaneyldrm/exercises-dataset).\n// ${catalog.length} exercises. Regenerate with: node scripts/build-exercises.mjs\n`;
const body =
  header +
  '\nexport const CATALOG = ' +
  JSON.stringify(catalog) +
  ';\n\nexport const LEGACY_ALIASES = ' +
  JSON.stringify(legacyAliases) +
  ';\n';

fs.writeFileSync(OUT, body);

console.log('\nWrote', path.relative(path.join(HERE, '..'), OUT));
console.log('Total catalog:', catalog.length, '(incl.', RETAINED.length, 'retained legacy)');
console.log('Aliases:', Object.keys(legacyAliases).length);
console.log('Muscle distribution:', byMuscle);
console.log('Hebrew coverage — full:', coverage.full, 'partial:', coverage.partial, 'no-head(→english):', coverage.none);
console.log('Steps without Hebrew translation (left English):', stepsMissing);
console.log('Output size:', (body.length / 1024 / 1024).toFixed(2), 'MB');
