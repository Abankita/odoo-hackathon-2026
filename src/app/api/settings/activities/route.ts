import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const activity = await prisma.cSRActivity.create({
      data: {
        title: String(body.title),
        description: String(body.description),
        categoryId: Number(body.categoryId),
        evidenceRequired: Boolean(body.evidenceRequired),
        date: new Date(body.date),
        status: String(body.status)
      }
    });
    return NextResponse.json(activity);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create activity" }, { status: 500 });
  }
}
