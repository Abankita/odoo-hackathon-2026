export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
          EcoSphere
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
          ESG Management Platform scaffold
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Hour 1 is ready: Next.js 14, TypeScript, Tailwind, shadcn/ui config,
          Prisma, SQLite, schema, and seed data.
        </p>
      </div>
    </main>
  );
}
