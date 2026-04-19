import { fetchIntel } from "@/lib/intel/fetch";
import type { IntelSourceId } from "@/lib/intel/sources";

export const runtime = "nodejs";
export const revalidate = 1800;

const VALID_SOURCES: IntelSourceId[] = ["fca", "hmt", "ofsi", "global"];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limitParam = url.searchParams.get("limit");
  const sourceParam = url.searchParams.get("source");

  const limit = limitParam ? Math.min(50, Math.max(1, Number(limitParam) || 20)) : 20;
  const sourceIds = sourceParam
    ? (sourceParam.split(",").map((s) => s.trim()).filter((s): s is IntelSourceId =>
        (VALID_SOURCES as string[]).includes(s),
      ))
    : undefined;

  const result = await fetchIntel({ sourceIds, limit });

  return Response.json(result, {
    headers: { "cache-control": "public, s-maxage=1800, stale-while-revalidate=600" },
  });
}
