import { NextResponse } from "next/server";
import { flagOverdueIssues } from "@/server/engine";

export async function POST() {
  return NextResponse.json(await flagOverdueIssues());
}
