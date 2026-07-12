import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { calcDepartmentScore } from "@/server/engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const config = await prisma.orgConfig.findFirst();
    if (!config) {
      return NextResponse.json({ error: "OrgConfig not found" }, { status: 404 });
    }

    const envWeight = Number(body.envWeight);
    const socialWeight = Number(body.socialWeight);
    const govWeight = Number(body.govWeight);

    if (envWeight + socialWeight + govWeight !== 100) {
      return NextResponse.json({ error: "Weights must sum to exactly 100" }, { status: 400 });
    }

    const updated = await prisma.orgConfig.update({
      where: { id: config.id },
      data: {
        envWeight,
        socialWeight,
        govWeight,
        autoEmissionCalc: Boolean(body.autoEmissionCalc),
        evidenceRequired: Boolean(body.evidenceRequired),
        badgeAutoAward: Boolean(body.badgeAutoAward),
        emailAlerts: Boolean(body.emailAlerts)
      }
    });

    // Weight change triggers recalculation of scores across all departments
    const departments = await prisma.department.findMany({ select: { id: true } });
    await Promise.all(departments.map((d) => calcDepartmentScore(d.id)));

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update configuration" }, { status: 500 });
  }
}
