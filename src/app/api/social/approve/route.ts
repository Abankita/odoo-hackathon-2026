import { NextResponse } from "next/server";
import { approveParticipationRecord } from "@/lib/eco-data";
import { prisma } from "@/server/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const participationId = Number(body.participationId);
    const action = String(body.action); // "approve" or "reject"

    if (isNaN(participationId)) {
      return NextResponse.json({ error: "Invalid participation ID" }, { status: 400 });
    }

    if (action === "approve") {
      const result = await approveParticipationRecord(participationId);
      return NextResponse.json(result);
    } else {
      // Reject
      const updated = await prisma.employeeParticipation.update({
        where: { id: participationId },
        data: { approvalStatus: "Rejected" }
      });
      return NextResponse.json({ success: true, record: updated });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process participation" }, { status: 500 });
  }
}
