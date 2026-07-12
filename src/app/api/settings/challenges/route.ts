import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const challenge = await prisma.challenge.create({
      data: {
        title: String(body.title),
        description: String(body.description),
        categoryId: Number(body.categoryId),
        xp: Number(body.xp),
        difficulty: String(body.difficulty),
        evidenceRequired: Boolean(body.evidenceRequired),
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default deadline: 30 days from now
        status: String(body.status)
      }
    });
    return NextResponse.json(challenge);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create challenge" }, { status: 500 });
  }
}
