"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number>(employees[0]?.id || 1);
  const [proofUrl, setProofUrl] = useState<string>("");
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const activeEmployee = employees.find((e) => e.id === selectedEmployeeId);

  // Compute simple Diversity / Social Stats
  const approvedCount = participations.filter((p) => p.approvalStatus === "Approved").length;
  const uniqueVolunteers = new Set(participations.filter((p) => p.approvalStatus === "Approved").map((p) => p.employeeId)).size;
  const totalServiceHours = approvedCount * 4; // Assume 4 hours per CSR activity

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
        // Prepend new record locally
        const freshPart: Participation = {
          ...data,
          employee: {
            name: activeEmployee?.name || "",
            department: { name: activeEmployee?.department.name || "" }
          },
          activity: {
            title: activityTitle,
            evidenceRequired: activities.find((a) => a.id === activityId)?.evidenceRequired ?? true
          }
        };
        setParticipations([freshPart, ...participations]);
        triggerFeedback("Joined CSR Activity successfully! Submission added to approval queue.", "success");
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
          action === "approve" ? "Participation approved! Points and XP awarded." : "Participation rejected.",
          "success"
        );
        router.refresh();
      } else {
        triggerFeedback(data.reason || data.error || "Action blocked by business rules.", "error");
      }
    } catch {
      triggerFeedback("Network error occurred.", "error");
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast alert */}
      {feedback && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border animate-in fade-in slide-in-from-bottom-5 ${
            feedback.type === "success" ? "bg-emerald-900 border-emerald-800 text-white" : "bg-red-900 border-red-800 text-white"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="text-sm font-semibold">{feedback.text}</span>
        </div>
      )}

      {/* Viewing persona selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Viewing Persona</span>
          <h2 className="text-base font-semibold text-slate-900">
            Current Employee: {activeEmployee?.name} ({activeEmployee?.department.name})
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 hidden md:inline">Change employee:</span>
          <Select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
            className="w-full sm:w-56 bg-slate-50 border-slate-200"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.department.name})
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Social / Diversity Dashboard */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Volunteer Headcount</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{uniqueVolunteers} employees</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Hours of Service Logged</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{totalServiceHours} hours</p>
            </div>
            <div className="p-3 bg-red-50 rounded-2xl text-red-600">
              <Heart className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Diversity Index (Gender)</p>
              <p className="mt-2 text-3xl font-black text-slate-900">38.5% ratio</p>
            </div>
            <div className="p-3 bg-violet-50 rounded-2xl text-violet-600">
              <Sparkles className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CSR Activity Grid */}
      <Card className="shadow-sm bg-white">
        <CardHeader>
          <CardTitle>CSR Activities Console</CardTitle>
          <CardDescription>
            Join active CSR activities. Provide a link to evidence (if required by organization policies).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl max-w-xl space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase">Step 1: Enter Evidence URL (optional/required)</span>
            <Input
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="e.g., https://evidence-link.com/photo.jpg"
              className="bg-white border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {activities.map((activity) => {
              const joined = participations.some(
                (p) => p.activityId === activity.id && p.employeeId === selectedEmployeeId
              );

              return (
                <div
                  key={activity.id}
                  className="border border-slate-100 rounded-2xl bg-white p-5 flex flex-col justify-between hover:border-slate-200 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <Badge className="bg-blue-50 text-blue-800 border-blue-100 text-[10px] font-bold uppercase">
                        {activity.category.name}
                      </Badge>
                      <Badge className={activity.evidenceRequired ? "bg-red-50 text-red-800 border-red-100 text-[10px] font-bold" : "bg-slate-50 text-slate-700 border-slate-100 text-[10px] font-bold"}>
                        {activity.evidenceRequired ? "Proof Required" : "No Proof Required"}
                      </Badge>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 pt-1">{activity.title}</h4>
                    <p className="text-sm text-slate-500">{activity.description}</p>
                    <span className="inline-block text-xs text-slate-400 pt-1">
                      Event Date: {new Date(activity.date).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-4 pt-2">
                    {joined ? (
                      <Button disabled className="w-full rounded-xl bg-slate-100 text-slate-400 border border-slate-100 cursor-not-allowed">
                        Signed Up (Pending Review)
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleJoinCSR(activity.id, activity.title)}
                        className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white"
                      >
                        Sign Up & Join
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
      <Card className="shadow-sm bg-white">
        <CardHeader>
          <CardTitle>CSR Participation Queue</CardTitle>
          <CardDescription>
            Approve or reject employee participation submissions. Blocked if evidence is missing and org policy requires it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold">Employee</TableHead>
                  <TableHead className="font-bold">CSR Activity</TableHead>
                  <TableHead className="font-bold">Evidence (Proof URL)</TableHead>
                  <TableHead className="font-bold">Required</TableHead>
                  <TableHead className="font-bold text-center">Status</TableHead>
                  <TableHead className="font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-400 py-6">
                      No participation entries found.
                    </TableCell>
                  </TableRow>
                ) : (
                  participations.map((part) => (
                    <TableRow key={part.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-bold text-slate-800">
                        <div>
                          <p>{part.employee.name}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{part.employee.department.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-700">{part.activity.title}</TableCell>
                      <TableCell>
                        {part.proofUrl ? (
                          <a
                            href={part.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 underline font-medium hover:text-blue-800 break-all"
                          >
                            {part.proofUrl}
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">None attached</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={part.activity.evidenceRequired ? "bg-amber-50 text-amber-800 border-amber-100 text-[10px]" : "bg-slate-50 text-slate-600 border-slate-100 text-[10px]"}>
                          {part.activity.evidenceRequired ? "YES" : "NO"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={`text-[10px] font-bold ${
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
                              className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg px-3 py-1 h-8 text-xs font-semibold"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleProcessApproval(part.id, "reject")}
                              className="rounded-lg px-3 py-1 h-8 text-xs font-semibold"
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
