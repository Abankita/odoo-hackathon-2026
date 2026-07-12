"use client";

import { useState, useEffect } from "react";
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

  // Local lists state
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

  // Challenges & CSR Activities Form States
  const [challengeForm, setChallengeForm] = useState({
    title: "",
    description: "",
    categoryId: initialCategories.find((c) => c.type === "CHALLENGE")?.id || 1,
    xp: 100,
    difficulty: "Easy",
    evidenceRequired: false,
    status: "Active"
  });

  const [activityForm, setActivityForm] = useState({
    title: "",
    description: "",
    categoryId: initialCategories.find((c) => c.type === "CSR_ACTIVITY")?.id || 1,
    evidenceRequired: false,
    date: new Date().toISOString().split("T")[0],
    status: "Published"
  });

  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Sync props to state on database updates
  useEffect(() => {
    setDepartments(initialDepartments);
  }, [initialDepartments]);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

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
        triggerFeedback("Configuration saved! All department scores recalculated.", "success");
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

  const handleAddChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeForm.title || !challengeForm.description) {
      triggerFeedback("Title and description are required.", "error");
      return;
    }
    try {
      const response = await fetch("/api/settings/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(challengeForm)
      });
      const data = await response.json();
      if (response.ok) {
        triggerFeedback(`Task (Challenge) '${data.title}' created successfully!`, "success");
        setChallengeForm({
          title: "",
          description: "",
          categoryId: categories.find((c) => c.type === "CHALLENGE")?.id || 1,
          xp: 100,
          difficulty: "Easy",
          evidenceRequired: false,
          status: "Active"
        });
        router.refresh();
      } else {
        triggerFeedback(data.error || "Failed to create challenge.", "error");
      }
    } catch {
      triggerFeedback("Network error occurred.", "error");
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityForm.title || !activityForm.description) {
      triggerFeedback("Title and description are required.", "error");
      return;
    }
    try {
      const response = await fetch("/api/settings/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activityForm)
      });
      const data = await response.json();
      if (response.ok) {
        triggerFeedback(`CSR Activity '${data.title}' created!`, "success");
        setActivityForm({
          title: "",
          description: "",
          categoryId: categories.find((c) => c.type === "CSR_ACTIVITY")?.id || 1,
          evidenceRequired: false,
          date: new Date().toISOString().split("T")[0],
          status: "Published"
        });
        router.refresh();
      } else {
        triggerFeedback(data.error || "Failed to create CSR activity.", "error");
      }
    } catch {
      triggerFeedback("Network error occurred.", "error");
    }
  };

  return (
    <div className="space-y-8 max-w-5xl font-sans">
      {/* Toast Alert */}
      {feedback && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border animate-in fade-in slide-in-from-bottom-5 ${
            feedback.type === "success" ? "bg-slate-900 border-slate-800 text-white" : "bg-red-900 border-red-800 text-white"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="h-5 w-5 text-emerald-450 shrink-0" /> : <AlertTriangle className="h-5 w-5 text-red-450 shrink-0" />}
          <span className="text-sm font-semibold">{feedback.text}</span>
        </div>
      )}

      {/* Weighting and Config Toggles */}
      <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-700" />
            <CardTitle className="text-base font-bold">Global ESG Configuration</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Modify corporate ESG weight coefficients and operational automation rules.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveConfig} className="space-y-6">
            
            {/* Weight inputs */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700">Coefficients Weights (Must sum to 100%)</span>
                <Badge variant="outline" className={isWeightsValid ? "text-emerald-800 border-emerald-200 bg-emerald-50/20 text-[10px] font-bold" : "text-red-800 border-red-200 bg-red-50/20 text-[10px] font-bold animate-pulse"}>
                  Total: {weightSum}%
                </Badge>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Environmental weight (%)</span>
                  <Input type="number" value={envWeight} onChange={(e) => setEnvWeight(Number(e.target.value))} className="bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold h-9" min={0} max={100} />
                </label>
                <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Social weight (%)</span>
                  <Input type="number" value={socialWeight} onChange={(e) => setSocialWeight(Number(e.target.value))} className="bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold h-9" min={0} max={100} />
                </label>
                <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Governance weight (%)</span>
                  <Input type="number" value={govWeight} onChange={(e) => setGovWeight(Number(e.target.value))} className="bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold h-9" min={0} max={100} />
                </label>
              </div>
            </div>

            <Separator className="bg-slate-100" />

            {/* Automation Toggles */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-700 block">Operational Rules Engine Toggles</span>
              <div className="grid gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Auto Emission Calculator</span>
                  <Select value={autoEmissionCalc ? "true" : "false"} onChange={(e) => setAutoEmissionCalc(e.target.value === "true")} className="bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold h-9">
                    <option value="true">ENABLED: Auto calculate CO2</option>
                    <option value="false">DISABLED: Require manual CO2 entry</option>
                  </Select>
                </label>
                <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Evidence Required Policy</span>
                  <Select value={evidenceRequired ? "true" : "false"} onChange={(e) => setEvidenceRequired(e.target.value === "true")} className="bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold h-9">
                    <option value="true">STRICT: Block approval without proof URLs</option>
                    <option value="false">FLEXIBLE: Allow approval without proof URLs</option>
                  </Select>
                </label>
                <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Badge Auto-Award Toggles</span>
                  <Select value={badgeAutoAward ? "true" : "false"} onChange={(e) => setBadgeAutoAward(e.target.value === "true")} className="bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold h-9">
                    <option value="true">AUTOMATIC: Unlock badges on threshold hits</option>
                    <option value="false">MANUAL: Hold badges for admin review</option>
                  </Select>
                </label>
                <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>System Email Alerts</span>
                  <Select value={emailAlerts ? "true" : "false"} onChange={(e) => setEmailAlerts(e.target.value === "true")} className="bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold h-9">
                    <option value="true">ENABLED: Dispatch compliance alerts</option>
                    <option value="false">DISABLED: Log notifications silently</option>
                  </Select>
                </label>
              </div>
            </div>

            <Button type="submit" disabled={!isWeightsValid} className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl px-5 text-xs font-semibold h-9">
              Save Configuration Settings
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Departments & Categories CRUD */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Departments CRUD */}
        <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Departments Register</CardTitle>
            <CardDescription className="text-xs">Track operational scopes, head counts, and managers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleAddDept} className="grid gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Register Department</span>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} placeholder="Dept Name" className="bg-slate-50 border-slate-200 rounded-lg text-xs h-9 font-medium" />
                <Input value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} placeholder="Code (e.g. MFG)" className="bg-slate-50 border-slate-200 rounded-lg text-xs h-9 font-mono" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={deptForm.head} onChange={(e) => setDeptForm({ ...deptForm, head: e.target.value })} placeholder="Director Name" className="bg-slate-50 border-slate-200 rounded-lg text-xs h-9 font-medium" />
                <Input type="number" value={deptForm.employeeCount || ""} onChange={(e) => setDeptForm({ ...deptForm, employeeCount: Number(e.target.value) })} placeholder="Employees count" className="bg-slate-50 border-slate-200 rounded-lg text-xs h-9 font-semibold" />
              </div>
              <Button type="submit" size="sm" className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1 text-xs py-1.5 h-8 w-fit">
                <Plus className="h-3.5 w-3.5" />
                <span>Create Department</span>
              </Button>
            </form>

            <div className="rounded-xl border border-slate-100 overflow-hidden max-h-[250px] overflow-y-auto">
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
                      <TableCell className="font-bold text-slate-855">{dept.name}</TableCell>
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
        <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">ESG Categories Register</CardTitle>
            <CardDescription className="text-xs">Configure activities and challenges grouping tags.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleAddCategory} className="grid gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Add ESG Category</span>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="Category Name" className="bg-slate-50 border-slate-200 rounded-lg text-xs h-9 font-medium" />
                <Select value={catForm.type} onChange={(e) => setCatForm({ ...catForm, type: e.target.value })} className="bg-slate-50 border-slate-200 rounded-lg text-xs h-9 font-semibold">
                  <option value="CSR_ACTIVITY">CSR Activity</option>
                  <option value="CHALLENGE">Gamification Challenge</option>
                </Select>
              </div>
              <Button type="submit" size="sm" className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1 text-xs py-1.5 h-8 w-fit">
                <Plus className="h-3.5 w-3.5" />
                <span>Create Category</span>
              </Button>
            </form>

            <div className="rounded-xl border border-slate-100 overflow-hidden max-h-[250px] overflow-y-auto">
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
                        <Badge variant="outline" className="text-slate-700 border-slate-200 bg-slate-50 text-[9px] font-bold">
                          {cat.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-emerald-50 text-emerald-800 border-emerald-100 text-[9px] font-bold">
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

        {/* Create Sustainability Task (Challenge) */}
        <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Sustainability Challenges Creator</CardTitle>
            <CardDescription className="text-xs">Add new tasks for employees to join and complete in the Gamification module.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddChallenge} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Challenge Title</label>
                  <Input value={challengeForm.title} onChange={(e) => setChallengeForm({ ...challengeForm, title: e.target.value })} placeholder="e.g. Bring Your Own Cup" className="bg-slate-50 border-slate-200 rounded-lg text-xs h-9 font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                  <Select value={challengeForm.categoryId} onChange={(e) => setChallengeForm({ ...challengeForm, categoryId: Number(e.target.value) })} className="bg-slate-50 border-slate-200 rounded-lg text-xs h-9 font-semibold">
                    {categories.filter(c => c.type === "CHALLENGE").map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <Input value={challengeForm.description} onChange={(e) => setChallengeForm({ ...challengeForm, description: e.target.value })} placeholder="Detailed instructions or rules for the challenge..." className="bg-slate-50 border-slate-200 rounded-lg text-xs h-9 font-medium" />
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">XP Reward</label>
                  <Input type="number" value={challengeForm.xp} onChange={(e) => setChallengeForm({ ...challengeForm, xp: Number(e.target.value) })} className="bg-slate-50 border-slate-200 rounded-lg text-xs h-9 font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Difficulty</label>
                  <Select value={challengeForm.difficulty} onChange={(e) => setChallengeForm({ ...challengeForm, difficulty: e.target.value })} className="bg-slate-50 border-slate-200 rounded-lg text-xs h-9 font-semibold">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Requires Proof</label>
                  <Select value={challengeForm.evidenceRequired ? "yes" : "no"} onChange={(e) => setChallengeForm({ ...challengeForm, evidenceRequired: e.target.value === "yes" })} className="bg-slate-50 border-slate-200 rounded-lg text-xs h-9 font-semibold">
                    <option value="no">No</option>
                    <option value="yes">Yes (Proof Required)</option>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Initial Status</label>
                  <Select value={challengeForm.status} onChange={(e) => setChallengeForm({ ...challengeForm, status: e.target.value })} className="bg-slate-50 border-slate-200 rounded-lg text-xs h-9 font-semibold">
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                  </Select>
                </div>
              </div>
              <Button type="submit" size="sm" className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1 text-xs py-1.5 h-8 w-fit">
                <Plus className="h-3.5 w-3.5" />
                <span>Create Challenge</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Create CSR Activity */}
        <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">CSR & Volunteering Activities Creator</CardTitle>
            <CardDescription className="text-xs">Create new corporate social responsibility programs or green volunteering events.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddActivity} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activity Title</label>
                  <Input value={activityForm.title} onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })} placeholder="e.g. Community Forestation Day" className="bg-slate-50 border-slate-200 rounded-lg text-xs h-9 font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                  <Select value={activityForm.categoryId} onChange={(e) => setActivityForm({ ...activityForm, categoryId: Number(e.target.value) })} className="bg-slate-50 border-slate-200 rounded-lg text-xs h-9 font-semibold">
                    {categories.filter(c => c.type === "CSR_ACTIVITY").map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <Input value={activityForm.description} onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })} placeholder="Activity location, description, or volunteer slots..." className="bg-slate-50 border-slate-200 rounded-lg text-xs h-9 font-medium" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Event Date</label>
                  <Input type="date" value={activityForm.date} onChange={(e) => setActivityForm({ ...activityForm, date: e.target.value })} className="bg-slate-50 border-slate-200 rounded-lg text-xs h-9 font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Requires Proof</label>
                  <Select value={activityForm.evidenceRequired ? "yes" : "no"} onChange={(e) => setActivityForm({ ...activityForm, evidenceRequired: e.target.value === "yes" })} className="bg-slate-50 border-slate-200 rounded-lg text-xs h-9 font-semibold">
                    <option value="no">No</option>
                    <option value="yes">Yes (Proof Required)</option>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                  <Select value={activityForm.status} onChange={(e) => setActivityForm({ ...activityForm, status: e.target.value })} className="bg-slate-50 border-slate-200 rounded-lg text-xs h-9 font-semibold">
                    <option value="Published">Published</option>
                    <option value="Planned">Planned (Draft)</option>
                  </Select>
                </div>
              </div>
              <Button type="submit" size="sm" className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1 text-xs py-1.5 h-8 w-fit">
                <Plus className="h-3.5 w-3.5" />
                <span>Create CSR Activity</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
