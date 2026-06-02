import { useEffect, useState } from "react";
import { Menu, X, User } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);

    onScroll();
    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#how", label: "Comment ça marche" },
    { href: "#offres", label: "Trajets" },
    { href: "#avis", label: "Avis" },
    { href: "#footer", label: "Contact" },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-sm border-b border-slate-200/50 shadow-sm"
          : "bg-emerald-50/40 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-700 text-white font-bold text-lg shadow-md transition-transform group-hover:scale-105">
            W
          </span>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Waiz
          </span>
        </a>

        {/* Navigation desktop */}
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-700 transition-colors hover:text-emerald-700"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Actions desktop */}
        <div className="hidden items-center gap-3 md:flex">
          <button className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-emerald-700">
            <User className="h-4 w-4" />
            Connexion
          </button>

          <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 text-white text-sm font-semibold rounded-full shadow-md hover:shadow-lg hover:bg-emerald-800 transition-all duration-300">
            S'inscrire
          </button>
        </div>

        {/* Menu mobile */}
        <button
          onClick={() => setOpen(!open)}
          className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 md:hidden transition-colors hover:bg-slate-50"
          aria-label="Menu"
        >
          {open ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation mobile */}
      {open && (
        <div className="border-t border-slate-200 bg-white/95 backdrop-blur-sm md:hidden">
          <div className="space-y-1 px-5 py-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                {l.label}
              </a>
            ))}

            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3">
              <button className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 hover:border-emerald-700 hover:text-emerald-700 transition-colors">
                Connexion
              </button>

              <button className="rounded-full px-4 py-2 bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 transition-colors">
                S'inscrire
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
