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
          ? "bg-background/80 backdrop-blur-xl border-b border-border/60"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 group">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-soft transition-transform group-hover:scale-105">
            W
          </span>

          <span className="text-xl font-semibold tracking-tight text-foreground">
            Waiz
          </span>
        </a>

        {/* Navigation desktop */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Actions desktop */}
        <div className="hidden items-center gap-2 md:flex">
          <button className="rounded-full px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
            <span className="inline-flex items-center gap-2">
              <User className="h-4 w-4" />
              Connexion
            </span>
          </button>

          <button className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 hover:shadow-elegant">
            S'inscrire
          </button>
        </div>

        {/* Menu mobile */}
        <button
          onClick={() => setOpen(!open)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground md:hidden"
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
        <div className="border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
          <div className="space-y-1 px-5 py-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                {l.label}
              </a>
            ))}

            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
              <button className="rounded-full border border-border px-4 py-2 text-sm font-medium">
                Connexion
              </button>

              <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                S'inscrire
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}