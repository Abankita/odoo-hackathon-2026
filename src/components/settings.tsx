"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, Plus, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";

type Department = {
  id: number;
  name: string;
  code: string;
  head: string;
  employeeCount: number;
  status: string;
};

type Category = {
  id: number;
  name: string;
  type: string;
  status: string;
};

type OrgConfig = {
  id: number;
  envWeight: number;
  socialWeight: number;
  govWeight: number;
  autoEmissionCalc: boolean;
  evidenceRequired: boolean;
  badgeAutoAward: boolean;
  emailAlerts: boolean;
};

type SettingsProps = {
  config: OrgConfig;
  departments: Department[];
  categories: Category[];
};

export function SettingsClient({ config, departments: initialDepartments, categories: initialCategories }: SettingsProps) {
  const router = useRouter();

  // Local state lists
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [categories, setCategories] = useState<Category[]>(initialCategories);

  // Form states
  const [envWeight, setEnvWeight] = useState(config.envWeight);
  const [socialWeight, setSocialWeight] = useState(config.socialWeight);
  const [govWeight, setGovWeight] = useState(config.govWeight);
  const [autoEmissionCalc, setAutoEmissionCalc] = useState(config.autoEmissionCalc);
  const [evidenceRequired, setEvidenceRequired] = useState(config.evidenceRequired);
  const [badgeAutoAward, setBadgeAutoAward] = useState(config.badgeAutoAward);
  const [emailAlerts, setEmailAlerts] = useState(config.emailAlerts);

  const [deptForm, setDeptForm] = useState({ name: "", code: "", head: "", employeeCount: 0 });
  const [catForm, setCatForm] = useState({ name: "", type: "CSR_ACTIVITY" });

  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const weightSum = envWeight + socialWeight + govWeight;
  const isWeightsValid = weightSum === 100;

  const triggerFeedback = (text: string, type: "success" | "error") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWeightsValid) {
      triggerFeedback(`Weights must sum to exactly 100 (Current total: ${weightSum})`, "error");
      return;
    }

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          envWeight,
          socialWeight,
          govWeight,
          autoEmissionCalc,
          evidenceRequired,
          badgeAutoAward,
          emailAlerts
        })
      });
      const data = await response.json();
      if (response.ok) {
        triggerFeedback("Configuration saved successfully! All department scores recalculated.", "success");
        router.refresh();
      } else {
        triggerFeedback(data.error || "Failed to save configuration.", "error");
      }
    } catch {
      triggerFeedback("Network error occurred.", "error");
    }
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name || !deptForm.code || !deptForm.head) {
      triggerFeedback("All fields are required.", "error");
      return;
    }
    try {
      const response = await fetch("/api/settings/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deptForm)
      });
      const data = await response.json();
      if (response.ok) {
        setDepartments([...departments, data]);
        triggerFeedback(`Department '${data.name}' added successfully!`, "success");
        setDeptForm({ name: "", code: "", head: "", employeeCount: 0 });
        router.refresh();
      } else {
        triggerFeedback(data.error || "Failed to add department.", "error");
      }
    } catch {
      triggerFeedback("Network error occurred.", "error");
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name) {
      triggerFeedback("Category name is required.", "error");
      return;
    }
    try {
      const response = await fetch("/api/settings/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catForm)
      });
      const data = await response.json();
      if (response.ok) {
        setCategories([...categories, data]);
        triggerFeedback(`ESG Category '${data.name}' added!`, "success");
        setCatForm({ name: "", type: "CSR_ACTIVITY" });
        router.refresh();
      } else {
        triggerFeedback(data.error || "Failed to add category.", "error");
      }
    } catch {
      triggerFeedback("Network error occurred.", "error");
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Toast Alert */}
      {feedback && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border animate-in fade-in slide-in-from-bottom-5 ${
            feedback.type === "success" ? "bg-emerald-900 border-emerald-800 text-white" : "bg-red-900 border-red-800 text-white"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          <span className="text-sm font-semibold">{feedback.text}</span>
        </div>
      )}

      {/* Weighting and Config Toggles */}
      <Card className="shadow-sm bg-white">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-700" />
            <CardTitle>Global ESG Configuration</CardTitle>
          </div>
          <CardDescription>
            Modify corporate ESG weight coefficients and operational automation rules.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveConfig} className="space-y-6">
            
            {/* Weight sliders */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-700">Recalculation Weights (Must sum to 100)</span>
                <Badge className={isWeightsValid ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-red-50 text-red-800 border-red-100 animate-pulse"}>
                  Total: {weightSum}%
                </Badge>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500 uppercase">
                  <span>Environmental weight (%)</span>
                  <Input type="number" value={envWeight} onChange={(e) => setEnvWeight(Number(e.target.value))} className="bg-slate-50 border-slate-200 rounded-xl" min={0} max={100} />
                </label>
                <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500 uppercase">
                  <span>Social weight (%)</span>
                  <Input type="number" value={socialWeight} onChange={(e) => setSocialWeight(Number(e.target.value))} className="bg-slate-50 border-slate-200 rounded-xl" min={0} max={100} />
                </label>
                <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500 uppercase">
                  <span>Governance weight (%)</span>
                  <Input type="number" value={govWeight} onChange={(e) => setGovWeight(Number(e.target.value))} className="bg-slate-50 border-slate-200 rounded-xl" min={0} max={100} />
                </label>
              </div>
            </div>

            <Separator />

            {/* Automation Toggles */}
            <div className="space-y-4">
              <span className="text-sm font-bold text-slate-700 block">Operational Rules Engine Toggles</span>
              <div className="grid gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500 uppercase">
                  <span>Auto Emission Calculator</span>
                  <Select value={autoEmissionCalc ? "true" : "false"} onChange={(e) => setAutoEmissionCalc(e.target.value === "true")} className="bg-slate-50 border-slate-200 rounded-xl">
                    <option value="true">ENABLED: Auto calculate CO2</option>
                    <option value="false">DISABLED: Require manual CO2 entry</option>
                  </Select>
                </label>
                <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500 uppercase">
                  <span>Evidence Required Policy</span>
                  <Select value={evidenceRequired ? "true" : "false"} onChange={(e) => setEvidenceRequired(e.target.value === "true")} className="bg-slate-50 border-slate-200 rounded-xl">
                    <option value="true">STRICT: Block approval without proof URLs</option>
                    <option value="false">FLEXIBLE: Allow approval without proof URLs</option>
                  </Select>
                </label>
                <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500 uppercase">
                  <span>Badge Auto-Award Toggles</span>
                  <Select value={badgeAutoAward ? "true" : "false"} onChange={(e) => setBadgeAutoAward(e.target.value === "true")} className="bg-slate-50 border-slate-200 rounded-xl">
                    <option value="true">AUTOMATIC: Unlock badges on threshold hits</option>
                    <option value="false">MANUAL: Hold badges for admin review</option>
                  </Select>
                </label>
                <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500 uppercase">
                  <span>System Email Alerts</span>
                  <Select value={emailAlerts ? "true" : "false"} onChange={(e) => setEmailAlerts(e.target.value === "true")} className="bg-slate-50 border-slate-200 rounded-xl">
                    <option value="true">ENABLED: Dispatch compliance email notifications</option>
                    <option value="false">DISABLED: Log notifications silently</option>
                  </Select>
                </label>
              </div>
            </div>

            <Button type="submit" disabled={!isWeightsValid} className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl px-6">
              Save ESG Configuration
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Departments & Categories lists */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Departments CRUD */}
        <Card className="shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Departments Register</CardTitle>
            <CardDescription>Track operational scopes, head counts, and manager heads.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddDept} className="grid gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-xs font-bold text-slate-400 uppercase">Register Department</span>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} placeholder="Dept Name" className="bg-white border-slate-200 rounded-lg text-xs h-9" />
                <Input value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} placeholder="Code (e.g. MFG)" className="bg-white border-slate-200 rounded-lg text-xs h-9" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={deptForm.head} onChange={(e) => setDeptForm({ ...deptForm, head: e.target.value })} placeholder="Head Director Name" className="bg-white border-slate-200 rounded-lg text-xs h-9" />
                <Input type="number" value={deptForm.employeeCount || ""} onChange={(e) => setDeptForm({ ...deptForm, employeeCount: Number(e.target.value) })} placeholder="Employees count" className="bg-white border-slate-200 rounded-lg text-xs h-9" />
              </div>
              <Button type="submit" size="sm" className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1 text-xs py-1.5 h-8 w-fit">
                <Plus className="h-3.5 w-3.5" />
                <span>Create Department</span>
              </Button>
            </form>

            <div className="rounded-xl border border-slate-100 overflow-hidden max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-bold text-xs">Name</TableHead>
                    <TableHead className="font-bold text-xs">Code</TableHead>
                    <TableHead className="font-bold text-xs">Head</TableHead>
                    <TableHead className="font-bold text-xs text-right">Headcount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((dept) => (
                    <TableRow key={dept.id} className="hover:bg-slate-50/30 text-xs">
                      <TableCell className="font-bold text-slate-800">{dept.name}</TableCell>
                      <TableCell className="font-mono text-slate-500 font-bold">{dept.code}</TableCell>
                      <TableCell className="font-semibold text-slate-600">{dept.head}</TableCell>
                      <TableCell className="text-right font-extrabold text-slate-700">{dept.employeeCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Categories CRUD */}
        <Card className="shadow-sm bg-white">
          <CardHeader>
            <CardTitle>ESG Categories Register</CardTitle>
            <CardDescription>Configure activities and challenges grouping tags.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddCategory} className="grid gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-xs font-bold text-slate-400 uppercase">Add ESG Category</span>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="Category Name" className="bg-white border-slate-200 rounded-lg text-xs h-9" />
                <Select value={catForm.type} onChange={(e) => setCatForm({ ...catForm, type: e.target.value })} className="bg-white border-slate-200 rounded-lg text-xs h-9">
                  <option value="CSR_ACTIVITY">CSR Activity</option>
                  <option value="CHALLENGE">Gamification Challenge</option>
                </Select>
              </div>
              <Button type="submit" size="sm" className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1 text-xs py-1.5 h-8 w-fit">
                <Plus className="h-3.5 w-3.5" />
                <span>Create Category</span>
              </Button>
            </form>

            <div className="rounded-xl border border-slate-100 overflow-hidden max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-bold text-xs">Name</TableHead>
                    <TableHead className="font-bold text-xs">Module Scope</TableHead>
                    <TableHead className="font-bold text-xs text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id} className="hover:bg-slate-50/30 text-xs">
                      <TableCell className="font-bold text-slate-800">{cat.name}</TableCell>
                      <TableCell className="font-semibold text-slate-500">
                        <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px]">
                          {cat.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-emerald-50 text-emerald-800 border-emerald-100 text-[10px]">
                          {cat.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
