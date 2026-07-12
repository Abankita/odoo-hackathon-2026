"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Leaf, Plus, Sparkles, AlertCircle } from "lucide-react";

type Department = { id: number; name: string };
type EmissionFactor = { id: number; sourceType: string; unit: string; co2PerUnit: number };

type ProductESG = {
  id: number;
  productName: string;
  materialType: string;
  carbonFootprint: number;
  recyclable: boolean;
  department: { name: string };
};

type CarbonTx = {
  id: number;
  sourceType: string;
  quantity: number;
  computedCO2: number;
  date: string | Date;
  autoCalculated: boolean;
  department: { name: string };
  emissionFactor: { co2PerUnit: number };
};

type Goal = {
  id: number;
  name: string;
  targetCO2: number;
  currentCO2: number;
  deadline: string | Date;
  status: string;
  department: { name: string };
};

type EnvironmentalProps = {
  departments: Department[];
  factors: EmissionFactor[];
  products: ProductESG[];
  transactions: CarbonTx[];
  goals: Goal[];
};

export function EnvironmentalClient({
  departments,
  factors: initialFactors,
  products: initialProducts,
  transactions: initialTransactions,
  goals
}: EnvironmentalProps) {
  const router = useRouter();

  // Local state for lists
  const [factors, setFactors] = useState<EmissionFactor[]>(initialFactors);
  const [products, setProducts] = useState<ProductESG[]>(initialProducts);
  const [transactions, setTransactions] = useState<CarbonTx[]>(initialTransactions);

  // Forms state
  const [carbonTxForm, setCarbonTxForm] = useState({
    departmentId: departments[0]?.id || 1,
    sourceType: "Diesel",
    quantity: 0,
    date: new Date().toISOString().split("T")[0]
  });

  const [factorForm, setFactorForm] = useState({
    sourceType: "",
    unit: "",
    co2PerUnit: 0
  });

  const [productForm, setProductForm] = useState({
    productName: "",
    departmentId: departments[0]?.id || 1,
    materialType: "",
    carbonFootprint: 0,
    recyclable: true
  });

  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const triggerFeedback = (text: string, type: "success" | "error") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleLogCarbon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/log-carbon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(carbonTxForm)
      });
      const data = await response.json();
      if (response.ok) {
        setTransactions([data, ...transactions]);
        triggerFeedback(`Successfully logged! Computed CO2: ${data.computedCO2} kg.`, "success");
        router.refresh();
      } else {
        triggerFeedback(data.error || "Failed to log carbon transaction.", "error");
      }
    } catch {
      triggerFeedback("Network error occurred.", "error");
    }
  };

  const handleAddFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorForm.sourceType || !factorForm.unit) {
      triggerFeedback("All fields are required.", "error");
      return;
    }
    try {
      const response = await fetch("/api/environmental/factors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(factorForm)
      });
      const data = await response.json();
      if (response.ok) {
        setFactors([...factors, data]);
        triggerFeedback(`Emission factor '${data.sourceType}' added successfully!`, "success");
        setFactorForm({ sourceType: "", unit: "", co2PerUnit: 0 });
        router.refresh();
      } else {
        triggerFeedback(data.error || "Failed to add factor.", "error");
      }
    } catch {
      triggerFeedback("Network error occurred.", "error");
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.productName || !productForm.materialType) {
      triggerFeedback("All fields are required.", "error");
      return;
    }
    try {
      const response = await fetch("/api/environmental/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productForm)
      });
      const data = await response.json();
      if (response.ok) {
        // Fetch fresh list to get relation details
        triggerFeedback(`Product profile '${data.productName}' added!`, "success");
        setProductForm({ productName: "", departmentId: departments[0]?.id || 1, materialType: "", carbonFootprint: 0, recyclable: true });
        router.refresh();
        // Since database refresh will update page props, let the parent pass it down
        setTimeout(() => window.location.reload(), 800);
      } else {
        triggerFeedback(data.error || "Failed to add product profile.", "error");
      }
    } catch {
      triggerFeedback("Network error occurred.", "error");
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {feedback && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border animate-in fade-in slide-in-from-bottom-5 ${
            feedback.type === "success" ? "bg-emerald-900 border-emerald-800 text-white" : "bg-red-900 border-red-800 text-white"
          }`}
        >
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-semibold">{feedback.text}</span>
        </div>
      )}

      {/* Main Top Grid */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Carbon Transaction Log Form */}
        <Card className="shadow-sm bg-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-emerald-700" />
              <CardTitle>Log Carbon Emission</CardTitle>
            </div>
            <CardDescription>
              Record utility usage, fuel expenditure, or packaging inputs. Auto-calculates based on database factors.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogCarbon} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                  <span>Department</span>
                  <Select
                    value={carbonTxForm.departmentId}
                    onChange={(e) => setCarbonTxForm({ ...carbonTxForm, departmentId: Number(e.target.value) })}
                    className="bg-slate-50 border-slate-200 rounded-xl"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                  <span>Source Type / Emission Factor</span>
                  <Select
                    value={carbonTxForm.sourceType}
                    onChange={(e) => setCarbonTxForm({ ...carbonTxForm, sourceType: e.target.value })}
                    className="bg-slate-50 border-slate-200 rounded-xl"
                  >
                    {factors.map((f) => (
                      <option key={f.id} value={f.sourceType}>
                        {f.sourceType} ({f.unit})
                      </option>
                    ))}
                  </Select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                  <span>Quantity</span>
                  <Input
                    type="number"
                    value={carbonTxForm.quantity || ""}
                    onChange={(e) => setCarbonTxForm({ ...carbonTxForm, quantity: Number(e.target.value) })}
                    placeholder="e.g. 250"
                    className="bg-slate-50 border-slate-200 rounded-xl"
                    min={0.01}
                    step="any"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                  <span>Date Logged</span>
                  <Input
                    type="date"
                    value={carbonTxForm.date}
                    onChange={(e) => setCarbonTxForm({ ...carbonTxForm, date: e.target.value })}
                    className="bg-slate-50 border-slate-200 rounded-xl"
                  />
                </label>
              </div>

              <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl px-6">
                Calculate & Log CO2
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Goals Progress */}
        <Card className="shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Environmental Target Goals</CardTitle>
            <CardDescription>Target CO2 reductions mapped by department deadlines.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {goals.map((goal) => {
              const target = goal.targetCO2 > 0 ? goal.targetCO2 : 1;
              const percent = Math.max(0, Math.min(100, Math.round((1 - goal.currentCO2 / target) * 100)));
              
              let statusTone = "bg-blue-50 text-blue-700 border-blue-100";
              if (goal.status === "OnTrack" || goal.status === "Completed") {
                statusTone = "bg-emerald-50 text-emerald-800 border-emerald-100";
              } else if (goal.status === "OffTrack") {
                statusTone = "bg-red-50 text-red-800 border-red-100";
              }

              return (
                <div key={goal.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{goal.name}</h4>
                      <p className="text-xs text-slate-500">{goal.department.name} department</p>
                    </div>
                    <Badge className={`${statusTone} text-[10px] font-bold uppercase`}>{goal.status}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400 font-medium">
                      <span>CO2: {goal.currentCO2} / {goal.targetCO2} kg</span>
                      <span>{percent}% reduced</span>
                    </div>
                    <Progress value={percent} className="h-1.5 bg-slate-100 [&>div]:bg-emerald-600" />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Carbon Transactions History */}
      <Card className="shadow-sm bg-white">
        <CardHeader>
          <CardTitle>Log Ledger (Carbon Transactions)</CardTitle>
          <CardDescription>Recent audit logs of carbon footprints with auto-calculated details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold">Date</TableHead>
                  <TableHead className="font-bold">Department</TableHead>
                  <TableHead className="font-bold">Source Type</TableHead>
                  <TableHead className="font-bold text-right">Quantity</TableHead>
                  <TableHead className="font-bold text-right">Computed CO2 (kg)</TableHead>
                  <TableHead className="font-bold text-center">Engine Mode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-400 py-6">
                      No carbon transactions logged yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.slice(0, 15).map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-slate-600">
                        {new Date(tx.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-bold text-slate-800">{tx.department.name}</TableCell>
                      <TableCell className="font-semibold text-slate-700">{tx.sourceType}</TableCell>
                      <TableCell className="text-right font-medium text-slate-600">
                        {tx.quantity.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-700">
                        {tx.computedCO2.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={tx.autoCalculated ? "bg-emerald-50 text-emerald-800 border-emerald-100 text-[10px] font-bold" : "bg-slate-50 text-slate-700 border-slate-100 text-[10px] font-bold"}>
                          {tx.autoCalculated ? "AUTO" : "MANUAL"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Emission Factors and Product ESG Profiles CRUD */}
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        
        {/* Emission Factors CRUD */}
        <Card className="shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Emission Factors Management</CardTitle>
            <CardDescription>CO2 co-efficient multiplier values used for utility computations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleAddFactor} className="grid gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-xs font-bold text-slate-400 uppercase">Create New Factor</span>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  value={factorForm.sourceType}
                  onChange={(e) => setFactorForm({ ...factorForm, sourceType: e.target.value })}
                  placeholder="Diesel / Air Travel"
                  className="bg-white border-slate-200 rounded-lg text-xs h-9"
                />
                <Input
                  value={factorForm.unit}
                  onChange={(e) => setFactorForm({ ...factorForm, unit: e.target.value })}
                  placeholder="liters / km"
                  className="bg-white border-slate-200 rounded-lg text-xs h-9"
                />
                <Input
                  type="number"
                  value={factorForm.co2PerUnit || ""}
                  onChange={(e) => setFactorForm({ ...factorForm, co2PerUnit: Number(e.target.value) })}
                  placeholder="CO2 / Unit (kg)"
                  className="bg-white border-slate-200 rounded-lg text-xs h-9"
                  step="any"
                  min={0.0001}
                />
              </div>
              <Button type="submit" size="sm" className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1 text-xs py-1.5 h-8">
                <Plus className="h-3.5 w-3.5" />
                <span>Add Factor</span>
              </Button>
            </form>

            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-bold text-xs">Source Type</TableHead>
                    <TableHead className="font-bold text-xs">Unit</TableHead>
                    <TableHead className="font-bold text-xs text-right">CO2 Factor (kg)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factors.map((factor) => (
                    <TableRow key={factor.id} className="hover:bg-slate-50/30 text-xs">
                      <TableCell className="font-bold text-slate-800">{factor.sourceType}</TableCell>
                      <TableCell className="font-semibold text-slate-500">{factor.unit}</TableCell>
                      <TableCell className="text-right font-extrabold text-slate-950">{factor.co2PerUnit.toFixed(4)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Product ESG Profiles CRUD */}
        <Card className="shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Product ESG Profiles</CardTitle>
            <CardDescription>Product material composition and raw carbon index registry.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleAddProduct} className="grid gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-xs font-bold text-slate-400 uppercase">Registry Form</span>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={productForm.productName}
                  onChange={(e) => setProductForm({ ...productForm, productName: e.target.value })}
                  placeholder="Product / Part Name"
                  className="bg-white border-slate-200 rounded-lg text-xs h-9"
                />
                <Input
                  value={productForm.materialType}
                  onChange={(e) => setProductForm({ ...productForm, materialType: e.target.value })}
                  placeholder="Material (Aluminum, PET)"
                  className="bg-white border-slate-200 rounded-lg text-xs h-9"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Select
                  value={productForm.departmentId}
                  onChange={(e) => setProductForm({ ...productForm, departmentId: Number(e.target.value) })}
                  className="bg-white border-slate-200 rounded-lg text-xs h-9"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  value={productForm.carbonFootprint || ""}
                  onChange={(e) => setProductForm({ ...productForm, carbonFootprint: Number(e.target.value) })}
                  placeholder="CO2 Footprint (kg)"
                  className="bg-white border-slate-200 rounded-lg text-xs h-9"
                  step="any"
                  min={0.01}
                />
                <Select
                  value={productForm.recyclable ? "true" : "false"}
                  onChange={(e) => setProductForm({ ...productForm, recyclable: e.target.value === "true" })}
                  className="bg-white border-slate-200 rounded-lg text-xs h-9"
                >
                  <option value="true">Recyclable: YES</option>
                  <option value="false">Recyclable: NO</option>
                </Select>
              </div>
              <Button type="submit" size="sm" className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1 text-xs py-1.5 h-8">
                <Plus className="h-3.5 w-3.5" />
                <span>Register Product</span>
              </Button>
            </form>

            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-bold text-xs">Product Name</TableHead>
                    <TableHead className="font-bold text-xs">Department</TableHead>
                    <TableHead className="font-bold text-xs">Material</TableHead>
                    <TableHead className="font-bold text-xs text-right">CO2 Index</TableHead>
                    <TableHead className="font-bold text-xs text-center">Recyclable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-400 text-xs py-4">
                        No products registered.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((prod) => (
                      <TableRow key={prod.id} className="hover:bg-slate-50/30 text-xs">
                        <TableCell className="font-bold text-slate-800">{prod.productName}</TableCell>
                        <TableCell className="font-semibold text-slate-500">{prod.department?.name}</TableCell>
                        <TableCell className="font-medium text-slate-600">{prod.materialType}</TableCell>
                        <TableCell className="text-right font-extrabold text-emerald-800">{prod.carbonFootprint.toFixed(1)} kg</TableCell>
                        <TableCell className="text-center">
                          <Badge className={prod.recyclable ? "bg-emerald-50 text-emerald-800 border-emerald-100 text-[10px] font-bold" : "bg-red-50 text-red-800 border-red-100 text-[10px] font-bold"}>
                            {prod.recyclable ? "YES" : "NO"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
