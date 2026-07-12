import { prisma } from "@/server/prisma";
import { SocialClient } from "@/components/social";

export default async function SocialPage() {
  const [employees, activities, participations] = await Promise.all([
    prisma.employee.findMany({
      include: { department: true },
      orderBy: { name: "asc" }
    }),
    prisma.cSRActivity.findMany({
      include: { category: true },
      orderBy: { date: "desc" }
    }),
    prisma.employeeParticipation.findMany({
      include: { employee: { include: { department: true } }, activity: true },
      orderBy: { id: "desc" }
    })
  ]);

  return (
    <SocialClient
      employees={employees.map((e) => ({
        id: e.id,
        name: e.name,
        department: { name: e.department.name }
      }))}
      activities={activities.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        evidenceRequired: a.evidenceRequired,
        date: a.date,
        status: a.status,
        category: { name: a.category.name }
      }))}
      participations={participations.map((p) => ({
        id: p.id,
        employeeId: p.employeeId,
        activityId: p.activityId,
        proofUrl: p.proofUrl,
        approvalStatus: p.approvalStatus,
        pointsEarned: p.pointsEarned,
        completionDate: p.completionDate,
        employee: {
          name: p.employee.name,
          department: { name: p.employee.department.name }
        },
        activity: {
          title: p.activity.title,
          evidenceRequired: p.activity.evidenceRequired
        }
      }))}
    />
  );
}
