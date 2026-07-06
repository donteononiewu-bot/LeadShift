import { NextResponse, type NextRequest } from "next/server";
import { handleExternalIntake } from "@/lib/intake/external-intake";

export async function POST(request: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await handleExternalIntake({
    ingestKey: request.nextUrl.searchParams.get("key"),
    source: "zapier",
    payload,
  });

  return NextResponse.json(result.body, { status: result.status });
}
