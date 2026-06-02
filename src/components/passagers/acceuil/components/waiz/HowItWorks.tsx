import { Lock, Route, Search, UserCheck } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Recherchez",
    desc: "Entrez votre destination, votre date et le nombre de passagers.",
  },
  {
    icon: UserCheck,
    title: "Sélectionnez",
    desc: "Choisissez le conducteur selon ses avis, son véhicule et son prix.",
  },
  {
    icon: Lock,
    title: "Réservez",
    desc: "Paiement sécurisé en quelques clics — confirmation instantanée.",
  },
  {
    icon: Route,
    title: "Voyagez",
    desc: "Profitez du trajet, puis partagez votre expérience après l'aventure.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Simple & rapide
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Réservez en 4 étapes
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Une expérience pensée pour la simplicité, du premier clic au dernier kilomètre.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="group relative rounded-3xl border border-border bg-card p-7 transition-all hover:-translate-y-1 hover:shadow-card"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <s.icon className="h-5 w-5" />
                </span>
                <span className="text-5xl font-semibold text-muted/60 leading-none">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-foreground">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
