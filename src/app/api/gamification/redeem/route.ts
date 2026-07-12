import { NextResponse } from "next/server";
import { redeemRewardForEmployee } from "@/lib/eco-data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const employeeId = Number(body.employeeId);
    const rewardId = Number(body.rewardId);

    if (isNaN(employeeId) || isNaN(rewardId)) {
      return NextResponse.json({ error: "Invalid employee or reward ID" }, { status: 400 });
    }

    const result = await redeemRewardForEmployee(employeeId, rewardId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to redeem reward" }, { status: 500 });
  }
}
