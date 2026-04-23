import { NextResponse } from "next/server";
import { runBotTick } from "@/lib/bots/tick";

function isAuthorized(req: Request): boolean {
  const BOT_SECRET = process.env.BOT_TICK_SECRET;
  const CRON_SECRET = process.env.CRON_SECRET;

  const botSecret = req.headers.get("x-bot-secret");
  if (BOT_SECRET && botSecret === BOT_SECRET) return true;

  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) return true;

  return false;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const count: number = Math.min(Number(body.count) || 8, 30);
  const result = await runBotTick(count);
  return NextResponse.json(result);
}

export async function GET(req: Request) {
  const CRON_SECRET = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runBotTick(8);
  return NextResponse.json(result);
}
