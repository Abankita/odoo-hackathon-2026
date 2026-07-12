import { NextResponse } from "next/server";
import { completeChallengeParticipation } from "@/lib/eco-data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const participationId = Number(body.participationId);
    
    if (isNaN(participationId)) {
      return NextResponse.json({ error: "Invalid participation ID" }, { status: 400 });
    }

    const result = await completeChallengeParticipation(participationId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
