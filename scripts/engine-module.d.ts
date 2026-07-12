declare module "../src/server/engine" {
  export type CarbonTransactionInput = {
    departmentId?: number;
    sourceType: string;
    quantity: number;
    emissionFactorId?: number;
    date?: Date;
    computedCO2?: number;
    autoCalculated?: boolean;
  };

  export function calcEnvironmentalScore(departmentId: number): Promise<number>;
  export function calcSocialScore(departmentId: number): Promise<number>;
  export function calcGovernanceScore(departmentId: number): Promise<number>;
  export function calcDepartmentScore(departmentId: number): Promise<{ totalScore: number }>;
  export function calcOverallESGScore(): Promise<number>;
  export function autoCalculateEmission(input: CarbonTransactionInput): Promise<CarbonTransactionInput>;
  export function canApproveParticipation(participationId: number): Promise<boolean>;
  export function checkBadgeUnlocks(employeeId: number): Promise<Array<{ badgeId: number; name: string; awarded: boolean }>>;
  export function redeemReward(employeeId: number, rewardId: number): Promise<{ success: boolean; reason: string | null }>;
  export function flagOverdueIssues(): Promise<{ updatedCount: number; notificationsCreated: number; issueCount: number }>;
}
