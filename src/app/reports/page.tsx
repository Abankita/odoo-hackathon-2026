import { prisma } from "@/server/prisma";
import { ReportsClient } from "@/components/reports";

type Props = {
  searchParams: {
    module?: string;
    departmentId?: string;
    employeeId?: string;
    challengeId?: string;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
  };
};

export default async function ReportsPage({ searchParams }: Props) {
  const currentModule = searchParams.module || "Summary";
  const departmentId = searchParams.departmentId ? Number(searchParams.departmentId) : null;
  const employeeId = searchParams.employeeId ? Number(searchParams.employeeId) : null;
  const challengeId = searchParams.challengeId ? Number(searchParams.challengeId) : null;
  const categoryId = searchParams.categoryId ? Number(searchParams.categoryId) : null;
  const startDate = searchParams.startDate || null;
  const endDate = searchParams.endDate || null;

  // Retrieve option arrays to populate filter dropdowns
  const [departments, employees, challenges, categories] = await Promise.all([
    prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.employee.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.challenge.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }).then((list) => list.map(c => ({ id: c.id, name: c.title }))),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
  ]);

  let results: any[] = [];

  // Conditional querying depending on active module
  if (currentModule === "Environmental") {
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (categoryId) where.emissionFactor = { categoryId }; // wait, does emissionFactor link to Category? Let's check: in schema.prisma, EmissionFactor does not have categoryId, but CarbonTransaction departmentId does.
    // Wait, let's look at schema.prisma. CarbonTransaction does not have categoryId, it links to EmissionFactor.
    if (startDate || endDate) {
      where.date = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {})
      };
    }
    results = await prisma.carbonTransaction.findMany({
      where,
      include: { department: true, emissionFactor: true },
      orderBy: { date: "desc" }
    });
  } else if (currentModule === "Social") {
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
    results = await prisma.employeeParticipation.findMany({
      where,
      include: {
        employee: { include: { department: true } },
        activity: { include: { category: true } }
      },
      orderBy: { id: "desc" }
    });
  } else if (currentModule === "Governance") {
    const where: any = {};
    if (employeeId) where.ownerId = employeeId;
    if (departmentId) where.audit = { departmentId };
    if (startDate || endDate) {
      where.dueDate = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {})
      };
    }
    results = await prisma.complianceIssue.findMany({
      where,
      include: {
        owner: true,
        audit: { include: { department: true } }
      },
      orderBy: { dueDate: "asc" }
    });
  } else if (currentModule === "Gamification") {
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (challengeId) where.challengeId = challengeId;
    if (departmentId) where.employee = { departmentId };
    if (categoryId) where.challenge = { categoryId };
    results = await prisma.challengeParticipation.findMany({
      where,
      include: {
        employee: { include: { department: true } },
        challenge: { include: { category: true } }
      },
      orderBy: { id: "desc" }
    });
  } else {
    // Summary default
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (startDate || endDate) {
      where.computedAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {})
      };
    }
    results = await prisma.departmentScore.findMany({
      where,
      include: { department: true },
      orderBy: { computedAt: "desc" }
    });
  }

  return (
    <ReportsClient
      departments={departments}
      employees={employees}
      challenges={challenges}
      categories={categories}
      results={results}
      currentModule={currentModule}
    />
  );
}
