export const dynamic = "force-dynamic";
import { prisma } from "@/server/prisma";
import { EnvironmentalClient } from "@/components/environmental";

export default async function EnvironmentalPage() {
  const [goals, transactions, departments, factors, products] = await Promise.all([
    prisma.environmentalGoal.findMany({
      include: { department: true },
      orderBy: { deadline: "asc" }
    }),
    prisma.carbonTransaction.findMany({
      include: { department: true, emissionFactor: true },
      orderBy: { date: "desc" }
    }),
    prisma.department.findMany({
      orderBy: { name: "asc" }
    }),
    prisma.emissionFactor.findMany({
      orderBy: { sourceType: "asc" }
    }),
    prisma.productESGProfile.findMany({
      include: { department: true },
      orderBy: { productName: "asc" }
    })
  ]);

  return (
    <EnvironmentalClient
      departments={departments.map((d) => ({ id: d.id, name: d.name }))}
      factors={factors.map((f) => ({
        id: f.id,
        sourceType: f.sourceType,
        unit: f.unit,
        co2PerUnit: f.co2PerUnit
      }))}
      products={products.map((p) => ({
        id: p.id,
        productName: p.productName,
        materialType: p.materialType,
        carbonFootprint: p.carbonFootprint,
        recyclable: p.recyclable,
        department: { name: p.department.name }
      }))}
      transactions={transactions.map((tx) => ({
        id: tx.id,
        sourceType: tx.sourceType,
        quantity: tx.quantity,
        computedCO2: tx.computedCO2,
        date: tx.date,
        autoCalculated: tx.autoCalculated,
        department: { name: tx.department.name },
        emissionFactor: { co2PerUnit: tx.emissionFactor.co2PerUnit }
      }))}
      goals={goals.map((g) => ({
        id: g.id,
        name: g.name,
        targetCO2: g.targetCO2,
        currentCO2: g.currentCO2,
        deadline: g.deadline,
        status: g.status,
        department: { name: g.department.name }
      }))}
    />
  );
}
