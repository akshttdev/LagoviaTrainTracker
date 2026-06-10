/**
 * A tiny concurrency-limited map. Runs `fn` over `items` with at most `limit`
 * promises in flight at any moment — this is how we respect iRail's 3 req/s
 * limit during the per-station fan-out instead of firing all calls at once.
 *
 * Results preserve input order. Errors are NOT swallowed here — the caller wraps
 * `fn` in try/catch so one failing station doesn't kill the batch.
 */
export async function pooledMap<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }

  const size = Math.min(Math.max(1, limit), items.length || 1);
  await Promise.all(Array.from({ length: size }, worker));
  return results;
}
