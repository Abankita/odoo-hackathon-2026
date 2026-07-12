import { prisma } from "./prisma";

export type CarbonTransactionInput = {
  departmentId?: number;
  sourceType: string;
  quantity: number;
  emissionFactorId?: number;
  date?: Date;
  computedCO2?: number;
  autoCalculated?: boolean;
};

type BadgeRule = {
  type?: string;
  threshold?: number;
  value?: number;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

async function getOrgConfig() {
  return prisma.orgConfig.findFirst();
}

async function getDepartmentEmployeeIds(departmentId: number) {
  const employees = await prisma.employee.findMany({
    where: { departmentId },
    select: { id: true }
  });

  return employees.map((employee: { id: number }) => employee.id);
}

export async function calcEnvironmentalScore(departmentId: number) {
  const goals = await prisma.environmentalGoal.findMany({ where: { departmentId } });

  if (goals.length === 0) {
    return 100;
  }

  const now = new Date();
  let totalProgress = 0;
  let penalty = 0;

  for (const goal of goals) {
    const target = goal.targetCO2 > 0 ? goal.targetCO2 : 1;
    const progress = goal.status === "Completed" ? 100 : clamp((1 - goal.currentCO2 / target) * 100);
    totalProgress += progress;

    const overdue = goal.deadline < now && goal.status !== "Completed";
    if (goal.status === "OffTrack" || overdue) {
      penalty += 5;
    }
  }

  return clamp(totalProgress / goals.length - penalty);
}

export async function calcSocialScore(departmentId: number) {
  const employeeIds = await getDepartmentEmployeeIds(departmentId);
  if (employeeIds.length === 0) {
    return 100;
  }

  const total = await prisma.employeeParticipation.count({ where: { employeeId: { in: employeeIds } } });
  if (total === 0) {
    return 100;
  }

  const approved = await prisma.employeeParticipation.count({
    where: {
      employeeId: { in: employeeIds },
      approvalStatus: "Approved"
    }
  });

  return clamp((approved / total) * 100);
}

export async function calcGovernanceScore(departmentId: number) {
  const employeeIds = await getDepartmentEmployeeIds(departmentId);
  const [policyCount, acknowledgements, openIssues]: [number, number, Array<{ isOverdue: boolean }>] = await Promise.all([
    prisma.eSGPolicy.count(),
    prisma.policyAcknowledgement.count({ where: { employeeId: { in: employeeIds } } }),
    prisma.complianceIssue.findMany({
      where: {
        status: "Open",
        audit: { departmentId }
      },
      select: { isOverdue: true }
    })
  ]);

  const totalPossible = employeeIds.length * policyCount;
  const acknowledgementRate = totalPossible > 0 ? (acknowledgements / totalPossible) * 100 : 100;
  const penalty = openIssues.length * 10 + openIssues.filter((issue: any) => issue.isOverdue).length * 10;

  return clamp(acknowledgementRate - penalty);
}

export async function calcDepartmentScore(departmentId: number) {
  const [envScore, socialScore, govScore, config] = await Promise.all([
    calcEnvironmentalScore(departmentId),
    calcSocialScore(departmentId),
    calcGovernanceScore(departmentId),
    getOrgConfig()
  ]);

  const envWeight = config?.envWeight ?? 40;
  const socialWeight = config?.socialWeight ?? 30;
  const govWeight = config?.govWeight ?? 30;
  const totalScore = clamp((envScore * envWeight + socialScore * socialWeight + govScore * govWeight) / 100);

  await prisma.departmentScore.deleteMany({ where: { departmentId } });
  return prisma.departmentScore.create({
    data: {
      departmentId,
      environmentalScore: envScore,
      socialScore,
      governanceScore: govScore,
      totalScore,
      computedAt: new Date()
    }
  });
}

export async function calcOverallESGScore() {
  const departments: Array<{ id: number }> = await prisma.department.findMany({ select: { id: true } });
  if (departments.length === 0) {
    return 0;
  }

  const scores = await Promise.all(departments.map((department: any) => calcDepartmentScore(department.id)));
  return scores.reduce((sum: any, score: any) => sum + score.totalScore, 0) / scores.length;
}

export async function autoCalculateEmission(input: CarbonTransactionInput) {
  const config = await getOrgConfig();
  const autoEmissionCalc = config?.autoEmissionCalc ?? true;

  if (!autoEmissionCalc) {
    if (typeof input.computedCO2 !== "number") {
      throw new Error("Manual computedCO2 is required when auto emission calculation is disabled.");
    }

    return { ...input, autoCalculated: false, computedCO2: input.computedCO2 };
  }

  const factor = await prisma.emissionFactor.findFirst({ where: { sourceType: input.sourceType } });
  if (!factor) {
    throw new Error(`No emission factor found for sourceType '${input.sourceType}'.`);
  }

  return {
    ...input,
    emissionFactorId: factor.id,
    autoCalculated: true,
    computedCO2: Number((input.quantity * factor.co2PerUnit).toFixed(2))
  };
}

export async function canApproveParticipation(participationId: number) {
  const evidenceRequired = (await getOrgConfig())?.evidenceRequired ?? true;

  const employeeParticipation = await prisma.employeeParticipation.findUnique({ where: { id: participationId } });
  if (employeeParticipation) {
    return !(evidenceRequired && !employeeParticipation.proofUrl?.trim());
  }

  const challengeParticipation = await prisma.challengeParticipation.findUnique({ where: { id: participationId } });
  if (challengeParticipation) {
    return !(evidenceRequired && !challengeParticipation.proofUrl?.trim());
  }

  return false;
}

function parseBadgeRule(rule: string): BadgeRule {
  try {
    return JSON.parse(rule) as BadgeRule;
  } catch {
    return {};
  }
}

async function getEmployeeCompletionCount(employeeId: number) {
  return prisma.challengeParticipation.count({
    where: {
      employeeId,
      approvalStatus: "Approved",
      progress: { gte: 100 }
    }
  });
}

export async function checkBadgeUnlocks(employeeId: number) {
  const [employee, badges, config, completedChallenges] = await Promise.all([
    prisma.employee.findUnique({ where: { id: employeeId } }),
    prisma.badge.findMany(),
    getOrgConfig(),
    getEmployeeCompletionCount(employeeId)
  ]);

  if (!employee) {
    throw new Error(`Employee ${employeeId} not found.`);
  }

  const awardEnabled = config?.badgeAutoAward ?? true;
  const results: Array<{ badgeId: number; name: string; awarded: boolean }> = [];

  for (const badge of badges) {
    const rule = parseBadgeRule(badge.unlockRule);
    const ruleType = (rule.type ?? "XP").toUpperCase();
    const threshold = rule.threshold ?? rule.value ?? 0;

    const qualified =
      (ruleType === "XP" && employee.xp >= threshold) ||
      (ruleType === "POINTS" && employee.points >= threshold) ||
      (ruleType === "COMPLETED_CHALLENGES" && completedChallenges >= threshold);

    if (!qualified) {
      continue;
    }

    const alreadyUnlocked = await prisma.employeeBadge.findUnique({
      where: { employeeId_badgeId: { employeeId, badgeId: badge.id } }
    });

    if (alreadyUnlocked) {
      results.push({ badgeId: badge.id, name: badge.name, awarded: false });
      continue;
    }

    if (awardEnabled) {
      await prisma.$transaction([
        prisma.employeeBadge.create({
          data: { employeeId, badgeId: badge.id, unlockedAt: new Date() }
        }),
        prisma.notification.create({
          data: {
            recipientId: employeeId,
            type: "BADGE_UNLOCKED",
            message: `Badge unlocked: ${badge.name}`
          }
        })
      ]);
    }

    results.push({ badgeId: badge.id, name: badge.name, awarded: awardEnabled });
  }

  return results;
}

export async function redeemReward(employeeId: number, rewardId: number) {
  return prisma.$transaction(async (tx: any) => {
    const reward = await tx.reward.findUnique({ where: { id: rewardId } });
    if (!reward) {
      return { success: false, reason: `Reward ${rewardId} not found.` };
    }

    if (reward.stock <= 0) {
      return { success: false, reason: "out of stock" };
    }

    const employee = await tx.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      return { success: false, reason: `Employee ${employeeId} not found.` };
    }

    if (employee.points < reward.pointsRequired) {
      return { success: false, reason: "insufficient points" };
    }

    await tx.reward.update({
      where: { id: rewardId },
      data: { stock: { decrement: 1 } }
    });

    await tx.employee.update({
      where: { id: employeeId },
      data: { points: { decrement: reward.pointsRequired } }
    });

    return { success: true, reason: null };
  });
}

export async function flagOverdueIssues() {
  const now = new Date();
  const issues = await prisma.complianceIssue.findMany({
    where: {
      status: "Open",
      dueDate: { lt: now }
    }
  });

  let updatedCount = 0;
  let notificationsCreated = 0;

  for (const issue of issues) {
    if (!issue.isOverdue) {
      await prisma.complianceIssue.update({
        where: { id: issue.id },
        data: { isOverdue: true }
      });
      updatedCount += 1;
    }

    const message = `Overdue compliance issue #${issue.id}: ${issue.description}`;
    const existing = await prisma.notification.findFirst({
      where: {
        recipientId: issue.ownerId,
        type: "COMPLIANCE_RAISED",
        message
      }
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          recipientId: issue.ownerId,
          type: "COMPLIANCE_RAISED",
          message
        }
      });
      notificationsCreated += 1;
    }
  }

  return { updatedCount, notificationsCreated, issueCount: issues.length };
}
