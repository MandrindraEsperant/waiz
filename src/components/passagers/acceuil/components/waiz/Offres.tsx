import { ArrowRight, MapPin, Clock, Users, Star } from "lucide-react";
import { motion } from "framer-motion";

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
    tag: "Eco",
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
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section id="offres" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600 mb-3">
              Trajets disponibles
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-4">
              Prochains départs
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl">
              Sélection des meilleures offres validées par notre communauté.
            </p>
          </motion.div>
          <motion.button
            className="inline-flex items-center gap-2 px-5 py-3 font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            whileHover={{ x: 4 }}
          >
            Voir tous les trajets <ArrowRight className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Offers Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {offres.map((o, i) => (
            <motion.article
              key={i}
              className="group relative rounded-2xl border border-slate-200/60 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-emerald-200 hover:-translate-y-1 flex flex-col"
              variants={itemVariants}
            >
              {/* Tag Badge */}
              {o.tag && (
                <div className="inline-flex w-fit items-center rounded-full bg-emerald-100/60 px-3 py-1 text-xs font-semibold text-emerald-700 mb-4">
                  {o.tag}
                </div>
              )}

              {/* Route Info */}
              <div className="space-y-3 mb-6 pb-6 border-b border-slate-200/60">
                {/* Departure */}
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{o.depart}</p>
                    <p className="text-xs text-slate-500">{o.heure}</p>
                  </div>
                </div>

                {/* Line Connector */}
                <div className="ml-0.5 h-6 border-l-2 border-dashed border-slate-200" />

                {/* Arrival */}
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{o.arrivee}</p>
                    <p className="text-xs text-slate-500">{o.date}</p>
                  </div>
                </div>
              </div>

              {/* Details Row */}
              <div className="flex items-center gap-3 mb-6 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0" /> {o.places} places
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 flex-shrink-0" /> {o.places} places restantes
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 flex-shrink-0" /> {o.note}
                </span>
              </div>

              {/* Footer - Price and CTA */}
              <div className="mt-auto flex items-end justify-between pt-4 border-t border-slate-200/60">
                <div>
                  <p className="text-xs text-slate-500 mb-1">À partir de</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {o.prix.toLocaleString("fr-FR")}
                    <span className="text-sm font-medium text-slate-500 ml-1">Ar</span>
                  </p>
                </div>
                <motion.button
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 text-white px-4 py-2.5 font-semibold text-sm hover:bg-emerald-800 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Réserver
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
