export const GYM_AUTO_START_LAST_KEY = 'massapp.gymAutoStart.lastTriggeredAt';
export const GYM_AUTO_START_COOLDOWN_MS = 6 * 60 * 60 * 1000;

const EARTH_RADIUS_M = 6371000;

function toRadians(value) {
  return (Number(value) * Math.PI) / 180;
}

export function hasGymLocation(config) {
  if (config?.latitude === '' || config?.longitude === '' || config?.latitude == null || config?.longitude == null) {
    return false;
  }
  return Number.isFinite(Number(config.latitude)) && Number.isFinite(Number(config.longitude));
}

export function distanceMeters(a, b) {
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function isInsideGymRadius(position, config) {
  if (!hasGymLocation(config)) return false;
  const radiusM = Math.max(30, Number(config.radiusM) || 120);
  return distanceMeters(position, { latitude: Number(config.latitude), longitude: Number(config.longitude) }) <= radiusM;
}

export function getGymAutoStartLastTriggered() {
  try {
    return Number(localStorage.getItem(GYM_AUTO_START_LAST_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function setGymAutoStartLastTriggered(value = Date.now()) {
  try {
    localStorage.setItem(GYM_AUTO_START_LAST_KEY, String(value));
  } catch {
    /* private mode */
  }
}

export function canTriggerGymAutoStart(now = Date.now(), last = getGymAutoStartLastTriggered()) {
  return now - last >= GYM_AUTO_START_COOLDOWN_MS;
}
