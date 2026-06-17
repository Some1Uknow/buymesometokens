import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, requestIp } from "@/lib/rate-limit";
import { uploadBytes } from "@/lib/storage";

export const runtime = "nodejs";
const schema = z.object({ message: z.string().trim().min(1).max(280) });

export async function POST(request: Request) {
  try {
    if (!rateLimit(`message:${requestIp(request)}`, 10, 60 * 60_000)) return NextResponse.json({ error: "Message upload limit reached" }, { status: 429 });
    const { message } = schema.parse(await request.json());
    const stored = await uploadBytes(new TextEncoder().encode(message));
    return NextResponse.json(stored);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 });
  }
}
