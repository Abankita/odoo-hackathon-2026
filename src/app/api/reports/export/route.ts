import { prisma } from "@/server/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const currentModule = url.searchParams.get("module") || "Summary";
  const departmentId = url.searchParams.get("departmentId") ? Number(url.searchParams.get("departmentId")) : null;
  const employeeId = url.searchParams.get("employeeId") ? Number(url.searchParams.get("employeeId")) : null;
  const challengeId = url.searchParams.get("challengeId") ? Number(url.searchParams.get("challengeId")) : null;
  const categoryId = url.searchParams.get("categoryId") ? Number(url.searchParams.get("categoryId")) : null;
  const startDate = url.searchParams.get("startDate") || null;
  const endDate = url.searchParams.get("endDate") || null;

  let headers: string[] = [];
  let rows: string[][] = [];

  if (currentModule === "Environmental") {
    headers = ["Date Logged", "Department", "Source Type", "Quantity", "Computed CO2 (kg)", "Auto Calculated"];
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (startDate || endDate) {
      where.date = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {})
      };
    }
    const data = await prisma.carbonTransaction.findMany({
      where,
      include: { department: true, emissionFactor: true },
      orderBy: { date: "desc" }
    });
    rows = data.map((r) => [
      new Date(r.date).toLocaleDateString(),
      r.department.name,
      r.sourceType,
      r.quantity.toString(),
      r.computedCO2.toString(),
      r.autoCalculated ? "AUTO" : "MANUAL"
    ]);
  } else if (currentModule === "Social") {
    headers = ["Date Logged", "Employee Name", "Department", "CSR Activity", "Points Earned", "Status"];
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (departmentId) where.employee = { departmentId };
    if (categoryId) where.activity = { categoryId };
    if (startDate || endDate) {
      where.completionDate = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {})
      };
    }
    const data = await prisma.employeeParticipation.findMany({
      where,
      include: { employee: { include: { department: true } }, activity: true },
      orderBy: { id: "desc" }
    });
    rows = data.map((r) => [
      r.completionDate ? new Date(r.completionDate).toLocaleDateString() : "Pending",
      r.employee.name,
      r.employee.department.name,
      r.activity.title,
      r.pointsEarned.toString(),
      r.approvalStatus
    ]);
  } else if (currentModule === "Governance") {
    headers = ["Due Date", "Description", "Severity", "Responsible Owner", "Status"];
    const where: any = {};
    if (employeeId) where.ownerId = employeeId;
    if (departmentId) where.audit = { departmentId };
    if (startDate || endDate) {
      where.dueDate = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {})
      };
    }
    const data = await prisma.complianceIssue.findMany({
      where,
      include: { owner: true },
      orderBy: { dueDate: "asc" }
    });
    rows = data.map((r) => [
      new Date(r.dueDate).toLocaleDateString(),
      r.description,
      r.severity,
      r.owner.name,
      r.status
    ]);
  } else if (currentModule === "Gamification") {
    headers = ["Challenge Title", "Employee Name", "Progress (%)", "XP Earned", "Status"];
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (challengeId) where.challengeId = challengeId;
    if (departmentId) where.employee = { departmentId };
    if (categoryId) where.challenge = { categoryId };
    const data = await prisma.challengeParticipation.findMany({
      where,
      include: { employee: true, challenge: true },
      orderBy: { id: "desc" }
    });
    rows = data.map((r) => [
      r.challenge.title,
      r.employee.name,
      r.progress.toString(),
      r.xpAwarded.toString(),
      r.approvalStatus
    ]);
  } else {
    // Summary
    headers = ["Date Scored", "Department", "Environmental Score", "Social Score", "Governance Score", "Total Score"];
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (startDate || endDate) {
      where.computedAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {})
      };
    }
    const data = await prisma.departmentScore.findMany({
      where,
      include: { department: true },
      orderBy: { computedAt: "desc" }
    });
    rows = data.map((r) => [
      new Date(r.computedAt).toLocaleDateString(),
      r.department.name,
      r.environmentalScore.toFixed(1),
      r.socialScore.toFixed(1),
      r.governanceScore.toFixed(1),
      r.totalScore.toFixed(1)
    ]);
  }

  // Convert array to CSV string
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=ecosphere-${currentModule.toLowerCase()}-report.csv`
    }
  });
}
