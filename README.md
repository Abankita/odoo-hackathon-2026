# EcoSphere: ESG Management Platform

A full-stack platform that helps organizations measure, manage, and improve their Environmental, Social, and Governance (ESG) performance, with live, computed scoring instead of static reports, and a gamification layer that drives employee participation.

**Live demo:** https://odoo-hackathon-2026-is2c.vercel.app/

---

## What This Is

Most organizations track ESG data manually: spreadsheets, PDFs, email chains, making it slow, scattered, and impossible to see in real time. EcoSphere integrates ESG directly into daily operations. Every logged action (a fuel purchase, a CSR activity, an audit finding, a completed challenge) automatically feeds into a live-computed ESG score, triggers relevant notifications, and progresses an employee's gamified journey. No manual recalculation, no disconnected systems.

---

## Core Modules

### Environmental
Carbon accounting and sustainability tracking.
- Configurable Emission Factors (CO2 conversion rates per source type)
- Automated carbon emission calculation from logged transactions
- Department-level carbon tracking with historical trend
- Sustainability Goals with live progress tracking
- Product ESG Profiles (material type, carbon index, recyclability)

### Social
CSR activity and employee engagement tracking.
- CSR Activities catalog (volunteering, sustainability drives)
- Employee Participation with proof-of-evidence submission
- Approval queue enforcing evidence requirements
- Diversity and engagement metrics

### Governance
Policy, audit, and compliance management.
- ESG Policy catalog with employee acknowledgement tracking
- Audit logging with linked findings
- Compliance Issue tracking (severity, owner, due date, status)
- Automatic overdue detection and alerting

### Gamification
Incentive layer driving participation across all modules.
- Challenges with full lifecycle: Draft, Active, Under Review, Completed (or Archived at any point)
- XP accumulation from approved activities and completed challenges
- Badges that auto-unlock when XP or completion thresholds are met
- Points-based Reward redemption with stock and balance checks
- Leaderboard ranked by employee and department

### Reports
- Environmental, Social, Governance, and ESG Summary reports
- Custom Report Builder with filters: Department, Date Range, Module, Employee, Challenge, ESG Category
- CSV export

### Settings
- Departments and Categories management
- ESG Configuration: score weighting (Environmental, Social, Governance) and automation toggles
- Notification preferences

---

## The Core Workflow

Everything in EcoSphere follows one pipeline. This is the backbone of the whole platform:

```
Master Config (Departments, Categories, Emission Factors, Goals, Policies, Challenges)
        |
        v
Daily Operations (fuel usage, purchases, CSR activities, audits, challenges)
        |
        v
Transactions (Carbon Transactions, Participation Records, Compliance Issues)
        |
        v
Environmental Score, Social Score, Governance Score
        |
        v
Department Total Score
        |
        v
Overall ESG Score (weighted average, default 40% / 30% / 30%, configurable)
        |
        v
Dashboard, Reports, and Notifications
```

Every score on the Dashboard is computed live from current database state, not a hardcoded or cached number. Logging a transaction, approving a CSR activity, or resolving a compliance issue immediately changes the relevant score.

---

## Automated Business Rules

These run automatically, with no manual admin action required:

| Rule | Behavior |
|---|---|
| Auto Emission Calculation | Carbon Transactions compute CO2 automatically from quantity times Emission Factor |
| Evidence Requirement | CSR/Challenge participation cannot be Approved without an attached proof link |
| Badge Auto-Award | Badges unlock instantly when an employee's XP or challenge-completion count meets the unlock rule |
| Reward Redemption | Checks stock and point balance before deducting points and reducing stock |
| Compliance Overdue Flagging | Open issues past their due date are automatically flagged and trigger a notification |
| Notification System | Fires on new compliance issues, approval decisions, policy reminders, and badge unlocks |

All rules are configurable per organization via Settings, ESG Configuration.

---

## Novelty and Differentiators

- **Live-computing ESG Engine.** Scores are calculated in real time from actual data, not static or seeded values. Configurable score weighting recalculates the entire dashboard instantly on change.
- **Insights Strip.** Rule-based, auto-generated callouts (emissions trend percentage, overdue issue counts, goals off-track) computed directly from live data.
- **Full gamification cause-effect chain.** Completing a challenge visibly cascades into XP, badge unlocks, reward eligibility, and leaderboard reordering, all wired end-to-end.
- **Production-grade UI.** A considered design system (Inter typography, module-specific color accents, clean data visualization) rather than a default component-library look.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) with TypeScript |
| Styling | Tailwind CSS with shadcn/ui |
| Database ORM | Prisma |
| Database | SQLite |
| Charts | Recharts |
| Deployment | Vercel |

---

## Data Model

**Master Data:** Department, Category, Emission Factor, Product ESG Profile, Environmental Goal, ESG Policy, Badge, Reward

**Transactional Data:** Employee, Carbon Transaction, CSR Activity, Employee Participation, Challenge, Challenge Participation, Policy Acknowledgement, Audit, Compliance Issue, Department Score, Notification, Org Config

Full schema defined in `prisma/schema.prisma`.

---

## Getting Started

```bash
# install dependencies
npm install

# set up the database
npx prisma migrate dev

# seed with sample data
npx prisma db seed

# run the dev server
npm run dev
```

Visit `http://localhost:3000`.

---

## Project Structure

```
prisma/
  schema.prisma       (full data model)
  seed.ts             (sample data generator)
src/
  app/                (Next.js App Router pages: Dashboard, Environmental, Social, Governance, Gamification, Reports, Settings)
  components/         (shared UI components)
  lib/                (scoring engine and business rule functions)
README.md
```

---
