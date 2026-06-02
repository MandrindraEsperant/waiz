import { useState } from "react";
import { ArrowLeftRight, Calendar, MapPin, Search, Users } from "lucide-react";

export function SearchBar() {
  const [tab, setTab] = useState<"one" | "round">("one");
  const [depart, setDepart] = useState("");
  const [arrivee, setArrivee] = useState("");

  const swap = () => {
    setDepart(arrivee);
    setArrivee(depart);
  };

  return (
    <section className="relative -mt-12 px-5 lg:-mt-16 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card p-3 shadow-elegant lg:p-4">
        <div className="flex gap-1 px-2 pt-1">
          {(["one", "round"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "one" ? "Aller simple" : "Aller-retour"}
            </button>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_1fr_1fr_auto_auto] md:items-stretch">
          <Field icon={<MapPin className="h-4 w-4 text-primary" />} label="Départ">
            <input
              value={depart}
              onChange={(e) => setDepart(e.target.value)}
              placeholder="Antananarivo"
              className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </Field>

          <button
            onClick={swap}
            className="hidden md:grid place-items-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-primary hover:border-primary mx-1"
            aria-label="Inverser"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>

          <Field icon={<MapPin className="h-4 w-4 text-accent" />} label="Arrivée">
            <input
              value={arrivee}
              onChange={(e) => setArrivee(e.target.value)}
              placeholder="Toamasina"
              className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </Field>

          <Field icon={<Calendar className="h-4 w-4" />} label="Date">
            <input
              type="date"
              className="w-full bg-transparent text-sm font-medium text-foreground focus:outline-none"
            />
          </Field>

          <Field icon={<Users className="h-4 w-4" />} label="Passagers">
            <select className="w-full bg-transparent text-sm font-medium text-foreground focus:outline-none">
              {[1, 2, 3, 4].map((n) => (
                <option key={n}>{n} passager{n > 1 ? "s" : ""}</option>
              ))}
            </select>
          </Field>

          <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 md:px-7">
            <Search className="h-4 w-4" />
            Rechercher
          </button>
        </div>
      </div>
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
    <label className="group flex items-center gap-3 rounded-2xl bg-muted/40 px-4 py-3 transition-colors hover:bg-muted">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-background text-muted-foreground">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {children}
      </span>
    </label>
  );
}
