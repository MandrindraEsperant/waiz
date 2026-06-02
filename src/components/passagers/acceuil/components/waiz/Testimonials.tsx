import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";

const items = [
  {
    name: "Haja R.",
    role: "Passager · Tana → Toamasina",
    text: "J'ai économisé énormément sur mon trajet. Conducteur très sympathique et voiture propre. Je recommande vivement Waiz !",
    rating: 5,
  },
  {
    name: "Fara M.",
    role: "Conductrice · Antsirabe",
    text: "Première expérience en tant que conductrice — j'ai partagé mes frais et rencontré des personnes formidables. L'app est très intuitive.",
    rating: 5,
  },
  {
    name: "Lova T.",
    role: "Passagère · Mahajanga",
    text: "Service fiable et économique. Les passagers étaient ponctuels et respectueux. Je recommande à toute ma famille !",
    rating: 5,
  },
  {
    name: "Tsiry D.",
    role: "Voyageur régulier",
    text: "Grâce à Waiz, je fais Tana-Antsirabe chaque semaine pour un prix abordable. C'est devenu mon transport principal.",
    rating: 5,
  },
];

export function Testimonials() {
  const [i, setI] = useState(0);
  const t = items[i];
  return (
    <section id="avis" className="py-24 lg:py-32">
      <div className="mx-auto max-w-5xl px-5 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Ils nous font confiance
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            La voix de la communauté
          </h2>
        </div>

        <div className="relative mt-16 rounded-3xl border border-border bg-card p-8 shadow-card lg:p-14">
          <Quote className="absolute right-8 top-8 h-16 w-16 text-primary/10" />

          <div className="flex gap-1">
            {Array.from({ length: t.rating }).map((_, k) => (
              <Star key={k} className="h-5 w-5 fill-accent text-accent" />
            ))}
          </div>

          <p className="mt-6 text-2xl font-medium leading-relaxed text-foreground text-balance lg:text-3xl">
            "{t.text}"
          </p>

          <div className="mt-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                {t.name[0]}
              </span>
              <div>
                <p className="font-semibold text-foreground">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setI((i - 1 + items.length) % items.length)}
                className="grid h-11 w-11 place-items-center rounded-full border border-border bg-background transition-colors hover:border-primary hover:text-primary"
                aria-label="Précédent"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setI((i + 1) % items.length)}
                className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                aria-label="Suivant"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {items.map((_, k) => (
            <button
              key={k}
              onClick={() => setI(k)}
              className={`h-1.5 rounded-full transition-all ${
                k === i ? "w-8 bg-primary" : "w-2 bg-border"
              }`}
              aria-label={`Avis ${k + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
