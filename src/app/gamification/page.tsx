import { prisma } from "@/server/prisma";
import { GamificationClient } from "@/components/gamification";
import { getDepartmentRanking } from "@/lib/eco-data";

export default async function GamificationPage() {
  const [employees, badges, rewards, challenges, participations, employeeBadges, departmentScores] = await Promise.all([
    prisma.employee.findMany({
      include: { department: true },
      orderBy: [{ xp: "desc" }, { points: "desc" }]
    }),
    prisma.badge.findMany({
      orderBy: { id: "asc" }
    }),
    prisma.reward.findMany({
      orderBy: [{ stock: "desc" }, { pointsRequired: "asc" }]
    }),
    prisma.challenge.findMany({
      include: { category: true },
      orderBy: { deadline: "asc" }
    }),
    prisma.challengeParticipation.findMany({
      orderBy: { id: "desc" }
    }),
    prisma.employeeBadge.findMany({
      orderBy: { unlockedAt: "desc" }
    }),
    getDepartmentRanking()
  ]);

  return (
    <GamificationClient
      employees={employees.map((e) => ({
        id: e.id,
        name: e.name,
        departmentId: e.departmentId,
        xp: e.xp,
        points: e.points,
        department: { name: e.department.name }
      }))}
      challenges={challenges.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        xp: c.xp,
        difficulty: c.difficulty,
        evidenceRequired: c.evidenceRequired,
        deadline: c.deadline,
        status: c.status,
        category: { name: c.category.name }
      }))}
      badges={badges.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        unlockRule: b.unlockRule,
        icon: b.icon
      }))}
      rewards={rewards.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        pointsRequired: r.pointsRequired,
        stock: r.stock,
        status: r.status
      }))}
      participations={participations.map((p) => ({
        id: p.id,
        challengeId: p.challengeId,
        employeeId: p.employeeId,
        progress: p.progress,
        approvalStatus: p.approvalStatus
      }))}
      employeeBadges={employeeBadges.map((eb) => ({
        id: eb.id,
        employeeId: eb.employeeId,
        badgeId: eb.badgeId,
        unlockedAt: eb.unlockedAt
      }))}
      departments={departmentScores.map((ds) => ({
        id: ds.id,
        name: ds.name,
        totalScore: ds.totalScore
      }))}
    />
  );
}
