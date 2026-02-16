import { ArrowRight, Users, Workflow, HeartHandshake } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Users,
    title: "Connect your team",
    description: "Invite employees and managers to the platform. Set up departments, roles, and reporting lines in minutes.",
  },
  {
    number: "02",
    icon: Workflow,
    title: "Streamline processes",
    description:
      "Automate absence reporting and return-to-work flows. No more spreadsheets, no more chasing paperwork.",
  },
  {
    number: "03",
    icon: HeartHandshake,
    title: "Support your people",
    description:
      "Early intervention alerts and wellbeing insights help you act before small issues become big problems.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-violet-50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Simple to set up, powerful to use
          </h2>
          <p className="mt-4 text-lg text-slate-600">Get up and running in three straightforward steps.</p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.number} className="relative text-center">
              {/* Connecting arrow (hidden on mobile, shown between steps on desktop) */}
              {index < steps.length - 1 && (
                <div className="absolute right-0 top-12 hidden translate-x-1/2 md:block">
                  <ArrowRight className="h-6 w-6 text-violet-300" />
                </div>
              )}

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 shadow-sm">
                <step.icon className="h-7 w-7 text-white" />
              </div>
              <span className="text-sm font-bold uppercase tracking-wider text-violet-500">Step {step.number}</span>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
