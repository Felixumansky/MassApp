const SYNC_COLLECTIONS = [
  'workouts',
  'routines',
  'bodyWeights',
  'customExercises',
  'meals',
  'waterLogs',
  'customFoods',
];

/**
 * Keep local items that are missing from the server response.
 *
 * This covers both a write that was still in flight during the initial pull
 * and a recoverable local cache that predates a stale/incomplete server state.
 * Explicit tombstones still win, so deleted items are never resurrected.
 */
export function mergeLocalStateIntoServer(serverState, localState) {
  const server = serverState && typeof serverState === 'object' ? serverState : {};
  const local = localState && typeof localState === 'object' ? localState : {};
  const deletedIds = new Set([...(server.deletedIds || []), ...(local.deletedIds || [])]);
  const next = { ...server };

  for (const key of SYNC_COLLECTIONS) {
    const serverItems = Array.isArray(server[key]) ? server[key] : [];
    const serverIds = new Set(serverItems.map((item) => item?.id).filter(Boolean));
    const localMissing = (Array.isArray(local[key]) ? local[key] : []).filter(
      (item) => item?.id && !serverIds.has(item.id) && !deletedIds.has(item.id)
    );

    next[key] = [...serverItems, ...localMissing].filter((item) => !deletedIds.has(item?.id));
  }

  next.deletedIds = [...deletedIds].slice(-1000);
  return next;
}
