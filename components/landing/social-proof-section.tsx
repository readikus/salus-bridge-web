import { CheckCircle, Shield, MapPin } from "lucide-react";

const trustSignals = [
  {
    icon: MapPin,
    title: "Built for UK businesses",
    description: "Designed around UK employment law, Fit Note requirements, and NHS frameworks from day one.",
  },
  {
    icon: Shield,
    title: "GDPR compliant",
    description: "Health data encrypted at rest and in transit. Full audit trails. Data minimisation built in.",
  },
  {
    icon: CheckCircle,
    title: "Launching 2026",
    description: "Join the waitlist for early access and help shape the platform that puts people first.",
  },
];

export function SocialProofSection() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Trusted by forward-thinking HR teams across the UK
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Purpose-built for organisations that take employee wellbeing seriously.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
          {trustSignals.map((signal) => (
            <div key={signal.title} className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
                <signal.icon className="h-6 w-6 text-violet-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{signal.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{signal.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
