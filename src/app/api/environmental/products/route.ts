import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const profile = await prisma.productESGProfile.create({
      data: {
        productName: String(body.productName),
        departmentId: Number(body.departmentId),
        materialType: String(body.materialType),
        carbonFootprint: Number(body.carbonFootprint),
        recyclable: Boolean(body.recyclable)
      }
    });
    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create product ESG profile" }, { status: 500 });
  }
}
