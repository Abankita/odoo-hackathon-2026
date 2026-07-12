import { prisma } from "@/server/prisma";
import { GovernanceClient } from "@/components/governance";

export default async function GovernancePage() {
  const [policies, audits, issues, notifications] = await Promise.all([
    prisma.eSGPolicy.findMany({
      include: {
        category: true,
        acknowledgements: {
          include: { employee: true }
        }
      },
      orderBy: { effectiveDate: "desc" }
    }),
    prisma.audit.findMany({
      include: { department: true },
      orderBy: { date: "desc" }
    }),
    prisma.complianceIssue.findMany({
      include: {
        owner: true,
        audit: { include: { department: true } }
      },
      orderBy: { dueDate: "asc" }
    }),
    prisma.notification.findMany({
      include: { recipient: true },
      orderBy: { createdAt: "desc" },
      take: 10
    })
  ]);

  const totalOpenIssues = issues.filter((issue) => issue.status === "Open").length;

  return (
    <GovernanceClient
      policies={policies.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        effectiveDate: p.effectiveDate,
        status: p.status,
        category: { name: p.category.name },
        acknowledgements: p.acknowledgements.map((ack) => ({
          id: ack.id,
          employee: { name: ack.employee.name }
        }))
      }))}
      audits={audits.map((a) => ({
        id: a.id,
        title: a.title,
        auditorName: a.auditorName,
        date: a.date,
        findings: a.findings,
        status: a.status,
        department: { name: a.department.name }
      }))}
      issues={issues.map((issue) => ({
        id: issue.id,
        description: issue.description,
        severity: issue.severity,
        dueDate: issue.dueDate,
        status: issue.status,
        isOverdue: issue.isOverdue,
        owner: { name: issue.owner.name },
        audit: {
          title: issue.audit.title,
          department: { name: issue.audit.department.name }
        }
      }))}
      notifications={notifications.map((n) => ({
        id: n.id,
        type: n.type,
        message: n.message,
        createdAt: n.createdAt,
        recipient: { name: n.recipient.name }
      }))}
      totalOpenIssues={totalOpenIssues}
    />
  );
}
