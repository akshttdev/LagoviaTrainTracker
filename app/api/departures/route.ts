/**
 * GET /api/departures?q=<substring>
 * Thin HTTP wrapper: validate the input contract, delegate to the core, shape errors.
 * All real work lives in lib/ — this handler stays trivial on purpose.
 */
import { MIN_QUERY_LENGTH } from "@/lib/config";
import { searchDepartures } from "@/lib/departures";
import type { ErrorResponse } from "@/lib/types";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  // Input contract: reject < 3 chars BEFORE making any upstream call.
  if (q.length < MIN_QUERY_LENGTH) {
    const body: ErrorResponse = {
      error: "query_too_short",
      message: `Query must be at least ${MIN_QUERY_LENGTH} characters.`,
      minLength: MIN_QUERY_LENGTH,
      received: q.length,
    };
    return Response.json(body, { status: 400 });
  }

  try {
    const data = await searchDepartures(q);
    return Response.json(data);
  } catch {
    // The station list itself was unreachable — nothing we can return.
    const body: ErrorResponse = {
      error: "upstream_unavailable",
      message: "Could not reach the rail data source. Please try again.",
    };
    return Response.json(body, { status: 502 });
  }
}
