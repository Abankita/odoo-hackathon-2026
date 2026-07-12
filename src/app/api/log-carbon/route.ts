import { NextResponse } from "next/server";
import { createCarbonTransactionWithAutoCalc } from "@/lib/eco-data";

export async function POST(request: Request) {
  const body = await request.json();
  const transaction = await createCarbonTransactionWithAutoCalc({
    departmentId: Number(body.departmentId),
    sourceType: String(body.sourceType),
    quantity: Number(body.quantity),
    date: body.date ? new Date(body.date) : new Date(),
    autoCalculated: true
  });

  return NextResponse.json(transaction);
}
