import { useCallback, useEffect, useRef, useState } from 'react';

/* זיהוי דיבור בעברית דרך Web Speech API.
   נתמך בכרום/אנדרואיד וספארי חדשים; ב-iOS ישן אין תמיכה — supported=false
   והכפתור פשוט לא מוצג (יש fallback הקלדה). הזיהוי רץ בענן של הדפדפן. */

const Recognition =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export const speechSupported = !!Recognition;

const ERROR_MESSAGES = {
  'not-allowed': 'אין הרשאה למיקרופון. אפשרו גישה בהגדרות הדפדפן.',
  'no-speech': 'לא נקלט דיבור. נסו שוב ודברו ברור.',
  'audio-capture': 'לא נמצא מיקרופון במכשיר.',
  network: 'זיהוי הדיבור דורש חיבור לאינטרנט.',
};

export function useSpeech() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recRef = useRef(null);
  // interim results מגיעים מקוטעים — צוברים את החלקים הסופיים בנפרד.
  const finalRef = useRef('');

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    if (!Recognition || recRef.current) return;
    setError('');
    setTranscript('');
    finalRef.current = '';

    const rec = new Recognition();
    rec.lang = 'he-IL';
    rec.interimResults = true;
    rec.continuous = true;

    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current += chunk + ' ';
        else interim += chunk;
      }
      setTranscript((finalRef.current + interim).trim());
    };
    rec.onerror = (e) => {
      // 'aborted' נורה גם בעצירה יזומה — לא שגיאה אמיתית.
      if (e.error !== 'aborted') setError(ERROR_MESSAGES[e.error] || 'זיהוי הדיבור נכשל. נסו שוב.');
    };
    rec.onend = () => {
      recRef.current = null;
      setListening(false);
    };

    recRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      recRef.current = null;
      setListening(false);
      setError('זיהוי הדיבור נכשל. נסו שוב.');
    }
  }, []);

  // ניקוי כשעוזבים את המסך באמצע הקלטה
  useEffect(() => () => recRef.current?.abort(), []);

  return { supported: speechSupported, listening, transcript, error, start, stop, setTranscript };
}
