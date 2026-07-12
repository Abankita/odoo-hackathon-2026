export const dynamic = "force-dynamic";
import { prisma } from "@/server/prisma";
import { SettingsClient } from "@/components/settings";

export default async function SettingsPage() {
  const [config, departments, categories] = await Promise.all([
    prisma.orgConfig.findFirst(),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } })
  ]);

  if (!config) {
    // If somehow config doesn't exist, we fallback
    return <div className="text-center p-8 text-slate-500">OrgConfig table is empty. Please run seeding.</div>;
  }

  return (
    <SettingsClient
      config={{
        id: config.id,
        envWeight: config.envWeight,
        socialWeight: config.socialWeight,
        govWeight: config.govWeight,
        autoEmissionCalc: config.autoEmissionCalc,
        evidenceRequired: config.evidenceRequired,
        badgeAutoAward: config.badgeAutoAward,
        emailAlerts: config.emailAlerts
      }}
      departments={departments.map((d) => ({
        id: d.id,
        name: d.name,
        code: d.code,
        head: d.head,
        employeeCount: d.employeeCount,
        status: d.status
      }))}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status
      }))}
    />
  );
}
