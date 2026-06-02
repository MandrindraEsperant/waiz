import { useState } from "react";
import { ArrowLeftRight, Calendar, MapPin, Search } from "lucide-react";
import { motion } from "framer-motion";

export function SearchBar() {
  const [tab, setTab] = useState<"one" | "round">("one");
  const [depart, setDepart] = useState("");
  const [arrivee, setArrivee] = useState("");

  const swap = () => {
    setDepart(arrivee);
    setArrivee(depart);
  };

  return (
    <section className="relative -mt-16 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="mx-auto max-w-6xl rounded-2xl lg:rounded-3xl border border-slate-200/60 bg-white p-4 sm:p-5 lg:p-6 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Tab Selection */}
        <div className="flex gap-2 px-1 pb-4 border-b border-slate-200/50">
          {(["one", "round"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === t
                  ? "bg-emerald-100/60 text-emerald-700 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/40"
              }`}
            >
              {t === "one" ? "Aller simple" : "Aller-retour"}
            </button>
          ))}
        </div>

        {/* Search Fields */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-[1fr_auto_1fr_1fr_auto_auto] md:items-stretch">
          {/* Departure Field */}
          <Field
            icon={<MapPin className="h-5 w-5 text-emerald-600" />}
            label="Départ"
          >
            <input
              value={depart}
              onChange={(e) => setDepart(e.target.value)}
              placeholder="Antananarivo"
              className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </Field>

          {/* Swap Button */}
          <button
            onClick={swap}
            className="hidden md:grid place-items-center h-full rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all"
            aria-label="Inverser"
          >
            <ArrowLeftRight className="h-5 w-5" />
          </button>

          {/* Arrival Field */}
          <Field
            icon={<MapPin className="h-5 w-5 text-emerald-600" />}
            label="Arrivée"
          >
            <input
              value={arrivee}
              onChange={(e) => setArrivee(e.target.value)}
              placeholder="Toamasina"
              className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </Field>

          {/* Date Field */}
          <Field
            icon={<Calendar className="h-5 w-5 text-emerald-600" />}
            label="Date"
          >
            <input
              type="date"
              className="w-full bg-transparent text-sm font-medium text-slate-900 focus:outline-none"
            />
          </Field>

          {/* Passengers Field */}
          <Field
            icon={<Search className="h-5 w-5 text-emerald-600" />}
            label="Passagers"
          >
            <select className="w-full bg-transparent text-sm font-medium text-slate-900 focus:outline-none cursor-pointer">
              {[1, 2, 3, 4].map((n) => (
                <option key={n}>{n} passager{n > 1 ? "s" : ""}</option>
              ))}
            </select>
          </Field>

          {/* Search Button */}
          <motion.button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:bg-emerald-800 transition-all md:py-0"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Rechercher</span>
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-3 rounded-lg bg-slate-50/60 px-4 py-3 hover:bg-slate-100/60 transition-colors focus-within:bg-emerald-50/60 focus-within:ring-2 focus-within:ring-emerald-200">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-slate-600">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {children}
      </span>
    </label>
  );
}
