import { aggregateUserLanguages, fetchUserProfile, fetchWakaTimeHoursFromShare } from "../../../lib/github";
import { renderCardSvg } from "../../../lib/svg";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("username") || "";
  const username = raw.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 39);
  const theme = searchParams.get("theme") || "light";
  const variant = (searchParams.get("variant") as "legend" | "compact") || undefined;
  const title = searchParams.get("title") || undefined;
  const wakaShare = searchParams.get("wakatimeShare") || undefined;
  const wakaUser = searchParams.get("wakatimeUser") || username || undefined;
  const accent = searchParams.get("accent") || undefined;

  if (!username) {
    return new Response("username is required", { status: 400 });
  }

  try {
    const [agg, profile, wakaHours] = await Promise.all([
      aggregateUserLanguages(username),
      fetchUserProfile(username),
      wakaShare && wakaUser ? fetchWakaTimeHoursFromShare(wakaUser, wakaShare) : Promise.resolve(null)
    ]);
    const { languages, totalEstimatedLines, totalCommittedLinesAll, totalCommittedLinesUser, repoCount } = agg;

    const displayName = profile?.name || username;
    const svg = renderCardSvg({ username: displayName, languages, totalEstimatedLines, totalCommittedLinesAll, totalCommittedLinesUser, repoCount, theme, variant, title, wakatimeHours: wakaHours ?? undefined, accentHex: accent ?? undefined });
    return new Response(svg, {
      status: 200,
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "public, s-maxage=3600, stale-while-revalidate=1800"
      }
    });
  } catch (e: any) {
    const message = String(e?.message || e).replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return new Response(`<svg xmlns="http://www.w3.org/2000/svg" width="760" height="80"><rect width="100%" height="100%" fill="#fff"/><text x="16" y="48" fill="#ef4444" font-size="14">Error: ${message}</text></svg>`, {
      status: 500,
      headers: { "content-type": "image/svg+xml; charset=utf-8" }
    });
  }
}
