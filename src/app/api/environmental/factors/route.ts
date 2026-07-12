import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const factor = await prisma.emissionFactor.create({
      data: {
        sourceType: String(body.sourceType),
        unit: String(body.unit),
        co2PerUnit: Number(body.co2PerUnit)
      }
    });
    return NextResponse.json(factor);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create emission factor" }, { status: 500 });
  }
}
