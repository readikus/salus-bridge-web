import { WaitlistForm } from "./waitlist-form";

export function CtaSection() {
  return (
    <section id="waitlist" className="bg-gradient-to-br from-violet-600 to-purple-700 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Be the first to know</h2>
          <p className="mt-4 text-lg text-violet-100">
            Join the waitlist for early access to SalusBridge. We're building something that puts people first — and
            we'd love you to be part of it.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-xl">
          <WaitlistForm />
        </div>

        <p className="mt-6 text-center text-xs text-violet-200">
          No spam, ever. We'll only contact you about SalusBridge.
        </p>
      </div>
    </section>
  );
}
