"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { CarbonTransactionInput } from "@/server/engine";
import { Leaf, Users, ShieldAlert, Sparkles, TrendingUp, HelpCircle, Activity } from "lucide-react";

type DashboardProps = {
  metrics: { environmental: number; social: number; governance: number; overall: number };
  trend: Array<{ label: string; total: number }>;
  ranking: Array<{ id: number; name: string; totalScore: number }>;
  insights: Array<{ id: number; title: string; text: string; type: string }>;
  activity: Array<{ id: string; title: string; detail: string; date: Date | string }>;
  departments: Array<{ id: number; name: string }>;
};

const cardConfig = [
  { label: "Environmental", value: "environmental", accent: "border-l-4 border-emerald-500", icon: Leaf, bgIcon: "text-emerald-100" },
  { label: "Social", value: "social", accent: "border-l-4 border-blue-500", icon: Users, bgIcon: "text-blue-100" },
  { label: "Governance", value: "governance", accent: "border-l-4 border-violet-500", icon: ShieldAlert, bgIcon: "text-violet-100" },
  { label: "Overall Score", value: "overall", accent: "border-l-4 border-amber-500", icon: Sparkles, bgIcon: "text-amber-100" }
] as const;

export function DashboardClient({ metrics, trend, ranking, insights, activity, departments }: DashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedDeptId = searchParams.get("departmentId") ? Number(searchParams.get("departmentId")) : null;

  const [carbonFormOpen, setCarbonFormOpen] = useState(false);
  const [carbonInput, setCarbonInput] = useState<CarbonTransactionInput>({
    sourceType: "Diesel",
    quantity: 0,
    departmentId: departments[0]?.id
  });
  const [emissionPreview, setEmissionPreview] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "all") {
      router.push("/");
    } else {
      router.push(`/?departmentId=${val}`);
    }
  };

  const handleBarClick = (entry: any) => {
    if (entry && entry.id) {
      router.push(`/?departmentId=${entry.id}`);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  return (
    <div className="space-y-8 relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-700 animate-in fade-in slide-in-from-bottom-5">
          <Sparkles className="h-5 w-5 text-amber-300" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header filter banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Context Filter</span>
          <h2 className="text-base font-semibold text-slate-900">
            {selectedDeptId
              ? `Currently viewing: ${departments.find((d) => d.id === selectedDeptId)?.name} Department`
              : "Currently viewing: All Corporate Departments"}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedDeptId?.toString() ?? "all"}
            onChange={handleDepartmentChange}
            className="w-full sm:w-56 bg-slate-50 border-slate-200"
          >
            <option value="all">All Departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </Select>
          {selectedDeptId && (
            <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="text-slate-500">
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Score cards section */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cardConfig.map((card) => {
          const score = metrics[card.value as keyof typeof metrics];
          const IconComponent = card.icon;
          return (
            <Card key={card.value} className={`${card.accent} shadow-sm bg-white overflow-hidden relative group hover:shadow-md transition-all duration-200`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.label}</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-extrabold tracking-tight text-slate-900">{score.toFixed(1)}</span>
                      <span className="text-sm font-semibold text-slate-400">/100</span>
                    </div>
                  </div>
                  <div className={`p-2.5 rounded-xl bg-slate-50 ${card.bgIcon} transition-colors group-hover:bg-slate-100`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Charts section */}
      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="shadow-sm border-slate-100 bg-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-700" />
              <CardTitle>Emissions Trend</CardTitle>
            </div>
            <CardDescription>12-month carbon output (kg CO2) based on logged fuel, utilities, and material consumption.</CardDescription>
          </CardHeader>
          <CardContent className="h-[340px] pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dx={-8} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff" }}
                  labelStyle={{ fontWeight: "bold", color: "#94a3b8" }}
                />
                <Line type="monotone" dataKey="total" name="CO2 Output (kg)" stroke="#0F766E" strokeWidth={3} dot={{ stroke: "#0F766E", strokeWidth: 2, r: 4, fill: "#fff" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Insights strip */}
        <Card className="shadow-sm border-slate-100 bg-white flex flex-col justify-between">
          <div>
            <CardHeader>
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-emerald-700" />
                <CardTitle>Platform Insights</CardTitle>
              </div>
              <CardDescription>Analyzed highlights compiled from recent activities and database rules.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.map((insight) => {
                let badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-100";
                if (insight.type === "danger") badgeColor = "bg-red-50 text-red-800 border-red-100";
                if (insight.type === "warning") badgeColor = "bg-amber-50 text-amber-800 border-amber-100";

                return (
                  <div key={insight.id} className={`rounded-xl border p-4 transition-colors ${badgeColor}`}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1">{insight.title}</p>
                    <p className="text-sm font-medium">{insight.text}</p>
                  </div>
                );
              })}
            </CardContent>
          </div>
        </Card>
      </section>

      {/* Department Score & Activity section */}
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="shadow-sm border-slate-100 bg-white">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Department ESG Standings</CardTitle>
                <CardDescription>Click a bar to filter dashboard context to that specific department.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ranking} layout="vertical" margin={{ left: 16, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff" }}
                  labelStyle={{ fontWeight: "bold" }}
                />
                <Bar dataKey="totalScore" name="ESG Score" radius={[0, 8, 8, 0]} onClick={handleBarClick} cursor="pointer">
                  {ranking.map((entry, index) => {
                    const colors = ["#0F766E", "#2563EB", "#7C3AED", "#EA580C"];
                    return <Cell key={entry.id} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="shadow-sm border-slate-100 bg-white flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-700" />
              <CardTitle>Recent Activity</CardTitle>
            </div>
            <CardDescription>Live audit logs across ESG goals, challenges, and policies.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[300px] space-y-4 pr-1 scrollbar-hide">
            {activity.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No recent actions logged.</p>
            ) : (
              activity.map((event) => (
                <div key={event.id} className="flex gap-4 items-start border-b border-slate-50 pb-3 last:border-b-0 last:pb-0">
                  <div className="h-2 w-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-slate-800 leading-tight">{event.title}</p>
                    <p className="text-xs text-slate-500">{event.detail}</p>
                    <span className="text-[10px] font-semibold text-slate-400">{new Date(event.date).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      {/* Quick actions panel */}
      <Card className="shadow-sm border-slate-100 bg-white">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Operational shortcuts for the ESG management demo chain.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => setCarbonFormOpen(true)} className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl px-5">
            Log Carbon Data
          </Button>
          <Button variant="outline" asChild className="rounded-xl border-slate-200 hover:bg-slate-50">
            <Link href="/gamification">Start Challenge</Link>
          </Button>
          <Button variant="outline" asChild className="rounded-xl border-slate-200 hover:bg-slate-50">
            <Link href="/reports">View Reports</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Log Carbon Modal */}
      {carbonFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-xl shadow-2xl border border-slate-100 bg-white rounded-3xl overflow-hidden animate-in zoom-in-95 duration-150">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
              <CardTitle className="text-slate-900 text-xl font-bold">Log Carbon Transaction</CardTitle>
              <CardDescription className="text-slate-500">
                Calculates CO2 emissions based on the selected source type using live factors.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                  <span>Department</span>
                  <Select
                    value={carbonInput.departmentId}
                    onChange={(e) => setCarbonInput({ ...carbonInput, departmentId: Number(e.target.value) })}
                    className="bg-slate-50 border-slate-200 rounded-xl"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                  <span>Source Type</span>
                  <Select
                    value={carbonInput.sourceType}
                    onChange={(e) => setCarbonInput({ ...carbonInput, sourceType: e.target.value })}
                    className="bg-slate-50 border-slate-200 rounded-xl"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Air Travel">Air Travel</option>
                    <option value="Packaging Material">Packaging Material</option>
                  </Select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                  <span>Quantity (units)</span>
                  <Input
                    type="number"
                    value={carbonInput.quantity}
                    onChange={(e) => setCarbonInput({ ...carbonInput, quantity: Number(e.target.value) })}
                    className="bg-slate-50 border-slate-200 rounded-xl"
                    min={0}
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                  <span>Date</span>
                  <Input
                    type="date"
                    onChange={(e) => setCarbonInput({ ...carbonInput, date: new Date(e.target.value) })}
                    className="bg-slate-50 border-slate-200 rounded-xl"
                  />
                </label>
              </div>

              {emissionPreview && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-950 text-sm font-medium">
                  {emissionPreview}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => { setCarbonFormOpen(false); setEmissionPreview(""); }} className="rounded-xl border-slate-200">
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/log-carbon", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(carbonInput)
                      });
                      if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || "Failed to log carbon");
                      }
                      const payload = await response.json();
                      showToast(`Carbon logged successfully! Computed ${payload.computedCO2} kg CO2.`);
                      setEmissionPreview(`Computed CO2: ${payload.computedCO2} kg.`);
                      setCarbonFormOpen(false);
                      router.refresh();
                    } catch (e: any) {
                      setEmissionPreview(`Error: ${e.message}`);
                    }
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl px-5"
                >
                  Save Transaction
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
