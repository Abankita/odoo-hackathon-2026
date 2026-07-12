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
          `System Scan: Checked ${data.issueCount} issues. Flagged ${data.updatedCount} overdue items, sent ${data.notificationsCreated} alerts.`
        );
        router.refresh();
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
    <div className="space-y-8 font-sans">
      {/* Toast Alert */}
      {feedback && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800 animate-in fade-in slide-in-from-bottom-5">
          <Sparkles className="h-5 w-5 text-amber-300 shrink-0 animate-pulse" />
          <span className="text-sm font-semibold">{feedback}</span>
        </div>
      )}

      {/* Summary grid */}
      <section className="grid gap-5 md:grid-cols-3">
        <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Published Policies</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{policies.length} Active</p>
            </div>
            <div className="p-3 bg-violet-50/60 rounded-xl border border-violet-100/60 text-violet-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Audits</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{audits.length} Audits</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
              <ClipboardList className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Compliance Issues</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{totalOpenIssues} Open</p>
            </div>
            <div className="p-3 bg-red-50/60 rounded-xl border border-red-100/60 text-red-650">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Compliance scan bar */}
      <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Overdue Compliance Engine Scan</CardTitle>
          <CardDescription className="text-xs">
            Query compliance deadlines and flag overdue issues on the audit registry dynamically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleFlagOverdue}
            disabled={isLoading}
            className="bg-violet-750 hover:bg-violet-850 text-white rounded-xl px-5 text-xs font-semibold h-9"
          >
            {isLoading ? "Executing Scan..." : "Run Compliance Deadline Scan"}
          </Button>
        </CardContent>
      </Card>

      {/* Compliance Issues list */}
      <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Compliance Issues Register</CardTitle>
          <CardDescription className="text-xs">Active audits issues with severity tags and overdue warnings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold text-xs">Issue Description</TableHead>
                  <TableHead className="font-bold text-xs">Severity</TableHead>
                  <TableHead className="font-bold text-xs">Responsible Owner</TableHead>
                  <TableHead className="font-bold text-xs">Due Date</TableHead>
                  <TableHead className="font-bold text-xs text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-400 py-6 text-xs font-medium">
                      No compliance issues logged.
                    </TableCell>
                  </TableRow>
                ) : (
                  issues.map((issue) => {
                    const now = new Date();
                    const isOverdue = issue.status === "Open" && (issue.isOverdue || new Date(issue.dueDate) < now);

                    let sevTone = "text-blue-800 border-blue-200 bg-blue-50/20";
                    if (issue.severity === "High") {
                      sevTone = "text-red-800 border-red-200 bg-red-50/20";
                    } else if (issue.severity === "Medium") {
                      sevTone = "text-amber-800 border-amber-200 bg-amber-50/20";
                    }

                    return (
                      <TableRow
                        key={issue.id}
                        className={`hover:bg-slate-50/30 text-xs ${isOverdue ? "bg-red-50/20 hover:bg-red-50/30" : ""}`}
                      >
                        <TableCell>
                          <div>
                            <p className="font-bold text-slate-800">{issue.description}</p>
                            <p className="text-[9px] text-slate-400 font-semibold">
                              Audit: {issue.audit?.title} ({issue.audit?.department?.name})
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${sevTone} text-[9px] font-bold`}>{issue.severity}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-700">{issue.owner?.name}</TableCell>
                        <TableCell className="font-medium text-slate-600">
                          {new Date(issue.dueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-center">
                          {isOverdue ? (
                            <Badge className="bg-red-800 border-red-700 text-white text-[9px] font-bold flex items-center justify-center gap-1 mx-auto max-w-[85px] animate-pulse">
                              <Clock className="h-3 w-3" />
                              <span>OVERDUE</span>
                            </Badge>
                          ) : (
                            <Badge
                              className={`text-[9px] font-bold ${
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

      {/* Policies and Audits */}
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Policies catalog */}
        <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Policies & Acknowledgements</CardTitle>
            <CardDescription className="text-xs">Enterprise policy catalog and signed employee registry.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
            {policies.map((policy) => (
              <div key={policy.id} className="border border-slate-100 rounded-xl p-4 bg-white space-y-2 shadow-sm">
                <div className="flex justify-between items-start gap-2">
                  <Badge variant="outline" className="text-violet-850 border-violet-200 bg-violet-50/10 text-[9px] font-bold uppercase">
                    {policy.category?.name}
                  </Badge>
                  <Badge variant="outline" className={policy.status === "Active" ? "text-emerald-800 border-emerald-200 bg-emerald-50/10 text-[9px]" : "text-slate-500 border-slate-200 text-[9px]"}>
                    {policy.status}
                  </Badge>
                </div>
                <h4 className="text-xs font-bold text-slate-900">{policy.title}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">{policy.description}</p>
                <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                  <span>Effective: {new Date(policy.effectiveDate).toLocaleDateString()}</span>
                  <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    {policy.acknowledgements.length} Acknowledged
                  </span>
                </div>
                {policy.acknowledgements.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1 border-t border-slate-50/50">
                    {policy.acknowledgements.map((ack) => (
                      <span key={ack.id} className="text-[9px] bg-slate-50 text-slate-600 border border-slate-100 px-1.5 py-0.5 rounded font-medium">
                        ✓ {ack.employee?.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Audits records */}
        <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Independent ESG Audits Log</CardTitle>
            <CardDescription className="text-xs">Auditors findings and certifications by department.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
            {audits.map((audit) => (
              <div key={audit.id} className="border border-slate-100 rounded-xl p-4 bg-white space-y-2 shadow-sm">
                <div className="flex justify-between items-start gap-2">
                  <Badge variant="outline" className="text-slate-700 border-slate-200 bg-slate-50 text-[9px] font-bold">
                    {audit.department?.name}
                  </Badge>
                  <Badge variant="outline" className={audit.status === "Completed" ? "text-emerald-800 border-emerald-200 bg-emerald-50/10 text-[9px]" : "text-amber-800 border-amber-200 bg-amber-50/10 text-[9px]"}>
                    {audit.status}
                  </Badge>
                </div>
                <h4 className="text-xs font-bold text-slate-900">{audit.title}</h4>
                <p className="text-[10px] text-slate-400 font-semibold leading-none">Auditor: {audit.auditorName}</p>
                <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 p-2.5 rounded-lg italic">
                  &ldquo;{audit.findings}&rdquo;
                </p>
                <span className="block text-[10px] text-slate-400 font-medium">
                  Scan Date: {new Date(audit.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Notifications and alert logs */}
      <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Governance & Compliance Alerts Log</CardTitle>
          <CardDescription className="text-xs">Real-time alerts log generated by compliance scan actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.length === 0 ? (
            <p className="text-xs text-slate-455 text-center py-4">No recent compliance alerts.</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-colors shadow-sm"
              >
                <div className="h-2 w-2 rounded-full bg-violet-600 mt-1.5 shrink-0 animate-pulse" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-violet-755 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded">
                      {notification.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">{notification.message}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Addressed to: {notification.recipient?.name}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
