// המודול התזונתי מוגבל בכוונה למשתמש יחיד בשלב זה (בטא פרטית).
// כדי לפתוח אותו למשתמשים נוספים – הוסיפו כאן אימיילים או החליפו בבדיקת הרשאה אמיתית.
const ALLOWED_NUTRITION_EMAILS = ['felix.um86@gmail.com'];

/** האם למשתמש הנתון מותר לגשת למודול התזונה. */
export function canUseNutrition(user) {
  const email = user?.email?.trim().toLowerCase();
  return !!email && ALLOWED_NUTRITION_EMAILS.includes(email);
}
