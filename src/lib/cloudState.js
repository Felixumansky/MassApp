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
 * Keep items created while the initial server pull was in flight.
 *
 * The server remains authoritative for the state that existed when the pull
 * started. A newly-created local item has an id that was not in that baseline,
 * so it can be safely merged back instead of being lost by replaceAll.
 */
export function mergeLocalAddsIntoServer(serverState, localState, pullBaseline) {
  const server = serverState && typeof serverState === 'object' ? serverState : {};
  const local = localState && typeof localState === 'object' ? localState : {};
  const baseline = pullBaseline && typeof pullBaseline === 'object' ? pullBaseline : {};
  const deletedIds = new Set([...(server.deletedIds || []), ...(local.deletedIds || [])]);
  const next = { ...server };

  for (const key of SYNC_COLLECTIONS) {
    const serverItems = Array.isArray(server[key]) ? server[key] : [];
    const serverIds = new Set(serverItems.map((item) => item?.id).filter(Boolean));
    const baselineIds = new Set(
      (Array.isArray(baseline[key]) ? baseline[key] : []).map((item) => item?.id).filter(Boolean)
    );
    const localAdds = (Array.isArray(local[key]) ? local[key] : []).filter(
      (item) => item?.id && !baselineIds.has(item.id) && !serverIds.has(item.id) && !deletedIds.has(item.id)
    );

    next[key] = [...serverItems, ...localAdds].filter((item) => !deletedIds.has(item?.id));
  }

  next.deletedIds = [...deletedIds].slice(-1000);
  return next;
}
