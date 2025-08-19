import { aggregateUserLanguages } from "../../../lib/github";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = searchParams.get("username") || "";
    const username = raw.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 39);

    if (!username) {
      return new Response(JSON.stringify({ error: "username is required" }), { status: 400, headers: { "content-type": "application/json" } });
    }

    const { languages, totalEstimatedLines, totalCommittedLinesAll, totalCommittedLinesUser, repoCount } = await aggregateUserLanguages(username);

    return new Response(JSON.stringify({ username, languages, totalEstimatedLines, totalCommittedLinesAll, totalCommittedLinesUser, repoCount }), {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "failed" }), { status: 500, headers: { "content-type": "application/json" } });
  }
}
