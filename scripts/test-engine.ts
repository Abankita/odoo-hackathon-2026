import {
  autoCalculateEmission,
  calcDepartmentScore,
  calcEnvironmentalScore,
  calcGovernanceScore,
  calcOverallESGScore,
  calcSocialScore,
  canApproveParticipation,
  checkBadgeUnlocks,
  flagOverdueIssues,
  redeemReward
} from "@/server/engine";
import { prisma } from "@/server/prisma";

async function main() {
  const departments = await prisma.department.findMany({ orderBy: { id: "asc" } });

  console.log("\n=== Department score breakdown ===");
  const rows: Array<Record<string, string | number>> = [];

  for (const department of departments) {
    const [environmentalScore, socialScore, governanceScore, departmentScore] = await Promise.all([
      calcEnvironmentalScore(department.id),
      calcSocialScore(department.id),
      calcGovernanceScore(department.id),
      calcDepartmentScore(department.id)
    ]);

    rows.push({
      Department: department.name,
      Environmental: environmentalScore.toFixed(2),
      Social: socialScore.toFixed(2),
      Governance: governanceScore.toFixed(2),
      Total: departmentScore.totalScore.toFixed(2)
    });
  }

  console.table(rows);

  const overall = await calcOverallESGScore();
  console.log(`Overall ESG score: ${overall.toFixed(2)}`);

  const emissionPreview = await autoCalculateEmission({ sourceType: "Diesel", quantity: 50, departmentId: departments[0]?.id });
  console.log("\n=== autoCalculateEmission preview ===");
  console.table([emissionPreview]);

  const participationChecks = await Promise.all([
    prisma.employeeParticipation.findFirst({ where: { proofUrl: { not: null } }, orderBy: { id: "asc" } }),
    prisma.employeeParticipation.findFirst({ where: { proofUrl: null }, orderBy: { id: "asc" } }),
    prisma.challengeParticipation.findFirst({ where: { proofUrl: { not: null } }, orderBy: { id: "asc" } })
  ]);

  console.log("\n=== canApproveParticipation results ===");
  const participationRows = [] as Array<Record<string, string | number | boolean | null>>;
  for (const participation of participationChecks) {
    if (!participation) {
      continue;
    }

    const id = participation.id;
    participationRows.push({
      ParticipationId: id,
      Approved: await canApproveParticipation(id)
    });
  }
  console.table(participationRows);

  const sampleEmployee = departments[0]
    ? await prisma.employee.findFirst({ where: { departmentId: departments[0].id }, orderBy: { xp: "desc" } })
    : null;

  const badgeResults = sampleEmployee ? await checkBadgeUnlocks(sampleEmployee.id) : [];
  console.log("\n=== checkBadgeUnlocks results ===");
  console.table(badgeResults);

  const rewards = await prisma.reward.findMany({ orderBy: { id: "asc" } });
  const highPointsEmployee = await prisma.employee.findFirst({ orderBy: { points: "desc" } });
  const lowPointsEmployee = await prisma.employee.findFirst({ orderBy: { points: "asc" } });

  console.log("\n=== redeemReward results ===");
  const redeemSuccess = highPointsEmployee && rewards[0]
    ? await redeemReward(highPointsEmployee.id, rewards[0].id)
    : { success: false, reason: "No eligible employee or reward found." };
  const redeemFail = lowPointsEmployee && rewards[2]
    ? await redeemReward(lowPointsEmployee.id, rewards[2].id)
    : { success: false, reason: "No eligible employee or reward found." };
  console.table([
    { Case: "should succeed", ...redeemSuccess },
    { Case: "should fail", ...redeemFail }
  ]);

  const overdueBefore = await prisma.complianceIssue.findMany({ where: { status: "Open", dueDate: { lt: new Date() } }, orderBy: { id: "asc" } });
  const overdueResult = await flagOverdueIssues();
  const overdueAfter = await prisma.complianceIssue.findMany({ where: { status: "Open", dueDate: { lt: new Date() } }, orderBy: { id: "asc" } });

  console.log("\n=== flagOverdueIssues summary ===");
  console.table([
    {
      Before: overdueBefore.length,
      Updated: overdueResult.updatedCount,
      NotificationsCreated: overdueResult.notificationsCreated,
      After: overdueAfter.length
    }
  ]);

  const notifiedIssues = await prisma.notification.findMany({
    where: { type: "COMPLIANCE_RAISED" },
    orderBy: { id: "asc" }
  });

  console.log("\n=== compliance notifications ===");
  console.table(notifiedIssues.map((notification: { id: number; recipientId: number; message: string }) => ({ id: notification.id, recipientId: notification.recipientId, message: notification.message })));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
