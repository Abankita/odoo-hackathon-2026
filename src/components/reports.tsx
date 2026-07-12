"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileBarChart2, Leaf, Users, ShieldAlert, Sparkles, Download } from "lucide-react";

type DropdownItem = { id: number; name: string };

type ReportsProps = {
  departments: DropdownItem[];
  employees: DropdownItem[];
  challenges: DropdownItem[];
  categories: DropdownItem[];
  results: any[];
  currentModule: string;
};

export function ReportsClient({
  departments,
  employees,
  challenges,
  categories,
  results,
  currentModule
}: ReportsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state reflecting URL params (or default values)
  const [moduleId, setModuleId] = useState(searchParams.get("module") || "Summary");
  const [departmentId, setDepartmentId] = useState(searchParams.get("departmentId") || "all");
  const [employeeId, setEmployeeId] = useState(searchParams.get("employeeId") || "all");
  const [challengeId, setChallengeId] = useState(searchParams.get("challengeId") || "all");
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "all");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");

  // Update query params based on selected filters
  const handleRunReport = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const params = new URLSearchParams();
    params.set("module", moduleId);
    if (departmentId !== "all") params.set("departmentId", departmentId);
    if (employeeId !== "all") params.set("employeeId", employeeId);
    if (challengeId !== "all") params.set("challengeId", challengeId);
    if (categoryId !== "all") params.set("categoryId", categoryId);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    router.push(`/reports?${params.toString()}`);
  };

  const handleShortcut = (mod: string) => {
    setModuleId(mod);
    setDepartmentId("all");
    setEmployeeId("all");
    setChallengeId("all");
    setCategoryId("all");
    setStartDate("");
    setEndDate("");

    const params = new URLSearchParams();
    params.set("module", mod);
    router.push(`/reports?${params.toString()}`);
  };

  // Build CSV export link with identical parameters
  const getCSVLink = () => {
    const params = new URLSearchParams();
    params.set("module", moduleId);
    if (departmentId !== "all") params.set("departmentId", departmentId);
    if (employeeId !== "all") params.set("employeeId", employeeId);
    if (challengeId !== "all") params.set("challengeId", challengeId);
    if (categoryId !== "all") params.set("categoryId", categoryId);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    return `/api/reports/export?${params.toString()}`;
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Shortcut cards */}
      <section className="grid gap-5 md:grid-cols-4">
        {[
          { key: "Environmental", label: "Environmental", desc: "Carbon ledgers & logs", icon: Leaf, iconStyle: "bg-emerald-50 text-emerald-700 border-emerald-100" },
          { key: "Social", label: "Social / CSR", desc: "Participation archives", icon: Users, iconStyle: "bg-blue-50 text-blue-700 border-blue-100" },
          { key: "Governance", label: "Governance", desc: "Audits & compliance", icon: ShieldAlert, iconStyle: "bg-violet-50 text-violet-700 border-violet-100" },
          { key: "Summary", label: "ESG Summary", desc: "Depts metrics overview", icon: FileBarChart2, iconStyle: "bg-amber-50 text-amber-700 border-amber-100" }
        ].map((item) => {
          const IconComp = item.icon;
          return (
            <Card
              key={item.key}
              onClick={() => handleShortcut(item.key)}
              className="shadow-sm border-slate-100 bg-white cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group rounded-2xl"
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-xl border ${item.iconStyle} transition-colors`}>
                  <IconComp className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{item.label}</h4>
                  <p className="text-[11px] text-slate-400 font-semibold">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Filter Builder Panel */}
      <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Custom Report Query Builder</CardTitle>
          <CardDescription className="text-xs">Filter corporate ESG parameters and compile analytical ledger exports.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRunReport} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
              <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Select Module</span>
                <Select value={moduleId} onChange={(e) => setModuleId(e.target.value)} className="bg-slate-50 border-slate-200 rounded-xl h-9 text-xs font-semibold">
                  <option value="Summary">Department Score Summary</option>
                  <option value="Environmental">Environmental (Carbon Ledger)</option>
                  <option value="Social">Social (CSR Activity Queue)</option>
                  <option value="Governance">Governance (Compliance / Audits)</option>
                  <option value="Gamification">Gamification (Challenges Log)</option>
                </Select>
              </label>

              <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Filter Department</span>
                <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="bg-slate-50 border-slate-200 rounded-xl h-9 text-xs font-semibold">
                  <option value="all">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </Select>
              </label>

              {(moduleId === "Social" || moduleId === "Governance" || moduleId === "Gamification") && (
                <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Filter Employee</span>
                  <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="bg-slate-50 border-slate-200 rounded-xl h-9 text-xs font-semibold">
                    <option value="all">All Employees</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </Select>
                </label>
              )}

              {moduleId === "Gamification" && (
                <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Filter Challenge</span>
                  <Select value={challengeId} onChange={(e) => setChallengeId(e.target.value)} className="bg-slate-50 border-slate-200 rounded-xl h-9 text-xs font-semibold">
                    <option value="all">All Challenges</option>
                    {challenges.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </label>
              )}

              {(moduleId === "Environmental" || moduleId === "Social" || moduleId === "Gamification") && (
                <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Filter ESG Category</span>
                  <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="bg-slate-50 border-slate-200 rounded-xl h-9 text-xs font-semibold">
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </label>
              )}

              <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Start Date</span>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-slate-50 border-slate-200 rounded-xl h-9 text-xs font-medium" />
              </label>

              <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>End Date</span>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-slate-50 border-slate-200 rounded-xl h-9 text-xs font-medium" />
              </label>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 flex items-center gap-1.5 text-xs font-semibold h-9">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Run Query</span>
              </Button>
              <Button variant="outline" asChild className="rounded-xl border-slate-200 hover:bg-slate-50 text-xs font-semibold h-9">
                <a href={getCSVLink()} className="flex items-center gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  <span>Export Filtered CSV</span>
                </a>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Query Results */}
      <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Query Ledger Results ({currentModule} Module)</CardTitle>
          <CardDescription className="text-xs">Filtered snapshot retrieved from active tables.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            {results.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-xs font-semibold">No records found matching current query parameters.</p>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  {currentModule === "Summary" && (
                    <TableRow>
                      <TableHead className="font-bold text-xs">Date Scored</TableHead>
                      <TableHead className="font-bold text-xs">Department</TableHead>
                      <TableHead className="font-bold text-xs text-right">Environmental</TableHead>
                      <TableHead className="font-bold text-xs text-right">Social</TableHead>
                      <TableHead className="font-bold text-xs text-right">Governance</TableHead>
                      <TableHead className="font-bold text-xs text-right">Total Score</TableHead>
                    </TableRow>
                  )}
                  {currentModule === "Environmental" && (
                    <TableRow>
                      <TableHead className="font-bold text-xs">Date Logged</TableHead>
                      <TableHead className="font-bold text-xs">Department</TableHead>
                      <TableHead className="font-bold text-xs">Source Type</TableHead>
                      <TableHead className="font-bold text-xs text-right">Quantity</TableHead>
                      <TableHead className="font-bold text-xs text-right">Computed CO2 (kg)</TableHead>
                      <TableHead className="font-bold text-center">Engine Mode</TableHead>
                    </TableRow>
                  )}
                  {currentModule === "Social" && (
                    <TableRow>
                      <TableHead className="font-bold text-xs">Date Logged</TableHead>
                      <TableHead className="font-bold text-xs">Employee Name</TableHead>
                      <TableHead className="font-bold text-xs">CSR Activity</TableHead>
                      <TableHead className="font-bold text-xs">Evidence URL</TableHead>
                      <TableHead className="font-bold text-xs text-right">Points</TableHead>
                      <TableHead className="font-bold text-center">Status</TableHead>
                    </TableRow>
                  )}
                  {currentModule === "Governance" && (
                    <TableRow>
                      <TableHead className="font-bold text-xs">Due Date</TableHead>
                      <TableHead className="font-bold text-xs">Description</TableHead>
                      <TableHead className="font-bold text-xs">Severity</TableHead>
                      <TableHead className="font-bold">Responsible Owner</TableHead>
                      <TableHead className="font-bold text-center">Status</TableHead>
                    </TableRow>
                  )}
                  {currentModule === "Gamification" && (
                    <TableRow>
                      <TableHead className="font-bold text-xs">Challenge Title</TableHead>
                      <TableHead className="font-bold text-xs">Employee Name</TableHead>
                      <TableHead className="font-bold text-xs text-right">Progress</TableHead>
                      <TableHead className="font-bold text-xs text-right">XP Earned</TableHead>
                      <TableHead className="font-bold text-center">Status</TableHead>
                    </TableRow>
                  )}
                </TableHeader>
                <TableBody>
                  {currentModule === "Summary" &&
                    results.map((r) => (
                      <TableRow key={r.id} className="hover:bg-slate-50/30 text-xs">
                        <TableCell className="font-medium text-slate-500">{new Date(r.computedAt).toLocaleDateString()}</TableCell>
                        <TableCell className="font-bold text-slate-800">{r.department?.name}</TableCell>
                        <TableCell className="text-right font-semibold text-slate-700">{r.environmentalScore.toFixed(1)}</TableCell>
                        <TableCell className="text-right font-semibold text-slate-700">{r.socialScore.toFixed(1)}</TableCell>
                        <TableCell className="text-right font-semibold text-slate-700">{r.governanceScore.toFixed(1)}</TableCell>
                        <TableCell className="text-right font-extrabold text-emerald-800">{r.totalScore.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}

                  {currentModule === "Environmental" &&
                    results.map((r) => (
                      <TableRow key={r.id} className="hover:bg-slate-50/30 text-xs">
                        <TableCell className="font-medium text-slate-500">{new Date(r.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-bold text-slate-800">{r.department?.name}</TableCell>
                        <TableCell className="font-semibold text-slate-700">{r.sourceType}</TableCell>
                        <TableCell className="text-right font-semibold text-slate-600">{r.quantity.toFixed(1)}</TableCell>
                        <TableCell className="text-right font-extrabold text-emerald-800">{r.computedCO2.toFixed(1)} kg</TableCell>
                        <TableCell className="text-center">
                          <Badge className={r.autoCalculated ? "bg-emerald-50 text-emerald-800 border-emerald-100 text-[9px] font-bold" : "bg-slate-50 text-slate-700 border-slate-100 text-[9px] font-bold"}>
                            {r.autoCalculated ? "AUTO" : "MANUAL"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}

                  {currentModule === "Social" &&
                    results.map((r) => (
                      <TableRow key={r.id} className="hover:bg-slate-50/30 text-xs">
                        <TableCell className="font-medium text-slate-500">
                          {r.completionDate ? new Date(r.completionDate).toLocaleDateString() : "Pending"}
                        </TableCell>
                        <TableCell className="font-bold text-slate-800">
                          <div>
                            <p>{r.employee?.name}</p>
                            <p className="text-[9px] text-slate-400 font-semibold">{r.employee?.department?.name}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-700">{r.activity.title}</TableCell>
                        <TableCell>
                          {r.proofUrl ? (
                            <a href={r.proofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold hover:text-blue-800 truncate block max-w-[120px]">{r.proofUrl}</a>
                          ) : (
                            <span className="text-slate-400 italic">None</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-800">{r.pointsEarned}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={r.approvalStatus === "Approved" ? "bg-emerald-50 text-emerald-800 border-emerald-100 text-[9px] font-bold" : "bg-amber-50 text-amber-800 border-amber-100 text-[9px] font-bold"}>
                            {r.approvalStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}

                  {currentModule === "Governance" &&
                    results.map((r) => (
                      <TableRow key={r.id} className="hover:bg-slate-50/30 text-xs">
                        <TableCell className="font-medium text-slate-500">{new Date(r.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-bold text-slate-800">{r.description}</p>
                            <p className="text-[9px] text-slate-400 font-semibold">Audit: {r.audit?.title} ({r.audit?.department?.name})</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={r.severity === "High" ? "text-red-800 border-red-200 bg-red-50/10 text-[9px] font-bold" : "text-amber-800 border-amber-200 bg-amber-50/10 text-[9px] font-bold"}>
                            {r.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-700">{r.owner?.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={r.status === "Open" ? "bg-amber-50 text-amber-800 border-amber-100 text-[9px] font-bold" : "bg-emerald-50 text-emerald-800 border-emerald-100 text-[9px] font-bold"}>
                            {r.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}

                  {currentModule === "Gamification" &&
                    results.map((r) => (
                      <TableRow key={r.id} className="hover:bg-slate-50/30 text-xs">
                        <TableCell className="font-bold text-slate-800">{r.challenge?.title}</TableCell>
                        <TableCell className="font-semibold text-slate-650">{r.employee?.name}</TableCell>
                        <TableCell className="text-right font-bold text-slate-700">{r.progress}%</TableCell>
                        <TableCell className="text-right font-extrabold text-amber-600">{r.xpAwarded} XP</TableCell>
                        <TableCell className="text-center">
                          <Badge className={r.approvalStatus === "Approved" ? "bg-emerald-50 text-emerald-800 border-emerald-100 text-[9px] font-bold" : "bg-amber-50 text-amber-800 border-amber-100 text-[9px] font-bold"}>
                            {r.approvalStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
