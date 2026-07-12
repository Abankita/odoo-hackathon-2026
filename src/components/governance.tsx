"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldAlert, CheckCircle2, Clock, ShieldCheck, ClipboardList, Sparkles } from "lucide-react";

type Policy = {
  id: number;
  title: string;
  category: { name: string };
  description: string;
  effectiveDate: string | Date;
  status: string;
  acknowledgements: Array<{ id: number; employee: { name: string } }>;
};

type Audit = {
  id: number;
  title: string;
  department: { name: string };
  auditorName: string;
  date: string | Date;
  findings: string;
  status: string;
};

type ComplianceIssue = {
  id: number;
  description: string;
  severity: string;
  dueDate: string | Date;
  status: string;
  isOverdue: boolean;
  owner: { name: string };
  audit: { title: string; department: { name: string } };
};

type NotificationItem = {
  id: number;
  type: string;
  message: string;
  createdAt: string | Date;
  recipient: { name: string };
};

type GovernanceProps = {
  policies: Policy[];
  audits: Audit[];
  issues: ComplianceIssue[];
  notifications: NotificationItem[];
  totalOpenIssues: number;
};

export function GovernanceClient({
  policies,
  audits,
  issues: initialIssues,
  notifications: initialNotifications,
  totalOpenIssues
}: GovernanceProps) {
  const router = useRouter();

  const [issues, setIssues] = useState<ComplianceIssue[]>(initialIssues);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const triggerFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleFlagOverdue = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/governance/flag-overdue", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      if (response.ok) {
        triggerFeedback(
          `System Scan Complete! Checked ${data.issueCount} open issues. Flagged ${data.updatedCount} new overdue issues and sent ${data.notificationsCreated} compliance alerts.`
        );
        router.refresh();
        // Slightly delay window reload to pull fresh data
        setTimeout(() => window.location.reload(), 1000);
      } else {
        triggerFeedback("System scan failed.");
      }
    } catch {
      triggerFeedback("Network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {feedback && (
        <div className="fixed bottom-5 right-5 z-50 bg-violet-950 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-violet-800 animate-in fade-in slide-in-from-bottom-5">
          <Sparkles className="h-5 w-5 text-amber-300 shrink-0" />
          <span className="text-sm font-semibold">{feedback}</span>
        </div>
      )}

      {/* Summary grid */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Governance Policies</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{policies.length} Active</p>
            </div>
            <div className="p-3 bg-violet-50 rounded-2xl text-violet-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Audits Logged</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{audits.length} Audits</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl text-slate-600">
              <ClipboardList className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Open Compliance Issues</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{totalOpenIssues} Open</p>
            </div>
            <div className="p-3 bg-red-50 rounded-2xl text-red-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Compliance scanning action */}
      <Card className="shadow-sm border-slate-100 bg-white">
        <CardHeader>
          <CardTitle>Compliance Engine Scan</CardTitle>
          <CardDescription>
            Flag overdue issues against their due dates and trigger automated warning alerts for responsible owners.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleFlagOverdue}
            disabled={isLoading}
            className="bg-violet-700 hover:bg-violet-800 text-white rounded-xl px-5"
          >
            {isLoading ? "Scanning..." : "Execute Compliance Overdue Scan"}
          </Button>
        </CardContent>
      </Card>

      {/* Compliance Issues list */}
      <Card className="shadow-sm bg-white">
        <CardHeader>
          <CardTitle>Compliance Registry</CardTitle>
          <CardDescription>Active audits issues with severity tags and overdue monitoring.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold">Issue Description</TableHead>
                  <TableHead className="font-bold">Severity</TableHead>
                  <TableHead className="font-bold">Responsible Owner</TableHead>
                  <TableHead className="font-bold">Due Date</TableHead>
                  <TableHead className="font-bold text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-400 py-6">
                      No compliance issues logged.
                    </TableCell>
                  </TableRow>
                ) : (
                  issues.map((issue) => {
                    const now = new Date();
                    const isOverdue = issue.status === "Open" && (issue.isOverdue || new Date(issue.dueDate) < now);

                    let sevTone = "bg-blue-50 text-blue-800 border-blue-100";
                    if (issue.severity === "High") {
                      sevTone = "bg-red-50 text-red-800 border-red-100";
                    } else if (issue.severity === "Medium") {
                      sevTone = "bg-amber-50 text-amber-800 border-amber-100";
                    }

                    return (
                      <TableRow
                        key={issue.id}
                        className={`hover:bg-slate-50/50 ${isOverdue ? "bg-red-50/30 hover:bg-red-50/40" : ""}`}
                      >
                        <TableCell>
                          <div>
                            <p className="font-bold text-slate-800">{issue.description}</p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              From: {issue.audit.title} ({issue.audit.department.name})
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${sevTone} text-[10px] font-bold`}>{issue.severity}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-700">{issue.owner.name}</TableCell>
                        <TableCell className="font-medium text-slate-600">
                          {new Date(issue.dueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-center">
                          {isOverdue ? (
                            <Badge className="bg-red-900 border-red-800 text-white text-[10px] font-bold flex items-center justify-center gap-1 mx-auto max-w-[90px] animate-pulse">
                              <Clock className="h-3 w-3" />
                              <span>OVERDUE</span>
                            </Badge>
                          ) : (
                            <Badge
                              className={`text-[10px] font-bold ${
                                issue.status === "Open"
                                  ? "bg-amber-50 text-amber-800 border-amber-100"
                                  : "bg-emerald-50 text-emerald-800 border-emerald-100"
                              }`}
                            >
                              {issue.status}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Policies and Audits Grid */}
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Policies catalog */}
        <Card className="shadow-sm bg-white">
          <CardHeader>
            <CardTitle>ESG Policies & Acknowledgements</CardTitle>
            <CardDescription>Published policies catalog and tracking acknowledgement signatures.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {policies.map((policy) => (
              <div key={policy.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <Badge className="bg-violet-50 text-violet-800 border-violet-100 text-[10px] font-bold uppercase">
                    {policy.category.name}
                  </Badge>
                  <Badge className={policy.status === "Active" ? "bg-emerald-50 text-emerald-800 border-emerald-100 text-[10px]" : "bg-slate-50 text-slate-700 border-slate-100 text-[10px]"}>
                    {policy.status}
                  </Badge>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{policy.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-3">{policy.description}</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Effective: {new Date(policy.effectiveDate).toLocaleDateString()}</span>
                  <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    {policy.acknowledgements.length} Signed
                  </span>
                </div>
                {policy.acknowledgements.length > 0 && (
                  <div className="pt-1.5 flex flex-wrap gap-1">
                    {policy.acknowledgements.map((ack) => (
                      <span key={ack.id} className="text-[9px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
                        ✓ {ack.employee.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Audits records */}
        <Card className="shadow-sm bg-white">
          <CardHeader>
            <CardTitle>ESG Audit Trail</CardTitle>
            <CardDescription>Independent environmental and compliance audits by department.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {audits.map((audit) => (
              <div key={audit.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px]">
                    {audit.department.name}
                  </Badge>
                  <Badge className={audit.status === "Completed" ? "bg-emerald-50 text-emerald-800 border-emerald-100 text-[10px]" : "bg-amber-50 text-amber-800 border-amber-100 text-[10px]"}>
                    {audit.status}
                  </Badge>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{audit.title}</h4>
                <p className="text-xs text-slate-500 font-semibold">Auditor: {audit.auditorName}</p>
                <p className="text-xs text-slate-600 bg-white border border-slate-100 p-2 rounded-lg italic">
                  &ldquo;{audit.findings}&rdquo;
                </p>
                <span className="block text-[10px] text-slate-400">
                  Audited on: {new Date(audit.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Notifications and Alert list */}
      <Card className="shadow-sm bg-white">
        <CardHeader>
          <CardTitle>Security & Compliance Notifications Logs</CardTitle>
          <CardDescription>Recent automated audit logging events generated by system triggers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No recent compliance alerts.</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="h-2 w-2 rounded-full bg-violet-600 mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded">
                      {notification.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{notification.message}</p>
                  <p className="text-xs text-slate-500">Sent to: {notification.recipient.name}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
