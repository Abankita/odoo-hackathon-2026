"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Trophy, Star, Shield, HelpCircle, Lock, Award, Heart, CheckCircle2 } from "lucide-react";

type Employee = {
  id: number;
  name: string;
  departmentId: number;
  xp: number;
  points: number;
  department: { name: string };
};

type Challenge = {
  id: number;
  title: string;
  description: string;
  xp: number;
  difficulty: string;
  evidenceRequired: boolean;
  deadline: string | Date;
  status: string;
  category: { name: string };
};

type BadgeItem = {
  id: number;
  name: string;
  description: string;
  unlockRule: string;
  icon: string;
};

type Reward = {
  id: number;
  name: string;
  description: string;
  pointsRequired: number;
  stock: number;
  status: string;
};

type ChallengeParticipation = {
  id: number;
  challengeId: number;
  employeeId: number;
  progress: number;
  approvalStatus: string;
};

type DepartmentRanking = {
  id: number;
  name: string;
  totalScore: number;
};

type GamificationProps = {
  employees: Employee[];
  challenges: Challenge[];
  badges: BadgeItem[];
  rewards: Reward[];
  participations: ChallengeParticipation[];
  employeeBadges: Array<{ id: number; employeeId: number; badgeId: number; unlockedAt: string | Date }>;
  departments: DepartmentRanking[];
};

export function GamificationClient({
  employees: initialEmployees,
  challenges,
  badges,
  rewards,
  participations: initialParticipations,
  employeeBadges: initialEmployeeBadges,
  departments
}: GamificationProps) {
  const router = useRouter();
  
  // State variables
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [participations, setParticipations] = useState<ChallengeParticipation[]>(initialParticipations);
  const [employeeBadges, setEmployeeBadges] = useState<typeof initialEmployeeBadges>(initialEmployeeBadges);
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number>(initialEmployees[0]?.id || 1);
  const [challengeFilter, setChallengeFilter] = useState<string>("Active");
  const [leaderboardTab, setLeaderboardTab] = useState<"employees" | "departments">("employees");
  
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: "success" | "error" | "badge" } | null>(null);

  const activeEmployee = employees.find((e) => e.id === selectedEmployeeId);

  const showFeedback = (text: string, type: "success" | "error" | "badge") => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 6000);
  };

  // Actions
  const handleJoinChallenge = async (challengeId: number) => {
    try {
      const response = await fetch("/api/gamification/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: selectedEmployeeId, challengeId })
      });
      const data = await response.json();
      if (response.ok) {
        setParticipations([...participations, data]);
        showFeedback("Successfully joined the challenge! Earn XP and save carbon.", "success");
        router.refresh();
      } else {
        showFeedback(data.error || "Failed to join challenge.", "error");
      }
    } catch {
      showFeedback("Network error occurred.", "error");
    }
  };

  const handleCompleteChallenge = async (participationId: number) => {
    try {
      const response = await fetch("/api/gamification/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participationId })
      });
      const data = await response.json();
      if (response.ok) {
        // Update local participations
        setParticipations(
          participations.map((p) =>
            p.id === participationId ? { ...p, progress: 100, approvalStatus: "Approved" } : p
          )
        );
        
        // Update local employees details
        if (activeEmployee) {
          const completedPart = participations.find((p) => p.id === participationId);
          const challenge = challenges.find((c) => c.id === completedPart?.challengeId);
          if (challenge) {
            setEmployees(
              employees.map((e) =>
                e.id === selectedEmployeeId
                  ? {
                      ...e,
                      xp: e.xp + challenge.xp,
                      points: e.points + Math.round(challenge.xp / 10)
                    }
                  : e
              )
            );
          }
        }

        // Handle Badge unlocks feedback
        let msg = "Challenge completed! Points and XP awarded.";
        if (data.badgeResults && data.badgeResults.length > 0) {
          const newlyAwarded = data.badgeResults.filter((b: any) => b.awarded);
          if (newlyAwarded.length > 0) {
            msg += ` 🎉 Badge Unlocked: ${newlyAwarded.map((b: any) => b.name).join(", ")}!`;
            // Add new badges to local list
            const newBadges = newlyAwarded.map((badge: any) => ({
              id: Math.random(),
              employeeId: selectedEmployeeId,
              badgeId: badge.badgeId,
              unlockedAt: new Date().toISOString()
            }));
            setEmployeeBadges([...employeeBadges, ...newBadges]);
            showFeedback(msg, "badge");
          } else {
            showFeedback(msg, "success");
          }
        } else {
          showFeedback(msg, "success");
        }

        router.refresh();
      } else {
        showFeedback(data.error || "Failed to complete challenge.", "error");
      }
    } catch {
      showFeedback("Network error occurred.", "error");
    }
  };

  const handleRedeemReward = async (rewardId: number) => {
    try {
      const response = await fetch("/api/gamification/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: selectedEmployeeId, rewardId })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const reward = rewards.find((r) => r.id === rewardId);
        if (reward) {
          setEmployees(
            employees.map((e) =>
              e.id === selectedEmployeeId ? { ...e, points: e.points - reward.pointsRequired } : e
            )
          );
          showFeedback(`Success! Redeemed reward: ${reward.name}.`, "success");
        }
        router.refresh();
      } else {
        showFeedback(data.reason || "Failed to redeem reward.", "error");
      }
    } catch {
      showFeedback("Network error occurred.", "error");
    }
  };

  const getBadgeRuleText = (ruleStr: string) => {
    try {
      const rule = JSON.parse(ruleStr);
      const threshold = rule.threshold ?? rule.value ?? 0;
      const type = rule.type ?? "XP";
      if (type.toUpperCase() === "XP") return `Earn ${threshold} XP`;
      if (type.toUpperCase() === "POINTS") return `Earn ${threshold} pts`;
      if (type.toUpperCase() === "COMPLETED_CHALLENGES") return `Complete ${threshold} tasks`;
      return `Reach target threshold`;
    } catch {
      return "Special award";
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border animate-in fade-in slide-in-from-bottom-5 duration-200 ${
            feedbackMessage.type === "success"
              ? "bg-slate-900 border-slate-800 text-white"
              : feedbackMessage.type === "badge"
              ? "bg-amber-900 border-amber-800 text-white animate-bounce"
              : "bg-red-950 border-red-800 text-white"
          }`}
        >
          <Trophy className={`h-6 w-6 shrink-0 ${feedbackMessage.type === "badge" ? "text-amber-400" : "text-slate-100"}`} />
          <div className="text-sm font-semibold">{feedbackMessage.text}</div>
        </div>
      )}

      {/* Viewing context bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">DEMO CONTEXT SELECTOR</span>
          <h2 className="text-base font-bold text-slate-900">
            Active Employee: {activeEmployee?.name} ({activeEmployee?.department.name})
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
                {emp.name} ({emp.department.name})
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Summary metrics grid */}
      <section className="grid gap-5 md:grid-cols-3">
        <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">XP Balance</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{activeEmployee?.xp ?? 0} XP</p>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100/60 text-amber-600">
              <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Redeemable Points</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{activeEmployee?.points ?? 0} pts</p>
            </div>
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100/60 text-blue-600">
              <Award className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Badges Collection</p>
              <p className="mt-2 text-3xl font-black text-slate-900">
                {employeeBadges.filter((b) => b.employeeId === selectedEmployeeId).length} <span className="text-slate-400 font-bold text-lg">/ {badges.length}</span>
              </p>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100/60 text-emerald-600">
              <Trophy className="h-5 w-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Main Content Grid */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        
        {/* Challenges console (Clean card layout, no left border) */}
        <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">Challenges Console</CardTitle>
              <CardDescription className="text-xs">Complete core milestones and tasks to gain points & badges.</CardDescription>
            </div>
            <div className="flex border border-slate-200 rounded-xl overflow-hidden shrink-0">
              {["Active", "Completed", "Draft"].map((status) => (
                <button
                  key={status}
                  onClick={() => setChallengeFilter(status)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                    challengeFilter === status
                      ? "bg-slate-900 text-white"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {challenges.filter((c) => c.status === challengeFilter).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">No challenges found under this category filter.</p>
            ) : (
              challenges
                .filter((c) => c.status === challengeFilter)
                .map((challenge) => {
                  const userPart = participations.find(
                    (p) => p.challengeId === challenge.id && p.employeeId === selectedEmployeeId
                  );

                  return (
                    <div
                      key={challenge.id}
                      className="border border-slate-100 rounded-2xl bg-white p-5 hover:border-slate-200 transition-all shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-emerald-800 border-emerald-200 bg-emerald-50/20 text-[9px] font-bold uppercase">
                              {challenge.category.name}
                            </Badge>
                            <Badge variant="outline" className="text-slate-600 border-slate-200 text-[9px] font-bold uppercase">
                              {challenge.difficulty}
                            </Badge>
                          </div>
                          <h4 className="text-base font-bold text-slate-900">{challenge.title}</h4>
                          <p className="text-xs text-slate-500 font-medium">{challenge.description}</p>
                          <span className="inline-block text-[10px] text-slate-400 font-bold">
                            End Date: {new Date(challenge.deadline).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="shrink-0 flex items-center gap-3">
                          {userPart ? (
                            userPart.progress >= 100 ? (
                              <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Completed</span>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleCompleteChallenge(userPart.id)}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold px-3 h-8"
                              >
                                Complete Task
                              </Button>
                            )
                          ) : (
                            challenge.status === "Active" && (
                              <Button
                                size="sm"
                                onClick={() => handleJoinChallenge(challenge.id)}
                                className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold px-3 h-8"
                              >
                                Join Task
                              </Button>
                            )
                          )}
                          <div className="flex flex-col items-center border border-slate-100 rounded-xl px-2.5 py-1.5 bg-slate-50">
                            <span className="text-xs font-black text-amber-600">{challenge.xp}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">XP</span>
                          </div>
                        </div>
                      </div>

                      {userPart && userPart.progress < 100 && (
                        <div className="mt-4 space-y-1.5">
                          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                            <span>TASK PROGRESS</span>
                            <span>{userPart.progress}%</span>
                          </div>
                          <Progress value={userPart.progress} className="h-1 bg-slate-100 [&>div]:bg-emerald-600" />
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </CardContent>
        </Card>

        {/* Leaderboard Section (Clean rows, no left shading) */}
        <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">Leaderboard Standings</CardTitle>
              <div className="flex border border-slate-200 rounded-xl overflow-hidden shrink-0">
                <button
                  onClick={() => setLeaderboardTab("employees")}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    leaderboardTab === "employees" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-500"
                  }`}
                >
                  Employees
                </button>
                <button
                  onClick={() => setLeaderboardTab("departments")}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    leaderboardTab === "departments" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-500"
                  }`}
                >
                  Depts
                </button>
              </div>
            </div>
            <CardDescription className="text-xs">
              {leaderboardTab === "employees"
                ? "Ranked by employee XP contribution balance."
                : "Ranked by department ESG scoring indices."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboardTab === "employees" ? (
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {employees
                  .sort((a, b) => b.xp - a.xp)
                  .map((employee, idx) => {
                    const isSelf = employee.id === selectedEmployeeId;
                    return (
                      <div
                        key={employee.id}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                          isSelf
                            ? "border-emerald-500 bg-emerald-50/10 shadow-sm"
                            : "border-slate-100 bg-white hover:border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                              idx === 0
                                ? "bg-amber-100 text-amber-800"
                                : idx === 1
                                ? "bg-slate-200 text-slate-700"
                                : idx === 2
                                ? "bg-orange-100 text-orange-800"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {employee.name} {isSelf && <span className="text-emerald-700 text-[10px]">(You)</span>}
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold">{employee.department.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-800">{employee.xp} XP</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">{employee.points} pts</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="space-y-2.5">
                {departments
                  .sort((a, b) => b.totalScore - a.totalScore)
                  .map((dept, idx) => {
                    const isSelfDept = activeEmployee?.departmentId === dept.id;
                    return (
                      <div
                        key={dept.id}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                          isSelfDept
                            ? "border-blue-500 bg-blue-50/10"
                            : "border-slate-100 bg-white hover:border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-black">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {dept.name} Department {isSelfDept && <span className="text-blue-700 text-[10px]">(Yours)</span>}
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold">Weighted ESG score index</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-800">{dept.totalScore.toFixed(1)} / 100</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="bg-slate-100" />

      {/* Showcase and Catalog Grid */}
      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.9fr]">
        
        {/* Badges showcase */}
        <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-bold">Showcase Badges</CardTitle>
            <CardDescription className="text-xs">Achievements and certificates unlocked by active operator.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {badges.map((badge) => {
              const isUnlocked = employeeBadges.some(
                (b) => b.employeeId === selectedEmployeeId && b.badgeId === badge.id
              );

              return (
                <div
                  key={badge.id}
                  className={`border rounded-2xl p-4 flex flex-col items-center text-center transition-all ${
                    isUnlocked
                      ? "border-amber-200 bg-amber-50/5 shadow-sm animate-in fade-in"
                      : "border-slate-100 bg-slate-50/10 opacity-50"
                  }`}
                >
                  <div
                    className={`h-11 w-11 rounded-full flex items-center justify-center border mb-3 ${
                      isUnlocked
                        ? "bg-amber-100 border-amber-200 text-amber-700"
                        : "bg-slate-100/60 border-slate-200 text-slate-400"
                    }`}
                  >
                    {isUnlocked ? (
                      <Trophy className="h-5 w-5 fill-amber-500/10" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-900">{badge.name}</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[125px] leading-tight font-medium">
                    {badge.description}
                  </p>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-3 bg-slate-100 px-2 py-0.5 rounded-full">
                    {getBadgeRuleText(badge.unlockRule)}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Rewards Catalog */}
        <Card className="shadow-sm border-slate-100 bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-bold">Perks Redemption Catalog</CardTitle>
            <CardDescription className="text-xs">Redeem voucher coupon codes or sustainability perks using points.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {rewards.map((reward) => {
              const hasEnoughPoints = (activeEmployee?.points ?? 0) >= reward.pointsRequired;
              const isOutOfStock = reward.stock <= 0;

              return (
                <div
                  key={reward.id}
                  className="border border-slate-100 rounded-2xl bg-white p-5 flex flex-col justify-between hover:border-slate-200 transition-all shadow-sm"
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">{reward.name}</h4>
                      <Badge variant="outline" className="text-blue-800 border-blue-200 bg-blue-50/20 text-[10px] font-bold whitespace-nowrap">
                        {reward.pointsRequired} pts
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{reward.description}</p>
                    <span className="inline-block text-[10px] font-bold text-slate-400 uppercase">
                      Stock: {reward.stock} remaining
                    </span>
                  </div>

                  <div className="mt-4 pt-2">
                    {isOutOfStock ? (
                      <Button disabled className="w-full rounded-xl bg-slate-50 text-slate-400 border border-slate-100 text-xs h-9 cursor-not-allowed font-bold">
                        Sold Out
                      </Button>
                    ) : hasEnoughPoints ? (
                      <Button
                        onClick={() => handleRedeemReward(reward.id)}
                        className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold h-9"
                      >
                        Redeem Voucher
                      </Button>
                    ) : (
                      <Button
                        disabled
                        className="w-full rounded-xl bg-slate-50 text-slate-400 border border-slate-100 text-[10px] h-9 cursor-not-allowed font-bold"
                      >
                        Requires {reward.pointsRequired} pts (You have {activeEmployee?.points})
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
