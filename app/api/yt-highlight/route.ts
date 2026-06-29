import { NextRequest, NextResponse } from "next/server";

/** Convert MM/DD/YYYY + HH:MM (EDT = UTC−4) to RFC 3339 UTC string without ms.
 *  e.g. "06/28/2026" + "15:00" → "2026-06-28T19:00:00Z" */
function toUtcIso(date: string, time: string): string | null {
  const [mm, dd, yyyy] = date.split("/").map(Number);
  const [hh, mi]       = time.split(":").map(Number);
  if (!yyyy || isNaN(hh)) return null;
  return new Date(Date.UTC(yyyy, mm - 1, dd, hh + 4, mi))
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z"); // strip milliseconds → "...T19:00:00Z"
}

export async function GET(req: NextRequest) {
  const p    = req.nextUrl.searchParams;
  const home = p.get("home") ?? "";
  const away = p.get("away") ?? "";
  const date = p.get("date") ?? "";
  const time = p.get("time") ?? "";

  const apiKey    = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_TSN_CHANNEL_ID;

  if (!apiKey || !channelId) {
    return NextResponse.json({ error: "Missing API config" }, { status: 500 });
  }
  if (!home || !away) {
    return NextResponse.json({ url: null });
  }

  const q = `${home} ${away} Full Highlights FIFA World Cup 2026`;
  const params = new URLSearchParams({
    part:              "snippet",
    type:              "video",
    channelId,
    q,
    order:             "date",
    maxResults:        "5",
    regionCode:        "CA",
    relevanceLanguage: "en",
    key:               apiKey,
  });

  const publishedAfter = date && time ? toUtcIso(date, time) : null;
  if (publishedAfter) params.set("publishedAfter", publishedAfter);

  const ytUrl = `https://www.googleapis.com/youtube/v3/search?${params}`;
  console.log("[yt-highlight] GET", ytUrl.replace(apiKey, "***"));

  const ytRes = await fetch(ytUrl, { next: { revalidate: 3600 } });

  if (!ytRes.ok) {
    const err = await ytRes.json().catch(() => ({}));
    return NextResponse.json({ error: err }, { status: ytRes.status });
  }

  const data = await ytRes.json();
  const videoId: string | undefined = data.items?.[0]?.id?.videoId;

  return NextResponse.json(
    { url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null },
    { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=300" } }
  );
}
