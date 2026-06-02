import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const items = [
  {
    name: "Haja R.",
    role: "Passager · Tana → Toamasina",
    text: "J'ai économisé énormément sur mon trajet. Conducteur très sympathique et voiture propre. Je recommande vivement Waiz!",
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
    text: "Service fiable et économique. Les passagers étaient ponctuels et respectueux. Je recommande à toute ma famille!",
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

  const slideVariants = {
    enter: { opacity: 0, x: 50 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <section id="avis" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600 mb-3">
            Ils nous font confiance
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
            La voix de la communauté
          </h2>
        </motion.div>

        {/* Testimonial Card */}
        <motion.div
          className="relative rounded-3xl border border-slate-200/60 bg-white p-8 sm:p-10 lg:p-14 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
        >
          {/* Quote Icon */}
          <Quote className="absolute right-6 sm:right-8 top-6 sm:top-8 h-14 w-14 sm:h-16 sm:w-16 text-emerald-100" />

          {/* Stars */}
          <div className="flex gap-1 mb-6">
            {Array.from({ length: t.rating }).map((_, k) => (
              <Star
                key={k}
                className="h-5 w-5 fill-amber-400 text-amber-400"
              />
            ))}
          </div>

          {/* Testimonial Text */}
          <AnimatePresence mode="wait">
            <motion.p
              key={i}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5 }}
              className="text-2xl sm:text-3xl font-semibold leading-relaxed text-slate-900 text-balance mb-8"
            >
              "{t.text}"
            </motion.p>
          </AnimatePresence>

          {/* Author Info & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pt-6 border-t border-slate-200/60">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold text-lg">
                {t.name[0]}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{t.name}</p>
                <p className="text-sm text-slate-600">{t.role}</p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => setI((i - 1 + items.length) % items.length)}
                className="h-10 w-10 rounded-full border border-slate-200 bg-white text-slate-700 hover:border-emerald-600 hover:text-emerald-600 transition-all flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Précédent"
              >
                <ChevronLeft className="h-5 w-5" />
              </motion.button>
              <motion.button
                onClick={() => setI((i + 1) % items.length)}
                className="h-10 w-10 rounded-full bg-emerald-700 text-white hover:bg-emerald-800 transition-all flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Suivant"
              >
                <ChevronRight className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Dot Indicators */}
        <motion.div
          className="mt-8 flex justify-center gap-2"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {items.map((_, k) => (
            <motion.button
              key={k}
              onClick={() => setI(k)}
              className={`rounded-full transition-all ${
                k === i
                  ? "w-8 h-2.5 bg-emerald-700"
                  : "w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400"
              }`}
              aria-label={`Avis ${k + 1}`}
              whileHover={{ scale: 1.1 }}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
