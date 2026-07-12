import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const employeeId = Number(body.employeeId);
    const activityId = Number(body.activityId);

    if (isNaN(employeeId) || isNaN(activityId)) {
      return NextResponse.json({ error: "Invalid employee or activity ID" }, { status: 400 });
    }

    // Join activity: create participation record in DB
    const participation = await prisma.employeeParticipation.create({
      data: {
        employeeId,
        activityId,
        proofUrl: body.proofUrl || null,
        approvalStatus: "Pending",
        pointsEarned: 15, // standard points awarded for CSR activity participation
        completionDate: new Date()
      }
    });

    return NextResponse.json(participation);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to join CSR activity" }, { status: 500 });
  }
}
