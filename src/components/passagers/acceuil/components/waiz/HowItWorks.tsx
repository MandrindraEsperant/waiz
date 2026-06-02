import { Lock, Route, Search, UserCheck } from "lucide-react";
import { motion } from "framer-motion";

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
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
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
    <section id="how" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          className="mx-auto max-w-2xl text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600 mb-3">
            Simple et rapide
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-4">
            Réservez en 4 étapes
          </h2>
          <p className="text-lg text-slate-600">
            Une expérience pensée pour la simplicité, du premier clic au dernier kilomètre.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              className="group relative"
              variants={itemVariants}
            >
              {/* Connector line (hidden on mobile) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 -right-3 w-6 h-0.5 bg-gradient-to-r from-emerald-300 to-transparent" />
              )}

              {/* Card */}
              <div className="h-full rounded-2xl border border-slate-200/60 bg-white p-6 sm:p-7 transition-all duration-300 hover:shadow-lg hover:border-emerald-200 hover:-translate-y-1">
                {/* Icon */}
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-100/60 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                  <s.icon className="h-6 w-6" />
                </div>

                {/* Step Number */}
                <div className="text-4xl font-bold text-slate-900/10 leading-none mt-3 mb-4">
                  {String(i + 1).padStart(2, "0")}
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
