import { Activity, BarChart3, FileCheck, HeartPulse, Shield, Users } from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Sickness Absence Tracking",
    description:
      "Simple reporting for employees and real-time dashboards for managers. Know who's off, why, and when they're expected back.",
  },
  {
    icon: FileCheck,
    title: "Return-to-Work Workflows",
    description:
      "Automated processes guide managers through structured, compliant return-to-work conversations every time.",
  },
  {
    icon: HeartPulse,
    title: "Early Intervention",
    description:
      "Spot patterns before they become problems. Trigger support automatically when absence thresholds are reached.",
  },
  {
    icon: Users,
    title: "Employee Self-Service",
    description:
      "Give employees private, accessible tools to report absence and manage their own wellbeing — reducing stigma and admin.",
  },
  {
    icon: BarChart3,
    title: "HR Analytics",
    description:
      "Actionable insights into absence trends, not just raw data. Understand the why behind the numbers.",
  },
  {
    icon: Shield,
    title: "Compliance & Audit",
    description:
      "GDPR-ready with full audit trails. Every process documented, every decision recorded, every box ticked.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Everything you need for employee wellbeing
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            One platform to manage sickness absence, support return-to-work, and look after your people.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
                <feature.icon className="h-5 w-5 text-violet-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
