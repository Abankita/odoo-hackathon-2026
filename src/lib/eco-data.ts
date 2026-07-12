import {
  autoCalculateEmission,
  canApproveParticipation,
  calcOverallESGScore,
  calcEnvironmentalScore,
  calcGovernanceScore,
  calcSocialScore,
  checkBadgeUnlocks,
  flagOverdueIssues,
  redeemReward,
  calcDepartmentScore
} from "@/server/engine";
import { prisma } from "@/server/prisma";

export type DashboardMetrics = {
  environmental: number;
  social: number;
  governance: number;
  overall: number;
};

export async function getDashboardMetrics(departmentId: number | null = null) {
  const departments = await prisma.department.findMany({ orderBy: { id: "asc" } });

  if (departmentId !== null) {
    // Return scores for the specific department
    const [environmental, social, governance] = await Promise.all([
      calcEnvironmentalScore(departmentId),
      calcSocialScore(departmentId),
      calcGovernanceScore(departmentId)
    ]);
    
    // Recalculate department score record in the DB
    const scoreRecord = await calcDepartmentScore(departmentId);
    const overall = scoreRecord.totalScore;

    return { departments, environmental, social, governance, overall } satisfies DashboardMetrics & { departments: typeof departments };
  } else {
    // Average scores across all departments
    if (departments.length === 0) {
      return { departments, environmental: 100, social: 100, governance: 100, overall: 100 };
    }

    // Re-run department score calculations for all to ensure they are fresh
    await Promise.all(departments.map((d) => calcDepartmentScore(d.id)));

    const scores = await prisma.departmentScore.findMany({
      orderBy: { computedAt: "desc" }
    });

    // Get the latest unique score for each department
    const latestScoresMap = new Map<number, typeof scores[0]>();
    for (const score of scores) {
      if (!latestScoresMap.has(score.departmentId)) {
        latestScoresMap.set(score.departmentId, score);
      }
    }
    const latestScores = Array.from(latestScoresMap.values());

    const environmental = latestScores.reduce((sum, s) => sum + s.environmentalScore, 0) / (latestScores.length || 1);
    const social = latestScores.reduce((sum, s) => sum + s.socialScore, 0) / (latestScores.length || 1);
    const governance = latestScores.reduce((sum, s) => sum + s.governanceScore, 0) / (latestScores.length || 1);
    const overall = await calcOverallESGScore();

    return { departments, environmental, social, governance, overall } satisfies DashboardMetrics & { departments: typeof departments };
  }
}

export async function getMonthlyEmissions(departmentId: number | null = null) {
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth() + 1}`,
      label: date.toLocaleDateString("en-US", { month: "short" })
    };
  });

  const transactions = await prisma.carbonTransaction.findMany({
    where: {
      date: { gte: new Date(now.getFullYear(), now.getMonth() - 11, 1) },
      ...(departmentId !== null ? { departmentId } : {})
    },
    include: { department: true }
  });

  return months.map((month) => {
    const monthTransactions = transactions.filter((transaction) => {
      const transactionKey = `${transaction.date.getFullYear()}-${transaction.date.getMonth() + 1}`;
      return transactionKey === month.key;
    });

    return {
      ...month,
      total: monthTransactions.reduce((sum, transaction) => sum + transaction.computedCO2, 0),
      byDepartment: monthTransactions.reduce<Record<string, number>>((accumulator, transaction) => {
        accumulator[transaction.department.name] = (accumulator[transaction.department.name] ?? 0) + transaction.computedCO2;
        return accumulator;
      }, {})
    };
  });
}

export async function getDepartmentRanking() {
  const departments = await prisma.department.findMany({
    include: { departmentScores: { orderBy: { computedAt: "desc" }, take: 1 } },
    orderBy: { name: "asc" }
  });

  return departments
    .map((department) => ({
      id: department.id,
      name: department.name,
      totalScore: department.departmentScores[0]?.totalScore ?? 0,
      score: department.departmentScores[0]
    }))
    .sort((left, right) => right.totalScore - left.totalScore);
}

export async function getRecentActivity() {
  const [participations, challenges, issues, acknowledgements] = await Promise.all([
    prisma.employeeParticipation.findMany({ include: { employee: true, activity: true }, orderBy: { id: "desc" }, take: 4 }),
    prisma.challengeParticipation.findMany({ include: { employee: true, challenge: true }, orderBy: { id: "desc" }, take: 2 }),
    prisma.complianceIssue.findMany({ include: { audit: true, owner: true }, orderBy: { id: "desc" }, take: 2 }),
    prisma.policyAcknowledgement.findMany({ include: { employee: true, policy: true }, orderBy: { acknowledgedDate: "desc" }, take: 2 })
  ]);

  return [
    ...participations.map((participation) => ({
      id: `ep-${participation.id}`,
      date: participation.completionDate ?? new Date(),
      title: `${participation.employee.name} completed a CSR activity`,
      detail: `${participation.activity.title} (${participation.approvalStatus})`
    })),
    ...challenges.map((participation) => ({
      id: `cp-${participation.id}`,
      date: new Date(),
      title: `${participation.employee.name} progressed on a challenge`,
      detail: `${participation.challenge.title} · ${participation.progress}% (${participation.approvalStatus})`
    })),
    ...issues.map((issue) => ({
      id: `issue-${issue.id}`,
      date: issue.dueDate,
      title: issue.status === "Open" ? "Compliance issue opened" : "Compliance issue resolved",
      detail: `${issue.description} (Severity: ${issue.severity})`
    })),
    ...acknowledgements.map((acknowledgement) => ({
      id: `ack-${acknowledgement.id}`,
      date: acknowledgement.acknowledgedDate,
      title: `${acknowledgement.employee.name} acknowledged a policy`,
      detail: acknowledgement.policy.title
    }))
  ]
    .sort((left, right) => right.date.getTime() - left.date.getTime())
    .slice(0, 8);
}

export async function getDashboardInsights() {
  // Flag overdue compliance issues first
  await flagOverdueIssues();

  const overdueIssuesCount = await prisma.complianceIssue.count({
    where: { status: "Open", isOverdue: true }
  });

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [currentMonthTransactions, lastMonthTransactions] = await Promise.all([
    prisma.carbonTransaction.findMany({ where: { date: { gte: currentMonthStart } } }),
    prisma.carbonTransaction.findMany({ where: { date: { gte: lastMonthStart, lt: currentMonthStart } } })
  ]);

  const currentMonthCO2 = currentMonthTransactions.reduce((sum, t) => sum + t.computedCO2, 0);
  const lastMonthCO2 = lastMonthTransactions.reduce((sum, t) => sum + t.computedCO2, 0);

  let emissionsChange = 0;
  if (lastMonthCO2 > 0) {
    emissionsChange = ((currentMonthCO2 - lastMonthCO2) / lastMonthCO2) * 100;
  }

  // Active environmental goals check
  const offTrackGoals = await prisma.environmentalGoal.count({
    where: { status: "OffTrack" }
  });

  const insights = [
    {
      id: 1,
      title: "Compliance Status Warning",
      text: `${overdueIssuesCount} compliance issue(s) are currently OVERDUE. Please assign resources to resolve these.`,
      type: overdueIssuesCount > 0 ? "danger" : "success"
    },
    {
      id: 2,
      title: "Carbon Emissions Trend",
      text: `Total corporate emissions are ${emissionsChange >= 0 ? "up" : "down"} by ${Math.abs(emissionsChange).toFixed(1)}% MoM (${currentMonthCO2.toFixed(0)} kg vs ${lastMonthCO2.toFixed(0)} kg last month).`,
      type: emissionsChange > 5 ? "warning" : "success"
    },
    {
      id: 3,
      title: "Environmental Goals Progress",
      text: `${offTrackGoals} environmental goal(s) are currently marked as Off-Track. Check the environmental console.`,
      type: offTrackGoals > 0 ? "warning" : "success"
    }
  ];

  return {
    overdueCount: overdueIssuesCount,
    insights
  };
}

export async function createCarbonTransactionWithAutoCalc(input: Parameters<typeof autoCalculateEmission>[0]) {
  const calculated = await autoCalculateEmission(input);
  const transaction = await prisma.carbonTransaction.create({
    data: {
      departmentId: calculated.departmentId ?? 1,
      sourceType: calculated.sourceType,
      quantity: calculated.quantity,
      emissionFactorId: calculated.emissionFactorId ?? 1,
      computedCO2: calculated.computedCO2 ?? 0,
      date: calculated.date ?? new Date(),
      autoCalculated: calculated.autoCalculated ?? true
    }
  });

  // Re-run scores for this department
  await calcDepartmentScore(transaction.departmentId);

  return transaction;
}

export async function createChallengeParticipation(challengeId: number, employeeId: number) {
  return prisma.challengeParticipation.create({
    data: {
      challengeId,
      employeeId,
      progress: 0,
      approvalStatus: "Pending",
      xpAwarded: 0
    }
  });
}

export async function completeChallengeParticipation(participationId: number) {
  const participation = await prisma.challengeParticipation.findUnique({ include: { employee: true, challenge: true }, where: { id: participationId } });
  if (!participation) {
    throw new Error("Challenge participation not found.");
  }

  const updated = await prisma.challengeParticipation.update({
    where: { id: participationId },
    data: {
      progress: 100,
      approvalStatus: "Approved",
      xpAwarded: participation.challenge.xp
    }
  });

  await prisma.employee.update({
    where: { id: participation.employeeId },
    data: { 
      xp: { increment: participation.challenge.xp }, 
      points: { increment: Math.round(participation.challenge.xp / 10) } 
    }
  });

  // Run the badge award engine logic
  const badgeResults = await checkBadgeUnlocks(participation.employeeId);
  
  // Recalculate scores for employee's department
  await calcDepartmentScore(participation.employee.departmentId);

  return { updated, badgeResults };
}

export async function approveParticipationRecord(participationId: number) {
  const canApprove = await canApproveParticipation(participationId);
  if (!canApprove) {
    return { success: false, reason: "Evidence is required before approval." };
  }

  const employeeParticipation = await prisma.employeeParticipation.findUnique({ 
    include: { employee: true },
    where: { id: participationId } 
  });
  
  if (employeeParticipation) {
    const updated = await prisma.employeeParticipation.update({ 
      where: { id: participationId }, 
      data: { approvalStatus: "Approved" } 
    });

    // Award points and XP for CSR activity
    await prisma.employee.update({
      where: { id: employeeParticipation.employeeId },
      data: {
        points: { increment: employeeParticipation.pointsEarned },
        xp: { increment: employeeParticipation.pointsEarned * 10 }
      }
    });

    await checkBadgeUnlocks(employeeParticipation.employeeId);
    await calcDepartmentScore(employeeParticipation.employee.departmentId);

    return { success: true, record: updated };
  }

  const challengeParticipation = await prisma.challengeParticipation.findUnique({ 
    include: { employee: true, challenge: true },
    where: { id: participationId } 
  });
  
  if (challengeParticipation) {
    const updated = await prisma.challengeParticipation.update({ 
      where: { id: participationId }, 
      data: { approvalStatus: "Approved", progress: 100, xpAwarded: challengeParticipation.challenge.xp } 
    });

    await prisma.employee.update({
      where: { id: challengeParticipation.employeeId },
      data: {
        xp: { increment: challengeParticipation.challenge.xp },
        points: { increment: Math.round(challengeParticipation.challenge.xp / 10) }
      }
    });

    await checkBadgeUnlocks(challengeParticipation.employeeId);
    await calcDepartmentScore(challengeParticipation.employee.departmentId);

    return { success: true, record: updated };
  }

  return { success: false, reason: "Participation not found." };
}

export async function redeemRewardForEmployee(employeeId: number, rewardId: number) {
  const result = await redeemReward(employeeId, rewardId);
  if (result.success) {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (employee) {
      await calcDepartmentScore(employee.departmentId);
    }
  }
  return result;
}
