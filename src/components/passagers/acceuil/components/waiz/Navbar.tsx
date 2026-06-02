import { useEffect, useState } from "react";
import { Menu, X, LogIn } from "lucide-react";
import { motion } from "framer-motion";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);

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
          ? "bg-white/95 backdrop-blur-md border-b border-slate-200/40 shadow-md"
          : "bg-emerald-50/50 backdrop-blur-md border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 lg:px-8">
        {/* Logo */}
        <motion.a 
          href="/" 
          className="flex items-center gap-2.5 group flex-shrink-0"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 blur-sm opacity-75 group-hover:opacity-100 transition-opacity" />
            <span className="relative grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-bold text-lg shadow-lg transition-all group-hover:shadow-xl">
              W
            </span>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 bg-gradient-to-r from-slate-900 to-emerald-700 bg-clip-text text-transparent">
            Waiz
          </span>
        </motion.a>

        {/* Navigation desktop */}
        <nav className="hidden items-center gap-10 md:flex">
          {links.map((l) => (
            <motion.a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors relative group"
              whileHover="hover"
            >
              {l.label}
              <motion.span
                className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-emerald-600 to-emerald-500"
                initial={{ width: 0 }}
                variants={{ hover: { width: "100%" } }}
                transition={{ duration: 0.3 }}
              />
            </motion.a>
          ))}
        </nav>

        {/* Actions desktop */}
        <div className="hidden items-center gap-2.5 md:flex">
          <motion.button
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/50 rounded-full transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogIn className="h-4 w-4" />
            Connexion
          </motion.button>

          <motion.button
            className="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-semibold rounded-full shadow-md hover:shadow-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            S'inscrire
          </motion.button>
        </div>

        {/* Menu mobile */}
        <motion.button
          onClick={() => setOpen(!open)}
          className="grid h-10 w-10 place-items-center rounded-lg border border-slate-300 bg-white/50 text-slate-700 md:hidden backdrop-blur-sm transition-all hover:bg-white hover:border-slate-400"
          aria-label="Menu"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {open ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </motion.button>
      </div>

      {/* Navigation mobile */}
      <motion.div
        initial={false}
        animate={open ? "open" : "closed"}
        variants={{
          open: { height: "auto", opacity: 1 },
          closed: { height: 0, opacity: 0 },
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden border-t border-slate-200/50 bg-white/95 backdrop-blur-md md:hidden"
      >
        <div className="space-y-1 px-5 py-4">
          {links.map((l) => (
            <motion.a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              whileHover={{ x: 4 }}
            >
              {l.label}
            </motion.a>
          ))}

          <div className="mt-4 grid grid-cols-2 gap-2.5 border-t border-slate-200/50 pt-4">
            <motion.button
              className="rounded-full px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 hover:border-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Connexion
            </motion.button>

            <motion.button
              className="rounded-full px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              S'inscrire
            </motion.button>
          </div>
        </div>
      </motion.div>
    </header>
  );
}
