export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <p className="text-sm text-slate-500">&copy; 2026 SalusBridge. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="text-sm text-slate-500 transition-colors hover:text-slate-700">
            Privacy Policy
          </a>
          <a href="#" className="text-sm text-slate-500 transition-colors hover:text-slate-700">
            Terms
          </a>
          <a
            href="mailto:hello@salusbridge.com"
            className="text-sm text-slate-500 transition-colors hover:text-slate-700"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
