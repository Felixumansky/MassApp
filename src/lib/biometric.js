// Local biometric gate via WebAuthn platform authenticator (fingerprint / face).
// No server verification — this proves user-presence + user-verification on THIS
// device, which is enough to unlock the locally-stored auth token.

const CRED_KEY = 'liftlog.biometric'; // { credentialId: base64url }

function bufToB64u(buf) {
  let bin = '';
  for (const b of new Uint8Array(buf)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64uToBuf(s) {
  const norm = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = norm.length % 4 ? '='.repeat(4 - (norm.length % 4)) : '';
  const bin = atob(norm + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

const challenge = () => crypto.getRandomValues(new Uint8Array(32));

/** Is a platform authenticator (built-in fingerprint/face) available? */
export async function biometricSupported() {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** Has the user already enrolled a credential on this device? */
export function biometricEnabled() {
  return !!localStorage.getItem(CRED_KEY);
}

/** Enroll a platform credential. Requires a user gesture. */
export async function registerBiometric(user) {
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge: challenge(),
      rp: { name: 'LiftLog', id: location.hostname },
      user: {
        id: new TextEncoder().encode(String(user?.id || user?.email || 'liftlog')),
        name: user?.email || 'liftlog',
        displayName: user?.email || 'LiftLog',
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
    },
  });
  if (!cred) throw new Error('רישום טביעת האצבע בוטל');
  localStorage.setItem(CRED_KEY, JSON.stringify({ credentialId: bufToB64u(cred.rawId) }));
  return true;
}

/** Prompt for biometric verification against the enrolled credential. */
export async function verifyBiometric() {
  const raw = localStorage.getItem(CRED_KEY);
  if (!raw) throw new Error('לא הוגדרה כניסה בטביעת אצבע');
  const { credentialId } = JSON.parse(raw);
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: challenge(),
      allowCredentials: [{ type: 'public-key', id: b64uToBuf(credentialId) }],
      userVerification: 'required',
      timeout: 60000,
    },
  });
  if (!assertion) throw new Error('האימות נכשל');
  return true;
}

export function disableBiometric() {
  localStorage.removeItem(CRED_KEY);
}
