export const dynamic = "force-dynamic";
import { DashboardClient } from "@/components/dashboard";
import {
  getDashboardInsights,
  getDashboardMetrics,
  getDepartmentRanking,
  getMonthlyEmissions,
  getRecentActivity
} from "@/lib/eco-data";

type Props = {
  searchParams: {
    departmentId?: string;
  };
};

export default async function HomePage({ searchParams }: Props) {
  const departmentId = searchParams.departmentId ? Number(searchParams.departmentId) : null;

  const [metrics, trend, ranking, activity, insights] = await Promise.all([
    getDashboardMetrics(departmentId),
    getMonthlyEmissions(departmentId),
    getDepartmentRanking(),
    getRecentActivity(),
    getDashboardInsights()
  ]);

  return (
    <DashboardClient
      metrics={{
        environmental: metrics.environmental,
        social: metrics.social,
        governance: metrics.governance,
        overall: metrics.overall
      }}
      trend={trend.map((entry) => ({ label: entry.label, total: entry.total }))}
      ranking={ranking.map((entry) => ({ id: entry.id, name: entry.name, totalScore: entry.totalScore }))}
      insights={insights.insights.map((insight) => ({
        id: insight.id,
        title: insight.title,
        text: insight.text,
        type: insight.type
      }))}
      activity={activity}
      departments={metrics.departments.map((department) => ({ id: department.id, name: department.name }))}
    />
  );
}
