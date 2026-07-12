"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getStorageItem, setStorageItem } from "@/lib/storage";
import { Users, Heart, Sparkles, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

type Employee = { id: number; name: string; department: { name: string } };

type CSRActivity = {
  id: number;
  title: string;
  description: string;
  evidenceRequired: boolean;
  date: string | Date;
  status: string;
  category: { name: string };
};

type Participation = {
  id: number;
  employeeId: number;
  activityId: number;
  proofUrl: string | null;
  approvalStatus: string;
  pointsEarned: number;
  completionDate: string | Date | null;
  employee: { name: string; department: { name: string } };
  activity: { title: string; evidenceRequired: boolean };
};

type SocialProps = {
  employees: Employee[];
  activities: CSRActivity[];
  participations: Participation[];
};

export function SocialClient({ employees, activities, participations: initialParticipations }: SocialProps) {
  const router = useRouter();

  const [participations, setParticipations] = useState<Participation[]>(initialParticipations);
  const [activitiesList, setActivitiesList] = useState<CSRActivity[]>(activities);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number>(employees[0]?.id || 1);
  const [proofUrl, setProofUrl] = useState<string>("");
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Sync activities with initial prop + localStorage
  useEffect(() => {
    setActivitiesList((prev) => {
      const local = getStorageItem<CSRActivity[]>("custom_activities", []);
      const merged = [...activities];
      const all = [...merged, ...local, ...prev];
      const unique = all.filter((item, index, self) =>
        index === self.findIndex((t) => t.id === item.id)
      );
      return unique;
    });
  }, [activities]);

  // Load custom activities on initial mount
  useEffect(() => {
    const local = getStorageItem<CSRActivity[]>("custom_activities", []);
    if (local.length > 0) {
      setActivitiesList((prev) => {
        const merged = [...prev];
        for (const a of local) {
          if (!merged.some((m) => m.id === a.id)) {
            merged.push(a);
          }
        }
        return merged;
      });
    }
  }, []);

  // Sync state props with refreshed database content (using robust merge + local storage)
  useEffect(() => {
    setParticipations((prev) => {
      const local = getStorageItem<Participation[]>("custom_csr_participations", []);
      const merged = [...initialParticipations];
      const all = [...merged, ...local, ...prev];
      const unique = all.filter((item, index, self) =>
        index === self.findIndex((t) => t.id === item.id || (t.activityId === item.activityId && t.employeeId === item.employeeId))
      );
      return unique;
    });
  }, [initialParticipations]);

  // Load custom localStorage logs on initial mount
  useEffect(() => {
    const local = getStorageItem<Participation[]>("custom_csr_participations", []);
    if (local.length > 0) {
      setParticipations((prev) => {
        const merged = [...prev];
        for (const p of local) {
          if (!merged.some((m) => m.id === p.id || (m.activityId === p.activityId && m.employeeId === p.employeeId))) {
            merged.push(p);
          }
        }
        return merged;
      });
    }
  }, []);

  const activeEmployee = employees.find((e) => e.id === selectedEmployeeId);

  // Compute stats
  const approvedCount = participations.filter((p) => p.approvalStatus === "Approved").length;
  const uniqueVolunteers = new Set(participations.filter((p) => p.approvalStatus === "Approved").map((p) => p.employeeId)).size;
  const totalServiceHours = approvedCount * 4;

  const triggerFeedback = (text: string, type: "success" | "error") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleJoinCSR = async (activityId: number, activityTitle: string) => {
    try {
      const response = await fetch("/api/social/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          activityId,
          proofUrl: proofUrl.trim() || null
        })
      });
      const data = await response.json();
      if (response.ok) {
        const freshPart: Participation = {
          ...data,
          employee: {
            name: activeEmployee?.name || "",
            department: { name: activeEmployee?.department?.name || "" }
          },
          activity: {
            title: activityTitle,
            evidenceRequired: activitiesList.find((a) => a.id === activityId)?.evidenceRequired ?? true
          }
        };
        const updated = [freshPart, ...participations];
        setParticipations(updated);

        // Save to localStorage
        const local = getStorageItem<Participation[]>("custom_csr_participations", []);
        const filtered = local.filter((item) => !(item.activityId === data.activityId && item.employeeId === data.employeeId));
        setStorageItem("custom_csr_participations", [freshPart, ...filtered]);

        triggerFeedback("Successfully signed up for CSR activity!", "success");
        setProofUrl("");
        router.refresh();
      } else {
        triggerFeedback(data.error || "Failed to join activity.", "error");
      }
    } catch {
      triggerFeedback("Network error occurred.", "error");
    }
  };

  const handleProcessApproval = async (participationId: number, action: "approve" | "reject") => {
    try {
      const response = await fetch("/api/social/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participationId, action })
      });
      const data = await response.json();
      if (response.ok && (action === "reject" || data.success)) {
        setParticipations(
          participations.map((p) =>
            p.id === participationId ? { ...p, approvalStatus: action === "approve" ? "Approved" : "Rejected" } : p
          )
        );
        triggerFeedback(
          action === "approve" ? "Approved and points awarded!" : "Participation request rejected.",
          "success"
        );
        router.refresh();
      } else {
        triggerFeedback(data.reason || data.error || "Action blocked by validation rules.", "error");
      }
    } catch {
      triggerFeedback("Network error occurred.", "error");
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Toast feedback */}
      {feedback && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border animate-in fade-in slide-in-from-bottom-5 ${
            feedback.type === "success" ? "bg-slate-900 border-slate-800 text-white" : "bg-red-900 border-red-800 text-white"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" /> : <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />}
          <span className="text-sm font-semibold">{feedback.text}</span>
        </div>
      )}

      {/* Viewing context bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">DEMO CONTEXT SELECTOR</span>
          <h2 className="text-base font-bold text-slate-900">
            Active Employee: {activeEmployee?.name} ({activeEmployee?.department?.name})
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-semibold hidden md:inline">Acting as:</span>
          <Select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
            className="w-full sm:w-56 bg-slate-50 border-slate-200 text-xs font-semibold rounded-xl"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.department?.name})
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Stats summary grid */}
      <section className="grid gap-5 md:grid-cols-3">
        <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Volunteer Headcount</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{uniqueVolunteers} employees</p>
            </div>
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100/60 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Service Hours Logged</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{totalServiceHours} hrs</p>
            </div>
            <div className="p-3 bg-red-50/60 rounded-xl border border-red-100/60 text-red-600">
              <Heart className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Diversity Index (Gender)</p>
              <p className="mt-2 text-3xl font-black text-slate-900">38.5% ratio</p>
            </div>
            <div className="p-3 bg-violet-50/60 rounded-xl border border-violet-100/60 text-violet-600">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CSR Activity Grid */}
      <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">CSR Activities Register</CardTitle>
          <CardDescription className="text-xs">
            Join environmental and social volunteering programs. Input verification proof link if required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-white border border-slate-100 rounded-2xl max-w-xl space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Volunteering Evidence Verification Link</span>
            <Input
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="e.g. https://evidence-link.com/volunteer-photo.jpg"
              className="bg-slate-50 border-slate-200 rounded-xl text-xs h-9"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {activitiesList.map((activity) => {
              const joined = participations.some(
                (p) => p.activityId === activity.id && p.employeeId === selectedEmployeeId
              );

              return (
                <div
                  key={activity.id}
                  className="border border-slate-100 rounded-2xl bg-white p-5 flex flex-col justify-between hover:border-slate-200 transition-all shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <Badge variant="outline" className="text-blue-800 border-blue-200 bg-blue-50/20 text-[9px] font-bold uppercase">
                        {activity.category?.name}
                      </Badge>
                      <Badge variant="outline" className={activity.evidenceRequired ? "text-red-800 border-red-200 bg-red-50/20 text-[9px]" : "text-slate-600 border-slate-200 bg-slate-50 text-[9px]"}>
                        {activity.evidenceRequired ? "Proof Required" : "No Proof Needed"}
                      </Badge>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 leading-tight">{activity.title}</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{activity.description}</p>
                    <span className="inline-block text-[10px] text-slate-400 font-bold">
                      Event Date: {new Date(activity.date).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-4 pt-2">
                    {joined ? (
                      <Button disabled className="w-full rounded-xl bg-slate-50 text-slate-400 border border-slate-100 text-xs h-9 cursor-not-allowed font-bold">
                        Awaiting Verification approval
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleJoinCSR(activity.id, activity.title)}
                        className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold h-9"
                      >
                        Join Activity
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Participation Queue */}
      <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-bold">Participation Approvals queue</CardTitle>
          <CardDescription className="text-xs">
            Review submitted logs and award points. Strict checks verify proof links based on active policies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold text-xs">Employee</TableHead>
                  <TableHead className="font-bold text-xs">CSR Activity</TableHead>
                  <TableHead className="font-bold text-xs">Evidence URL</TableHead>
                  <TableHead className="font-bold text-xs">Policy check</TableHead>
                  <TableHead className="font-bold text-xs text-center">Status</TableHead>
                  <TableHead className="font-bold text-xs text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-400 py-6 text-xs font-medium">
                      No signups logged.
                    </TableCell>
                  </TableRow>
                ) : (
                  participations.map((part) => (
                    <TableRow key={part.id} className="hover:bg-slate-50/50 text-xs">
                      <TableCell className="font-bold text-slate-800">
                        <div>
                          <p>{part.employee?.name}</p>
                          <p className="text-[9px] text-slate-400 font-semibold">{part.employee?.department?.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-700">{part.activity.title}</TableCell>
                      <TableCell>
                        {part.proofUrl ? (
                          <a
                            href={part.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline font-semibold hover:text-blue-800 truncate block max-w-[130px]"
                          >
                            {part.proofUrl}
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={part.activity.evidenceRequired ? "text-amber-800 border-amber-200 bg-amber-50/10 text-[9px]" : "text-slate-600 border-slate-200 text-[9px]"}>
                          {part.activity.evidenceRequired ? "Proof Required" : "Optional"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={`text-[9px] font-bold ${
                            part.approvalStatus === "Approved"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                              : part.approvalStatus === "Pending"
                              ? "bg-amber-50 text-amber-800 border-amber-100"
                              : "bg-red-50 text-red-800 border-red-100"
                          }`}
                        >
                          {part.approvalStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {part.approvalStatus === "Pending" && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleProcessApproval(part.id, "approve")}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg px-3.5 py-1 h-8 text-xs font-semibold"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleProcessApproval(part.id, "reject")}
                              className="rounded-lg px-3.5 py-1 h-8 text-xs font-semibold"
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
