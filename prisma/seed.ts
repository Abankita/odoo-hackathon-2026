import {
  PrismaClient
} from "@prisma/client";

const prisma = new PrismaClient();

const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
const monthsAgo = (months: number) => new Date(now.getFullYear(), now.getMonth() - months, Math.min(now.getDate(), 28), 10, 0, 0);
const monthsFromNow = (months: number) => new Date(now.getFullYear(), now.getMonth() + months, Math.min(now.getDate(), 28), 10, 0, 0);

async function main() {
  await prisma.notification.deleteMany();
  await prisma.departmentScore.deleteMany();
  await prisma.complianceIssue.deleteMany();
  await prisma.audit.deleteMany();
  await prisma.policyAcknowledgement.deleteMany();
  await prisma.challengeParticipation.deleteMany();
  await prisma.employeeParticipation.deleteMany();
    await prisma.cSRActivity.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.employeeBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.carbonTransaction.deleteMany();
  await prisma.productESGProfile.deleteMany();
  await prisma.environmentalGoal.deleteMany();
  await prisma.eSGPolicy.deleteMany();
  await prisma.category.deleteMany();
  await prisma.emissionFactor.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();
  await prisma.orgConfig.deleteMany();

  const [manufacturing, logistics, corporate] = await Promise.all([
    prisma.department.create({ data: { name: "Manufacturing", code: "MFG", head: "Ayesha Khan", employeeCount: 3, status: "Active" } }),
    prisma.department.create({ data: { name: "Logistics", code: "LOG", head: "Carlos Mendes", employeeCount: 2, status: "Active" } }),
    prisma.department.create({ data: { name: "Corporate", code: "COR", head: "Meera Nair", employeeCount: 3, status: "Active" } })
  ]);

  const categories = await Promise.all([
    prisma.category.create({ data: { name: "Volunteer Day", type: "CSR_ACTIVITY", status: "Active" } }),
    prisma.category.create({ data: { name: "Waste Reduction", type: "CSR_ACTIVITY", status: "Active" } }),
    prisma.category.create({ data: { name: "Energy Challenge", type: "CHALLENGE", status: "Active" } })
  ]);

  const emissionFactors = await Promise.all([
    prisma.emissionFactor.create({ data: { sourceType: "Diesel", unit: "liter", co2PerUnit: 2.68 } }),
    prisma.emissionFactor.create({ data: { sourceType: "Electricity", unit: "kWh", co2PerUnit: 0.82 } }),
    prisma.emissionFactor.create({ data: { sourceType: "Air Travel", unit: "km", co2PerUnit: 0.15 } }),
    prisma.emissionFactor.create({ data: { sourceType: "Packaging Material", unit: "kg", co2PerUnit: 1.34 } }),
    prisma.emissionFactor.create({ data: { sourceType: "Natural Gas", unit: "therm", co2PerUnit: 5.3 } })
  ]);

  const employees = await Promise.all([
    prisma.employee.create({ data: { name: "Priya Shah", departmentId: manufacturing.id, xp: 1280, points: 540 } }),
    prisma.employee.create({ data: { name: "Rahul Verma", departmentId: manufacturing.id, xp: 420, points: 180 } }),
    prisma.employee.create({ data: { name: "Nina Patel", departmentId: manufacturing.id, xp: 75, points: 25 } }),
    prisma.employee.create({ data: { name: "Mateo Silva", departmentId: logistics.id, xp: 980, points: 460 } }),
    prisma.employee.create({ data: { name: "Fatima Noor", departmentId: logistics.id, xp: 260, points: 90 } }),
    prisma.employee.create({ data: { name: "Jordan Lee", departmentId: corporate.id, xp: 1500, points: 780 } }),
    prisma.employee.create({ data: { name: "Sana Iyer", departmentId: corporate.id, xp: 640, points: 220 } }),
    prisma.employee.create({ data: { name: "Omar Hassan", departmentId: corporate.id, xp: 0, points: 0 } })
  ]);

  await prisma.productESGProfile.createMany({
    data: [
      { productName: "EcoPack Box", departmentId: manufacturing.id, materialType: "Recycled Cardboard", carbonFootprint: 1.2, recyclable: true },
      { productName: "Warehouse Label", departmentId: logistics.id, materialType: "Thermal Paper", carbonFootprint: 0.4, recyclable: false },
      { productName: "Supplier Portal License", departmentId: corporate.id, materialType: "Digital Service", carbonFootprint: 0.08, recyclable: true }
    ]
  });

  await prisma.environmentalGoal.createMany({
    data: [
      { name: "Reduce plant electricity intensity", departmentId: manufacturing.id, targetCO2: 1200, currentCO2: 120, deadline: monthsFromNow(2), status: "OnTrack" },
      { name: "Cut fleet diesel use", departmentId: manufacturing.id, targetCO2: 800, currentCO2: 840, deadline: daysAgo(18), status: "OffTrack" },
      { name: "Minimize paper usage", departmentId: manufacturing.id, targetCO2: 500, currentCO2: 0, deadline: daysAgo(20), status: "Completed" },
      { name: "Reduce water consumption", departmentId: manufacturing.id, targetCO2: 1000, currentCO2: 0, deadline: daysAgo(10), status: "Completed" },
      { name: "Lower delivery route emissions", departmentId: logistics.id, targetCO2: 640, currentCO2: 96, deadline: monthsFromNow(1), status: "OnTrack" },
      { name: "Warehouse packaging reduction", departmentId: logistics.id, targetCO2: 380, currentCO2: 38, deadline: monthsFromNow(1), status: "OnTrack" },
      { name: "Corporate travel carbon cap", departmentId: corporate.id, targetCO2: 200, currentCO2: 20, deadline: monthsFromNow(3), status: "OnTrack" }
    ]
  });

  const csrActivities = await Promise.all([
    prisma.cSRActivity.create({ data: { title: "River Cleanup Drive", categoryId: categories[0].id, description: "Local riverbank cleanup with community volunteers.", evidenceRequired: true, date: daysAgo(24), status: "Published" } }),
    prisma.cSRActivity.create({ data: { title: "Tree Plantation Week", categoryId: categories[0].id, description: "Plant native saplings around the factory perimeter.", evidenceRequired: false, date: daysAgo(14), status: "Published" } }),
    prisma.cSRActivity.create({ data: { title: "Waste Audit Sprint", categoryId: categories[1].id, description: "Sort and log packaging waste for reduction opportunities.", evidenceRequired: true, date: daysAgo(8), status: "Active" } }),
    prisma.cSRActivity.create({ data: { title: "Paperless Desk Challenge", categoryId: categories[1].id, description: "Reduce printing and shift to digital approvals.", evidenceRequired: false, date: daysAgo(3), status: "Planned" } })
  ]);

  const challenges = await Promise.all([
    prisma.challenge.create({ data: { title: "Switch Off the Standby", categoryId: categories[2].id, description: "Reduce office standby power use for a week.", xp: 120, difficulty: "Easy", evidenceRequired: false, deadline: monthsFromNow(1), status: "Draft" } }),
    prisma.challenge.create({ data: { title: "Zero Waste Floor", categoryId: categories[2].id, description: "Track and divert all packaging waste from one production line.", xp: 260, difficulty: "Medium", evidenceRequired: true, deadline: daysAgo(11), status: "Active" } }),
    prisma.challenge.create({ data: { title: "Low Carbon Commute Month", categoryId: categories[2].id, description: "Use low-carbon commuting options for a month.", xp: 420, difficulty: "Hard", evidenceRequired: true, deadline: daysAgo(37), status: "Completed" } })
  ]);

  const badges = await Promise.all([
    prisma.badge.create({ data: { name: "Starter", description: "Reached 100 XP.", unlockRule: JSON.stringify({ type: "XP", threshold: 100 }), icon: "sparkles" } }),
    prisma.badge.create({ data: { name: "Green Advocate", description: "Reached 500 XP.", unlockRule: JSON.stringify({ type: "XP", threshold: 500 }), icon: "leaf" } }),
    prisma.badge.create({ data: { name: "Carbon Crusher", description: "Reached 1000 XP.", unlockRule: JSON.stringify({ type: "XP", threshold: 1000 }), icon: "badge-check" } }),
    prisma.badge.create({ data: { name: "ESG Champion", description: "Reached 1500 XP.", unlockRule: JSON.stringify({ type: "XP", threshold: 1500 }), icon: "trophy" } })
  ]);

  await prisma.reward.createMany({
    data: [
      { name: "Coffee Voucher", description: "Small reward for quick wins.", pointsRequired: 100, stock: 25, status: "Active" },
      { name: "Lunch Coupon", description: "Mid-tier incentive.", pointsRequired: 250, stock: 12, status: "Active" },
      { name: "Extra Day Off", description: "Reserved for top contributors.", pointsRequired: 600, stock: 4, status: "Limited" }
    ]
  });

  await prisma.eSGPolicy.createMany({
    data: [
      { title: "Supplier Sustainability Code", categoryId: categories[1].id, description: "Minimum ESG requirements for strategic suppliers.", effectiveDate: daysAgo(90), status: "Active" },
      { title: "Travel and Expense Policy", categoryId: categories[1].id, description: "Prefer rail and virtual meetings for short trips.", effectiveDate: daysAgo(60), status: "Active" },
      { title: "Workplace Inclusion Charter", categoryId: categories[0].id, description: "Guidance for respectful and inclusive workplaces.", effectiveDate: daysAgo(45), status: "Active" },
      { title: "Energy Usage Standard", categoryId: categories[1].id, description: "Defines acceptable plant and office energy use practices.", effectiveDate: daysAgo(21), status: "Active" }
    ]
  });

  const policies = await prisma.eSGPolicy.findMany({ orderBy: { id: "asc" } });
  const acknowledgementsData: Array<{ employeeId: number; policyId: number; acknowledgedDate: Date }> = [];
  
  for (const emp of employees) {
    for (const policy of policies) {
      if (emp.id === employees[2].id && policy.id === policies[1].id) continue;
      if (emp.id === employees[4].id && policy.id === policies[2].id) continue;
      if (emp.id === employees[7].id && policy.id === policies[0].id) continue;

      acknowledgementsData.push({
        employeeId: emp.id,
        policyId: policy.id,
        acknowledgedDate: daysAgo(10 + Math.floor(Math.random() * 15))
      });
    }
  }
  await prisma.policyAcknowledgement.createMany({ data: acknowledgementsData });

  const transactionData = [
    { departmentId: manufacturing.id, sourceType: "Diesel", quantity: 320, emissionFactorId: emissionFactors[0].id, date: monthsAgo(3), autoCalculated: true },
    { departmentId: logistics.id, sourceType: "Diesel", quantity: 210, emissionFactorId: emissionFactors[0].id, date: monthsAgo(3), autoCalculated: true },
    { departmentId: corporate.id, sourceType: "Electricity", quantity: 460, emissionFactorId: emissionFactors[1].id, date: monthsAgo(3), autoCalculated: true },
    { departmentId: manufacturing.id, sourceType: "Electricity", quantity: 520, emissionFactorId: emissionFactors[1].id, date: monthsAgo(2), autoCalculated: true },
    { departmentId: logistics.id, sourceType: "Air Travel", quantity: 1800, emissionFactorId: emissionFactors[2].id, date: monthsAgo(2), autoCalculated: true },
    { departmentId: corporate.id, sourceType: "Packaging Material", quantity: 140, emissionFactorId: emissionFactors[3].id, date: monthsAgo(2), autoCalculated: true },
    { departmentId: manufacturing.id, sourceType: "Natural Gas", quantity: 92, emissionFactorId: emissionFactors[4].id, date: monthsAgo(1), autoCalculated: true },
    { departmentId: logistics.id, sourceType: "Diesel", quantity: 260, emissionFactorId: emissionFactors[0].id, date: monthsAgo(1), autoCalculated: true },
    { departmentId: corporate.id, sourceType: "Electricity", quantity: 390, emissionFactorId: emissionFactors[1].id, date: monthsAgo(1), autoCalculated: true },
    { departmentId: manufacturing.id, sourceType: "Diesel", quantity: 410, emissionFactorId: emissionFactors[0].id, date: now, autoCalculated: true },
    { departmentId: logistics.id, sourceType: "Packaging Material", quantity: 180, emissionFactorId: emissionFactors[3].id, date: now, autoCalculated: true },
    { departmentId: corporate.id, sourceType: "Air Travel", quantity: 1260, emissionFactorId: emissionFactors[2].id, date: now, autoCalculated: true }
  ];

  await prisma.carbonTransaction.createMany({
    data: transactionData.map((entry) => ({
      ...entry,
      computedCO2: Number((entry.quantity * emissionFactors.find((factor) => factor.id === entry.emissionFactorId)!.co2PerUnit).toFixed(2))
    }))
  });

  await prisma.employeeParticipation.createMany({
    data: [
      { employeeId: employees[0].id, activityId: csrActivities[0].id, proofUrl: "https://example.com/proofs/river-cleanup-priya.jpg", approvalStatus: "Approved", pointsEarned: 80, completionDate: daysAgo(22) },
      { employeeId: employees[1].id, activityId: csrActivities[0].id, proofUrl: "https://example.com/proofs/river-cleanup-verma.jpg", approvalStatus: "Approved", pointsEarned: 50, completionDate: daysAgo(21) },
      { employeeId: employees[2].id, activityId: csrActivities[1].id, proofUrl: null, approvalStatus: "Rejected", pointsEarned: 0, completionDate: null },
      { employeeId: employees[3].id, activityId: csrActivities[2].id, proofUrl: "https://example.com/proofs/waste-audit-mateo.pdf", approvalStatus: "Approved", pointsEarned: 90, completionDate: daysAgo(7) },
      { employeeId: employees[4].id, activityId: csrActivities[2].id, proofUrl: "https://example.com/proofs/waste-audit-noor.pdf", approvalStatus: "Approved", pointsEarned: 60, completionDate: daysAgo(6) },
      { employeeId: employees[5].id, activityId: csrActivities[3].id, proofUrl: "https://example.com/proofs/paperless-jordan.png", approvalStatus: "Approved", pointsEarned: 110, completionDate: daysAgo(2) },
      { employeeId: employees[6].id, activityId: csrActivities[3].id, proofUrl: null, approvalStatus: "Pending", pointsEarned: 40, completionDate: null },
      { employeeId: employees[7].id, activityId: csrActivities[1].id, proofUrl: "https://example.com/proofs/plantation-omar.jpg", approvalStatus: "Approved", pointsEarned: 40, completionDate: daysAgo(5) }
    ]
  });

  await prisma.challengeParticipation.createMany({
    data: [
      { challengeId: challenges[0].id, employeeId: employees[0].id, progress: 100, proofUrl: null, approvalStatus: "Approved", xpAwarded: 120 },
      { challengeId: challenges[1].id, employeeId: employees[3].id, progress: 100, proofUrl: "https://example.com/proofs/zero-waste-mateo.pdf", approvalStatus: "Approved", xpAwarded: 180 },
      { challengeId: challenges[1].id, employeeId: employees[4].id, progress: 30, proofUrl: null, approvalStatus: "Pending", xpAwarded: 0 },
      { challengeId: challenges[2].id, employeeId: employees[5].id, progress: 100, proofUrl: "https://example.com/proofs/commute-jordan.pdf", approvalStatus: "Approved", xpAwarded: 420 },
      { challengeId: challenges[2].id, employeeId: employees[6].id, progress: 85, proofUrl: null, approvalStatus: "Rejected", xpAwarded: 0 }
    ]
  });

  const employeeBadges: Array<{ employeeId: number; badgeId: number; unlockedAt: Date }> = [];
  for (const employee of employees) {
    if (employee.xp >= 100) employeeBadges.push({ employeeId: employee.id, badgeId: badges[0].id, unlockedAt: daysAgo(40) });
    if (employee.xp >= 500) employeeBadges.push({ employeeId: employee.id, badgeId: badges[1].id, unlockedAt: daysAgo(20) });
    if (employee.xp >= 1000) employeeBadges.push({ employeeId: employee.id, badgeId: badges[2].id, unlockedAt: daysAgo(10) });
    if (employee.xp >= 1500) employeeBadges.push({ employeeId: employee.id, badgeId: badges[3].id, unlockedAt: daysAgo(5) });
  }
  await prisma.employeeBadge.createMany({ data: employeeBadges });

  await prisma.audit.createMany({
    data: [
      { title: "Quarterly Safety and Energy Audit", departmentId: manufacturing.id, auditorName: "Lara Singh", date: daysAgo(12), findings: "Improved energy monitoring but still inconsistent daily logs.", status: "Completed" },
      { title: "Transport and Procurement Review", departmentId: logistics.id, auditorName: "Daniel Costa", date: daysAgo(4), findings: "Open remediation items around route optimization and packaging waste.", status: "UnderReview" }
    ]
  });

  const audits = await prisma.audit.findMany({ orderBy: { id: "asc" } });
  await prisma.complianceIssue.createMany({
    data: [
      { auditId: audits[0].id, severity: "Medium", description: "Documented energy checks need monthly sign-off.", ownerId: employees[0].id, dueDate: daysAgo(2), status: "Resolved", isOverdue: false },
      { auditId: audits[0].id, severity: "Low", description: "Some contractor induction records are incomplete.", ownerId: employees[1].id, dueDate: daysAgo(6), status: "Resolved", isOverdue: false },
      { auditId: audits[1].id, severity: "High", description: "Route optimization action plan not yet submitted.", ownerId: employees[3].id, dueDate: daysAgo(15), status: "Open", isOverdue: true },
      { auditId: audits[1].id, severity: "Medium", description: "Warehouse packaging waste tracking needs weekly reporting.", ownerId: employees[4].id, dueDate: daysAgo(4), status: "Resolved", isOverdue: false }
    ]
  });

  await prisma.departmentScore.createMany({
    data: [
      { departmentId: manufacturing.id, environmentalScore: 67.5, socialScore: 66.7, governanceScore: 91.7, totalScore: 74.5, computedAt: now },
      { departmentId: logistics.id, environmentalScore: 87.5, socialScore: 100.0, governanceScore: 67.5, totalScore: 85.3, computedAt: now },
      { departmentId: corporate.id, environmentalScore: 90.0, socialScore: 66.7, governanceScore: 91.7, totalScore: 83.5, computedAt: now }
    ]
  });

  await prisma.notification.createMany({
    data: [
      { recipientId: employees[0].id, type: "BADGE_UNLOCKED", message: "You unlocked the Starter badge.", read: false },
      { recipientId: employees[3].id, type: "APPROVAL_DECISION", message: "Your CSR proof is pending review.", read: false },
      { recipientId: employees[5].id, type: "COMPLIANCE_RAISED", message: "A new compliance issue was assigned to you.", read: false },
      { recipientId: employees[6].id, type: "POLICY_REMINDER", message: "Please acknowledge the Workplace Inclusion Charter.", read: true }
    ]
  });

  await prisma.orgConfig.create({
    data: {
      envWeight: 40,
      socialWeight: 30,
      govWeight: 30,
      autoEmissionCalc: true,
      evidenceRequired: true,
      badgeAutoAward: true,
      emailAlerts: true
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
