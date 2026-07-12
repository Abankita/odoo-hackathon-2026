-- CreateTable
CREATE TABLE "Department" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "head" TEXT NOT NULL,
    "parentDepartmentId" INTEGER,
    "employeeCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    CONSTRAINT "Department_parentDepartmentId_fkey" FOREIGN KEY ("parentDepartmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active'
);

-- CreateTable
CREATE TABLE "EmissionFactor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sourceType" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "co2PerUnit" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "ProductESGProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productName" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "materialType" TEXT NOT NULL,
    "carbonFootprint" REAL NOT NULL,
    "recyclable" BOOLEAN NOT NULL,
    CONSTRAINT "ProductESGProfile_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EnvironmentalGoal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "targetCO2" REAL NOT NULL,
    "currentCO2" REAL NOT NULL,
    "deadline" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "EnvironmentalGoal_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ESGPolicy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "effectiveDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    CONSTRAINT "ESGPolicy_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unlockRule" TEXT NOT NULL,
    "icon" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pointsRequired" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active'
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmployeeBadge" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" INTEGER NOT NULL,
    "badgeId" INTEGER NOT NULL,
    "unlockedAt" DATETIME NOT NULL,
    CONSTRAINT "EmployeeBadge_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmployeeBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CarbonTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "departmentId" INTEGER NOT NULL,
    "sourceType" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "emissionFactorId" INTEGER NOT NULL,
    "computedCO2" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "autoCalculated" BOOLEAN NOT NULL,
    CONSTRAINT "CarbonTransaction_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CarbonTransaction_emissionFactorId_fkey" FOREIGN KEY ("emissionFactorId") REFERENCES "EmissionFactor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CSRActivity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "evidenceRequired" BOOLEAN NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Planned',
    CONSTRAINT "CSRActivity_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmployeeParticipation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" INTEGER NOT NULL,
    "activityId" INTEGER NOT NULL,
    "proofUrl" TEXT,
    "approvalStatus" TEXT NOT NULL,
    "pointsEarned" INTEGER NOT NULL,
    "completionDate" DATETIME,
    CONSTRAINT "EmployeeParticipation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmployeeParticipation_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "CSRActivity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "xp" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "evidenceRequired" BOOLEAN NOT NULL,
    "deadline" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "Challenge_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChallengeParticipation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "challengeId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "proofUrl" TEXT,
    "approvalStatus" TEXT NOT NULL,
    "xpAwarded" INTEGER NOT NULL,
    CONSTRAINT "ChallengeParticipation_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChallengeParticipation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PolicyAcknowledgement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" INTEGER NOT NULL,
    "policyId" INTEGER NOT NULL,
    "acknowledgedDate" DATETIME NOT NULL,
    CONSTRAINT "PolicyAcknowledgement_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PolicyAcknowledgement_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "ESGPolicy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Audit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "auditorName" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "findings" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "Audit_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComplianceIssue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "auditId" INTEGER NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ComplianceIssue_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComplianceIssue_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DepartmentScore" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "departmentId" INTEGER NOT NULL,
    "environmentalScore" REAL NOT NULL,
    "socialScore" REAL NOT NULL,
    "governanceScore" REAL NOT NULL,
    "totalScore" REAL NOT NULL,
    "computedAt" DATETIME NOT NULL,
    CONSTRAINT "DepartmentScore_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "recipientId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrgConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "envWeight" INTEGER NOT NULL DEFAULT 40,
    "socialWeight" INTEGER NOT NULL DEFAULT 30,
    "govWeight" INTEGER NOT NULL DEFAULT 30,
    "autoEmissionCalc" BOOLEAN NOT NULL DEFAULT true,
    "evidenceRequired" BOOLEAN NOT NULL DEFAULT true,
    "badgeAutoAward" BOOLEAN NOT NULL DEFAULT true,
    "emailAlerts" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE INDEX "Department_parentDepartmentId_idx" ON "Department"("parentDepartmentId");

-- CreateIndex
CREATE INDEX "ProductESGProfile_departmentId_idx" ON "ProductESGProfile"("departmentId");

-- CreateIndex
CREATE INDEX "EnvironmentalGoal_departmentId_idx" ON "EnvironmentalGoal"("departmentId");

-- CreateIndex
CREATE INDEX "ESGPolicy_categoryId_idx" ON "ESGPolicy"("categoryId");

-- CreateIndex
CREATE INDEX "Employee_departmentId_idx" ON "Employee"("departmentId");

-- CreateIndex
CREATE INDEX "EmployeeBadge_employeeId_idx" ON "EmployeeBadge"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeBadge_badgeId_idx" ON "EmployeeBadge"("badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeBadge_employeeId_badgeId_key" ON "EmployeeBadge"("employeeId", "badgeId");

-- CreateIndex
CREATE INDEX "CarbonTransaction_departmentId_idx" ON "CarbonTransaction"("departmentId");

-- CreateIndex
CREATE INDEX "CarbonTransaction_emissionFactorId_idx" ON "CarbonTransaction"("emissionFactorId");

-- CreateIndex
CREATE INDEX "CSRActivity_categoryId_idx" ON "CSRActivity"("categoryId");

-- CreateIndex
CREATE INDEX "EmployeeParticipation_employeeId_idx" ON "EmployeeParticipation"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeParticipation_activityId_idx" ON "EmployeeParticipation"("activityId");

-- CreateIndex
CREATE INDEX "Challenge_categoryId_idx" ON "Challenge"("categoryId");

-- CreateIndex
CREATE INDEX "ChallengeParticipation_challengeId_idx" ON "ChallengeParticipation"("challengeId");

-- CreateIndex
CREATE INDEX "ChallengeParticipation_employeeId_idx" ON "ChallengeParticipation"("employeeId");

-- CreateIndex
CREATE INDEX "PolicyAcknowledgement_employeeId_idx" ON "PolicyAcknowledgement"("employeeId");

-- CreateIndex
CREATE INDEX "PolicyAcknowledgement_policyId_idx" ON "PolicyAcknowledgement"("policyId");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyAcknowledgement_employeeId_policyId_key" ON "PolicyAcknowledgement"("employeeId", "policyId");

-- CreateIndex
CREATE INDEX "Audit_departmentId_idx" ON "Audit"("departmentId");

-- CreateIndex
CREATE INDEX "ComplianceIssue_auditId_idx" ON "ComplianceIssue"("auditId");

-- CreateIndex
CREATE INDEX "ComplianceIssue_ownerId_idx" ON "ComplianceIssue"("ownerId");

-- CreateIndex
CREATE INDEX "DepartmentScore_departmentId_idx" ON "DepartmentScore"("departmentId");

-- CreateIndex
CREATE INDEX "Notification_recipientId_idx" ON "Notification"("recipientId");
