import { NextResponse } from "next/server";
import { createChallengeParticipation } from "@/lib/eco-data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const employeeId = Number(body.employeeId);
    const challengeId = Number(body.challengeId);

    if (isNaN(employeeId) || isNaN(challengeId)) {
      return NextResponse.json({ error: "Invalid employee or challenge ID" }, { status: 400 });
    }

    const record = await createChallengeParticipation(challengeId, employeeId);
    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to join challenge" }, { status: 500 });
  }
}
