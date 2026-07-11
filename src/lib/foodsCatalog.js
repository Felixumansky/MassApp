/* קטלוג מאכלים ישראלי מובנה — ערכים תזונתיים ל-100 גרם (או 100 מ"ל למשקאות).
   defaultAmount = מנה טיפוסית בגרמים, unit = איך טבעי להזין את הכמות.
   הערכים מעוגלים ומבוססים על טבלאות תזונה מקובלות — הערכה, לא מדע מדויק. */

export const FOODS_CATALOG = [
  // ── חלבונים ──
  { id: 'chicken-breast', name: 'חזה עוף בגריל', caloriesPer100: 165, proteinPer100: 31, carbsPer100: 0, fatPer100: 3.6, defaultAmount: 150, unit: 'גרם' },
  { id: 'chicken-thigh', name: 'פרגית (ירך עוף)', caloriesPer100: 209, proteinPer100: 26, carbsPer100: 0, fatPer100: 11, defaultAmount: 150, unit: 'גרם' },
  { id: 'schnitzel', name: 'שניצל עוף מטוגן', caloriesPer100: 250, proteinPer100: 19, carbsPer100: 14, fatPer100: 13, defaultAmount: 150, unit: 'גרם' },
  { id: 'ground-beef', name: 'בשר בקר טחון (15% שומן)', caloriesPer100: 250, proteinPer100: 26, carbsPer100: 0, fatPer100: 15, defaultAmount: 150, unit: 'גרם' },
  { id: 'entrecote', name: 'סטייק אנטריקוט', caloriesPer100: 290, proteinPer100: 24, carbsPer100: 0, fatPer100: 21, defaultAmount: 200, unit: 'גרם' },
  { id: 'salmon', name: 'סלמון אפוי', caloriesPer100: 208, proteinPer100: 20, carbsPer100: 0, fatPer100: 13, defaultAmount: 150, unit: 'גרם' },
  { id: 'tuna-can', name: 'טונה בשמן (מסונן)', caloriesPer100: 190, proteinPer100: 27, carbsPer100: 0, fatPer100: 9, defaultAmount: 110, unit: 'גרם' },
  { id: 'tuna-water', name: 'טונה במים', caloriesPer100: 116, proteinPer100: 26, carbsPer100: 0, fatPer100: 1, defaultAmount: 110, unit: 'גרם' },
  { id: 'egg', name: 'ביצה קשה/מטוגנת', caloriesPer100: 155, proteinPer100: 13, carbsPer100: 1, fatPer100: 11, defaultAmount: 55, unit: 'יחידה' },
  { id: 'egg-white', name: 'חלבון ביצה', caloriesPer100: 52, proteinPer100: 11, carbsPer100: 0.7, fatPer100: 0.2, defaultAmount: 33, unit: 'יחידה' },
  { id: 'tofu', name: 'טופו', caloriesPer100: 76, proteinPer100: 8, carbsPer100: 1.9, fatPer100: 4.8, defaultAmount: 150, unit: 'גרם' },
  { id: 'turkey-breast', name: 'חזה הודו', caloriesPer100: 135, proteinPer100: 29, carbsPer100: 0, fatPer100: 1.7, defaultAmount: 150, unit: 'גרם' },
  { id: 'denis', name: 'דג דניס אפוי', caloriesPer100: 135, proteinPer100: 21, carbsPer100: 0, fatPer100: 5, defaultAmount: 200, unit: 'גרם' },
  { id: 'kebab', name: 'קבב', caloriesPer100: 280, proteinPer100: 18, carbsPer100: 4, fatPer100: 21, defaultAmount: 100, unit: 'גרם' },
  { id: 'shawarma', name: 'שווארמה', caloriesPer100: 250, proteinPer100: 22, carbsPer100: 2, fatPer100: 17, defaultAmount: 150, unit: 'גרם' },

  // ── מוצרי חלב ──
  { id: 'cottage-5', name: 'קוטג׳ 5%', caloriesPer100: 105, proteinPer100: 11, carbsPer100: 3.5, fatPer100: 5, defaultAmount: 125, unit: 'גרם' },
  { id: 'white-cheese-5', name: 'גבינה לבנה 5%', caloriesPer100: 95, proteinPer100: 9, carbsPer100: 3.5, fatPer100: 5, defaultAmount: 100, unit: 'גרם' },
  { id: 'yellow-cheese', name: 'גבינה צהובה', caloriesPer100: 350, proteinPer100: 25, carbsPer100: 1, fatPer100: 27, defaultAmount: 25, unit: 'פרוסה' },
  { id: 'yogurt-pro', name: 'יוגורט חלבון (Pro/Go)', caloriesPer100: 60, proteinPer100: 10, carbsPer100: 4, fatPer100: 0.5, defaultAmount: 200, unit: 'גרם' },
  { id: 'yogurt-plain', name: 'יוגורט טבעי 3%', caloriesPer100: 63, proteinPer100: 4.5, carbsPer100: 5, fatPer100: 3, defaultAmount: 150, unit: 'גרם' },
  { id: 'greek-yogurt', name: 'יוגורט יווני', caloriesPer100: 120, proteinPer100: 8, carbsPer100: 4.5, fatPer100: 8, defaultAmount: 150, unit: 'גרם' },
  { id: 'milk-3', name: 'חלב 3%', caloriesPer100: 60, proteinPer100: 3.3, carbsPer100: 4.8, fatPer100: 3, defaultAmount: 240, unit: 'כוס' },
  { id: 'milk-1', name: 'חלב 1%', caloriesPer100: 42, proteinPer100: 3.4, carbsPer100: 5, fatPer100: 1, defaultAmount: 240, unit: 'כוס' },
  { id: 'bulgarian-cheese', name: 'גבינה בולגרית 5%', caloriesPer100: 90, proteinPer100: 12, carbsPer100: 2.5, fatPer100: 3.5, defaultAmount: 30, unit: 'גרם' },

  // ── פחמימות ──
  { id: 'rice-white', name: 'אורז לבן מבושל', caloriesPer100: 130, proteinPer100: 2.7, carbsPer100: 28, fatPer100: 0.3, defaultAmount: 180, unit: 'גרם' },
  { id: 'rice-full', name: 'אורז מלא מבושל', caloriesPer100: 111, proteinPer100: 2.6, carbsPer100: 23, fatPer100: 0.9, defaultAmount: 180, unit: 'גרם' },
  { id: 'pasta', name: 'פסטה מבושלת', caloriesPer100: 131, proteinPer100: 5, carbsPer100: 25, fatPer100: 1.1, defaultAmount: 200, unit: 'גרם' },
  { id: 'potato', name: 'תפוח אדמה אפוי/מבושל', caloriesPer100: 87, proteinPer100: 2, carbsPer100: 20, fatPer100: 0.1, defaultAmount: 200, unit: 'גרם' },
  { id: 'sweet-potato', name: 'בטטה אפויה', caloriesPer100: 90, proteinPer100: 2, carbsPer100: 21, fatPer100: 0.1, defaultAmount: 200, unit: 'גרם' },
  { id: 'quinoa', name: 'קינואה מבושלת', caloriesPer100: 120, proteinPer100: 4.4, carbsPer100: 21, fatPer100: 1.9, defaultAmount: 180, unit: 'גרם' },
  { id: 'couscous', name: 'קוסקוס מבושל', caloriesPer100: 112, proteinPer100: 3.8, carbsPer100: 23, fatPer100: 0.2, defaultAmount: 180, unit: 'גרם' },
  { id: 'bread-white', name: 'לחם לבן', caloriesPer100: 265, proteinPer100: 9, carbsPer100: 49, fatPer100: 3.2, defaultAmount: 30, unit: 'פרוסה' },
  { id: 'bread-whole', name: 'לחם מלא', caloriesPer100: 247, proteinPer100: 13, carbsPer100: 41, fatPer100: 3.4, defaultAmount: 35, unit: 'פרוסה' },
  { id: 'pita', name: 'פיתה', caloriesPer100: 275, proteinPer100: 9, carbsPer100: 55, fatPer100: 1.2, defaultAmount: 80, unit: 'יחידה' },
  { id: 'baguette', name: 'באגט/לחמנייה', caloriesPer100: 270, proteinPer100: 9, carbsPer100: 52, fatPer100: 3, defaultAmount: 90, unit: 'יחידה' },
  { id: 'oats', name: 'שיבולת שועל (יבש)', caloriesPer100: 389, proteinPer100: 17, carbsPer100: 66, fatPer100: 7, defaultAmount: 50, unit: 'גרם' },
  { id: 'granola', name: 'גרנולה', caloriesPer100: 471, proteinPer100: 10, carbsPer100: 64, fatPer100: 20, defaultAmount: 50, unit: 'גרם' },
  { id: 'cornflakes', name: 'קורנפלקס', caloriesPer100: 357, proteinPer100: 7.5, carbsPer100: 84, fatPer100: 0.4, defaultAmount: 40, unit: 'גרם' },
  { id: 'ptitim', name: 'פתיתים מבושלים', caloriesPer100: 150, proteinPer100: 5, carbsPer100: 30, fatPer100: 0.5, defaultAmount: 180, unit: 'גרם' },
  { id: 'burekas', name: 'בורקס גבינה', caloriesPer100: 380, proteinPer100: 8, carbsPer100: 38, fatPer100: 22, defaultAmount: 100, unit: 'יחידה' },

  // ── קטניות ──
  { id: 'hummus-spread', name: 'חומוס (ממרח)', caloriesPer100: 250, proteinPer100: 8, carbsPer100: 20, fatPer100: 15, defaultAmount: 100, unit: 'גרם' },
  { id: 'chickpeas', name: 'גרגירי חומוס מבושלים', caloriesPer100: 164, proteinPer100: 9, carbsPer100: 27, fatPer100: 2.6, defaultAmount: 150, unit: 'גרם' },
  { id: 'lentils', name: 'עדשים מבושלות', caloriesPer100: 116, proteinPer100: 9, carbsPer100: 20, fatPer100: 0.4, defaultAmount: 180, unit: 'גרם' },
  { id: 'beans', name: 'שעועית לבנה מבושלת', caloriesPer100: 139, proteinPer100: 9, carbsPer100: 25, fatPer100: 0.5, defaultAmount: 180, unit: 'גרם' },
  { id: 'falafel', name: 'פלאפל (כדור)', caloriesPer100: 333, proteinPer100: 13, carbsPer100: 31, fatPer100: 18, defaultAmount: 17, unit: 'יחידה' },
  { id: 'edamame', name: 'אדממה', caloriesPer100: 121, proteinPer100: 11, carbsPer100: 9, fatPer100: 5, defaultAmount: 100, unit: 'גרם' },

  // ── ירקות ──
  { id: 'salad-veg', name: 'סלט ירקות (ללא רוטב)', caloriesPer100: 25, proteinPer100: 1.2, carbsPer100: 5, fatPer100: 0.2, defaultAmount: 200, unit: 'גרם' },
  { id: 'tomato', name: 'עגבנייה', caloriesPer100: 18, proteinPer100: 0.9, carbsPer100: 3.9, fatPer100: 0.2, defaultAmount: 120, unit: 'יחידה' },
  { id: 'cucumber', name: 'מלפפון', caloriesPer100: 15, proteinPer100: 0.7, carbsPer100: 3.6, fatPer100: 0.1, defaultAmount: 100, unit: 'יחידה' },
  { id: 'carrot', name: 'גזר', caloriesPer100: 41, proteinPer100: 0.9, carbsPer100: 10, fatPer100: 0.2, defaultAmount: 60, unit: 'יחידה' },
  { id: 'pepper', name: 'פלפל', caloriesPer100: 31, proteinPer100: 1, carbsPer100: 6, fatPer100: 0.3, defaultAmount: 120, unit: 'יחידה' },
  { id: 'broccoli', name: 'ברוקולי מבושל', caloriesPer100: 35, proteinPer100: 2.4, carbsPer100: 7, fatPer100: 0.4, defaultAmount: 150, unit: 'גרם' },
  { id: 'green-beans', name: 'שעועית ירוקה', caloriesPer100: 31, proteinPer100: 1.8, carbsPer100: 7, fatPer100: 0.2, defaultAmount: 150, unit: 'גרם' },
  { id: 'corn', name: 'תירס', caloriesPer100: 96, proteinPer100: 3.4, carbsPer100: 21, fatPer100: 1.5, defaultAmount: 100, unit: 'גרם' },

  // ── פירות ──
  { id: 'banana', name: 'בננה', caloriesPer100: 89, proteinPer100: 1.1, carbsPer100: 23, fatPer100: 0.3, defaultAmount: 120, unit: 'יחידה' },
  { id: 'apple', name: 'תפוח', caloriesPer100: 52, proteinPer100: 0.3, carbsPer100: 14, fatPer100: 0.2, defaultAmount: 180, unit: 'יחידה' },
  { id: 'orange', name: 'תפוז', caloriesPer100: 47, proteinPer100: 0.9, carbsPer100: 12, fatPer100: 0.1, defaultAmount: 170, unit: 'יחידה' },
  { id: 'grapes', name: 'ענבים', caloriesPer100: 69, proteinPer100: 0.7, carbsPer100: 18, fatPer100: 0.2, defaultAmount: 150, unit: 'גרם' },
  { id: 'watermelon', name: 'אבטיח', caloriesPer100: 30, proteinPer100: 0.6, carbsPer100: 8, fatPer100: 0.2, defaultAmount: 300, unit: 'גרם' },
  { id: 'melon', name: 'מלון', caloriesPer100: 34, proteinPer100: 0.8, carbsPer100: 8, fatPer100: 0.2, defaultAmount: 300, unit: 'גרם' },
  { id: 'dates', name: 'תמר מג׳הול', caloriesPer100: 277, proteinPer100: 1.8, carbsPer100: 75, fatPer100: 0.2, defaultAmount: 24, unit: 'יחידה' },
  { id: 'avocado', name: 'אבוקדו', caloriesPer100: 160, proteinPer100: 2, carbsPer100: 9, fatPer100: 15, defaultAmount: 100, unit: 'גרם' },
  { id: 'strawberries', name: 'תותים', caloriesPer100: 32, proteinPer100: 0.7, carbsPer100: 8, fatPer100: 0.3, defaultAmount: 150, unit: 'גרם' },

  // ── שומנים, אגוזים וממרחים ──
  { id: 'olive-oil', name: 'שמן זית', caloriesPer100: 884, proteinPer100: 0, carbsPer100: 0, fatPer100: 100, defaultAmount: 14, unit: 'כף' },
  { id: 'tahini', name: 'טחינה גולמית', caloriesPer100: 595, proteinPer100: 17, carbsPer100: 21, fatPer100: 54, defaultAmount: 15, unit: 'כף' },
  { id: 'tahini-ready', name: 'טחינה מוכנה', caloriesPer100: 280, proteinPer100: 8, carbsPer100: 12, fatPer100: 24, defaultAmount: 30, unit: 'כף' },
  { id: 'peanut-butter', name: 'חמאת בוטנים', caloriesPer100: 588, proteinPer100: 25, carbsPer100: 20, fatPer100: 50, defaultAmount: 16, unit: 'כף' },
  { id: 'almonds', name: 'שקדים', caloriesPer100: 579, proteinPer100: 21, carbsPer100: 22, fatPer100: 50, defaultAmount: 30, unit: 'גרם' },
  { id: 'walnuts', name: 'אגוזי מלך', caloriesPer100: 654, proteinPer100: 15, carbsPer100: 14, fatPer100: 65, defaultAmount: 30, unit: 'גרם' },
  { id: 'peanuts', name: 'בוטנים', caloriesPer100: 567, proteinPer100: 26, carbsPer100: 16, fatPer100: 49, defaultAmount: 30, unit: 'גרם' },
  { id: 'butter', name: 'חמאה', caloriesPer100: 717, proteinPer100: 0.9, carbsPer100: 0.1, fatPer100: 81, defaultAmount: 10, unit: 'כפית' },
  { id: 'olives', name: 'זיתים', caloriesPer100: 115, proteinPer100: 0.8, carbsPer100: 6, fatPer100: 11, defaultAmount: 30, unit: 'גרם' },

  // ── מנות מוכנות ──
  { id: 'pizza-slice', name: 'פיצה (משולש)', caloriesPer100: 266, proteinPer100: 11, carbsPer100: 33, fatPer100: 10, defaultAmount: 120, unit: 'משולש' },
  { id: 'hamburger', name: 'המבורגר בלחמנייה', caloriesPer100: 254, proteinPer100: 13, carbsPer100: 24, fatPer100: 12, defaultAmount: 250, unit: 'יחידה' },
  { id: 'sushi-roll', name: 'סושי (רול 8 יח׳)', caloriesPer100: 150, proteinPer100: 6, carbsPer100: 26, fatPer100: 2.5, defaultAmount: 250, unit: 'רול' },
  { id: 'shakshuka', name: 'שקשוקה (2 ביצים)', caloriesPer100: 105, proteinPer100: 6, carbsPer100: 5, fatPer100: 7, defaultAmount: 300, unit: 'מנה' },
  { id: 'jachnun', name: 'ג׳חנון', caloriesPer100: 370, proteinPer100: 6, carbsPer100: 44, fatPer100: 19, defaultAmount: 150, unit: 'יחידה' },
  { id: 'majadra', name: 'מג׳דרה', caloriesPer100: 140, proteinPer100: 5, carbsPer100: 24, fatPer100: 2.5, defaultAmount: 250, unit: 'מנה' },
  { id: 'soup-veg', name: 'מרק ירקות', caloriesPer100: 40, proteinPer100: 1.5, carbsPer100: 7, fatPer100: 0.8, defaultAmount: 300, unit: 'קערה' },
  { id: 'meatballs', name: 'קציצות בשר ברוטב', caloriesPer100: 190, proteinPer100: 15, carbsPer100: 7, fatPer100: 11, defaultAmount: 200, unit: 'מנה' },

  // ── חטיפים ומתוקים ──
  { id: 'protein-bar', name: 'חטיף חלבון', caloriesPer100: 350, proteinPer100: 33, carbsPer100: 30, fatPer100: 11, defaultAmount: 60, unit: 'יחידה' },
  { id: 'protein-shake', name: 'שייק חלבון (סקופ + מים)', caloriesPer100: 380, proteinPer100: 75, carbsPer100: 8, fatPer100: 5, defaultAmount: 32, unit: 'סקופ' },
  { id: 'chocolate', name: 'שוקולד חלב', caloriesPer100: 535, proteinPer100: 8, carbsPer100: 59, fatPer100: 30, defaultAmount: 20, unit: 'שורה' },
  { id: 'bamba', name: 'במבה', caloriesPer100: 535, proteinPer100: 14, carbsPer100: 44, fatPer100: 34, defaultAmount: 25, unit: 'שקית' },
  { id: 'bisli', name: 'ביסלי', caloriesPer100: 480, proteinPer100: 9, carbsPer100: 62, fatPer100: 22, defaultAmount: 35, unit: 'שקית' },
  { id: 'pretzels', name: 'בייגלה', caloriesPer100: 380, proteinPer100: 10, carbsPer100: 79, fatPer100: 3, defaultAmount: 30, unit: 'גרם' },
  { id: 'cookie', name: 'עוגייה', caloriesPer100: 480, proteinPer100: 5, carbsPer100: 65, fatPer100: 22, defaultAmount: 15, unit: 'יחידה' },
  { id: 'ice-cream', name: 'גלידה', caloriesPer100: 207, proteinPer100: 3.5, carbsPer100: 24, fatPer100: 11, defaultAmount: 100, unit: 'גרם' },
  { id: 'rice-cakes', name: 'פריכיות אורז', caloriesPer100: 387, proteinPer100: 8, carbsPer100: 82, fatPer100: 2.8, defaultAmount: 9, unit: 'יחידה' },

  // ── משקאות ──
  { id: 'orange-juice', name: 'מיץ תפוזים', caloriesPer100: 45, proteinPer100: 0.7, carbsPer100: 10, fatPer100: 0.2, defaultAmount: 240, unit: 'כוס' },
  { id: 'cola', name: 'קולה', caloriesPer100: 42, proteinPer100: 0, carbsPer100: 10.6, fatPer100: 0, defaultAmount: 330, unit: 'פחית' },
  { id: 'beer', name: 'בירה', caloriesPer100: 43, proteinPer100: 0.5, carbsPer100: 3.6, fatPer100: 0, defaultAmount: 330, unit: 'בקבוק' },
  { id: 'wine', name: 'יין אדום', caloriesPer100: 85, proteinPer100: 0.1, carbsPer100: 2.6, fatPer100: 0, defaultAmount: 150, unit: 'כוס' },
  { id: 'cappuccino', name: 'קפה הפוך', caloriesPer100: 45, proteinPer100: 2.5, carbsPer100: 4, fatPer100: 2.2, defaultAmount: 200, unit: 'כוס' },
];

/** חישוב ערכים לפי כמות בפועל (הערכים בקטלוג הם ל-100 גרם/מ"ל). */
export function foodValues(food, amount) {
  const factor = (Number(amount) || 0) / 100;
  const r = (n) => Math.round(n * factor * 10) / 10;
  return {
    calories: Math.round(food.caloriesPer100 * factor),
    protein: r(food.proteinPer100),
    carbs: r(food.carbsPer100),
    fat: r(food.fatPer100),
  };
}

/** חיפוש פשוט בעברית בקטלוג + מאכלים מותאמים של המשתמש. */
export function searchFoods(query, customFoods = []) {
  const q = String(query || '').trim();
  const all = [...customFoods, ...FOODS_CATALOG];
  if (!q) return all;
  return all.filter((f) => f.name.includes(q));
}
