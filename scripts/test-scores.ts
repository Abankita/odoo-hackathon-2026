import { prisma } from "../src/server/prisma";
import {
  calcEnvironmentalScore,
  calcSocialScore,
  calcGovernanceScore,
  calcDepartmentScore,
} from "../src/server/engine";

async function main() {
  const departments = await prisma.department.findMany();

  console.log("==================================================");
  console.log("   REBALANCED DEPARTMENT SCORES VERIFICATION      ");
  console.log("==================================================");

  for (const dept of departments) {
    const env = await calcEnvironmentalScore(dept.id);
    const social = await calcSocialScore(dept.id);
    const gov = await calcGovernanceScore(dept.id);
    const scoreRecord = await calcDepartmentScore(dept.id);
    const overall = scoreRecord.totalScore;

    console.log(`\n🏢 Department: ${dept.name} (${dept.code})`);
    console.log(`   - Environmental Score : ${env.toFixed(1)} / 100`);
    console.log(`   - Social Score        : ${social.toFixed(1)} / 100`);
    console.log(`   - Governance Score    : ${gov.toFixed(1)} / 100`);
    console.log(`   - Overall ESG Score   : ${overall.toFixed(1)} / 100`);
  }
  console.log("==================================================");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
