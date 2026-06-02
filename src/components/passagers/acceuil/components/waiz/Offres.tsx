import { ArrowRight, Circle, Clock, MapPin, Star, Users } from "lucide-react";

const offres = [
  {
    depart: "Antananarivo",
    arrivee: "Toamasina",
    date: "Sam. 15 juin",
    heure: "06:30",
    places: 3,
    note: 4.9,
    chauffeur: "Haja R.",
    prix: 35000,
    tag: "Populaire",
  },
  {
    depart: "Antananarivo",
    arrivee: "Antsirabe",
    date: "Dim. 16 juin",
    heure: "08:00",
    places: 2,
    note: 4.8,
    chauffeur: "Fara M.",
    prix: 18000,
    tag: "Éco",
  },
  {
    depart: "Toamasina",
    arrivee: "Antananarivo",
    date: "Lun. 17 juin",
    heure: "14:00",
    places: 4,
    note: 5.0,
    chauffeur: "Lova T.",
    prix: 32000,
  },
];

export function Offres() {
  return (
    <section id="offres" className="bg-muted/30 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Trajets disponibles
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Prochains départs
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Sélection des meilleures offres validées par notre communauté.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            Voir tous les trajets <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {offres.map((o, i) => (
            <article
              key={i}
              className="group flex flex-col rounded-3xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-elegant"
            >
              {o.tag && (
                <span className="mb-4 inline-flex w-fit items-center rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent-foreground">
                  {o.tag}
                </span>
              )}

              <div className="space-y-3">
                <Row icon={<Circle className="h-3 w-3 fill-primary text-primary" />} primary={o.depart} secondary={o.heure} />
                <div className="ml-1.5 h-6 border-l-2 border-dashed border-border" />
                <Row icon={<MapPin className="h-4 w-4 -ml-0.5 text-accent" />} primary={o.arrivee} secondary={o.date} />
              </div>

              <div className="my-6 flex items-center gap-4 border-y border-border py-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> {o.date}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> {o.places} places
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" /> {o.note}
                </span>
              </div>

              <div className="mt-auto flex items-end justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">À partir de</p>
                  <p className="text-2xl font-semibold text-foreground">
                    {o.prix.toLocaleString("fr-FR")}{" "}
                    <span className="text-sm font-medium text-muted-foreground">Ar</span>
                  </p>
                </div>
                <button className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-all group-hover:bg-primary">
                  Réserver <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Row({
  icon,
  primary,
  secondary,
}: {
  icon: React.ReactNode;
  primary: string;
  secondary?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-5 w-5 place-items-center">{icon}</span>
      <div className="flex flex-1 items-baseline justify-between">
        <p className="font-semibold text-foreground">{primary}</p>
        {secondary && (
          <span className="text-xs font-medium text-muted-foreground">{secondary}</span>
        )}
      </div>
    </div>
  );
}
