import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Background buzz for the rest timer.
 *
 * `navigator.vibrate` and JS `setInterval` are frozen once the app is backgrounded
 * or the phone is locked, so the in-app buzz never fires when you leave the app.
 * The OS, however, will deliver a scheduled local notification (with vibration +
 * sound) at an exact wall-clock time regardless of app state — so when the timer
 * is about to run in the background we hand the finish buzz off to the OS.
 */

const REST_ID = 4201;

export const isNative = Capacitor.isNativePlatform();

let permissionAsked = false;

async function ensurePermission() {
  if (!isNative) return false;
  try {
    let { display } = await LocalNotifications.checkPermissions();
    if (display === 'prompt' || display === 'prompt-with-rationale') {
      if (permissionAsked) return false;
      permissionAsked = true;
      ({ display } = await LocalNotifications.requestPermissions());
    }
    return display === 'granted';
  } catch {
    return false;
  }
}

/**
 * Schedule the OS to buzz at `atMs` (epoch ms). Returns true only if a native
 * notification was actually scheduled, so the caller can decide whether the OS
 * already owns the finish buzz.
 */
export async function scheduleRestEnd(atMs) {
  if (!isNative) return false;
  try {
    if (!(await ensurePermission())) return false;
    await LocalNotifications.cancel({ notifications: [{ id: REST_ID }] });
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REST_ID,
          title: 'המנוחה הסתיימה',
          body: 'זמן לסט הבא 💪',
          schedule: { at: new Date(atMs), allowWhileIdle: true },
          sound: 'default',
        },
      ],
    });
    return true;
  } catch {
    return false;
  }
}

export async function cancelRestEnd() {
  if (!isNative) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: REST_ID }] });
  } catch {
    /* no-op */
  }
}
