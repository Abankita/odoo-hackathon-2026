import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const department = await prisma.department.create({
      data: {
        name: String(body.name),
        code: String(body.code),
        head: String(body.head),
        employeeCount: Number(body.employeeCount),
        status: "Active"
      }
    });
    return NextResponse.json(department);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create department" }, { status: 500 });
  }
}
