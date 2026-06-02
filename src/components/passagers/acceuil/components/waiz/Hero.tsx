import { Heart, ArrowRight, CheckCircle2, Users, Play } from "lucide-react";
import { motion } from "framer-motion";
import heroImg from "@/assets/hero-picture.png";

export function Hero() {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section className="relative w-full min-h-screen bg-gradient-to-b from-emerald-50 to-emerald-50/30 pt-24 pb-16 lg:pt-32 lg:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1, delayChildren: 0.2 },
            },
          }}
        >
          {/* LEFT COLUMN - Content */}
          <motion.div className="flex flex-col justify-center" variants={itemVariants}>
            {/* Badge */}
            <motion.div
              className="inline-flex w-fit items-center gap-2 rounded-full bg-white/60 border border-emerald-200/50 px-3.5 py-2 mb-6 backdrop-blur-sm"
              variants={itemVariants}
            >
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-600" />
              <span className="text-xs font-medium text-slate-700">Covoiturage nouvelle génération à Madagascar</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight text-slate-900 mb-6"
              variants={itemVariants}
            >
              Voyagez malin,{" "}
              <span className="text-emerald-600">économisez</span> plus.
            </motion.h1>

            {/* Description */}
            <motion.p
              className="text-base text-slate-600 leading-relaxed max-w-lg mb-8"
              variants={itemVariants}
            >
              Rejoignez la communauté <span className="font-semibold text-slate-900">Waiz</span> et transformez chaque trajet
              en aventure — sécurisé, abordable et éco-responsable.
            </motion.p>

            {/* Social Proof - Trust metrics */}
            <motion.div
              className="flex flex-col gap-4 mb-8"
              variants={itemVariants}
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <img
                      key={i}
                      src={`https://i.pravatar.cc/40?img=${i + 10}`}
                      alt={`User ${i}`}
                      className="h-9 w-9 rounded-full border-2 border-white object-cover"
                      loading="lazy"
                    />
                  ))}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">+12 000 voyageurs</p>
                  <p className="text-xs text-slate-500">4.9/5 · communauté active</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Trajets vérifiés
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-3 sm:gap-4"
              variants={itemVariants}
            >
              {/* Primary CTA - Download */}
              <motion.button
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 text-white font-semibold rounded-full shadow-md hover:shadow-lg hover:bg-emerald-800 transition-all duration-300"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <Heart className="h-5 w-5" />
                <span>Télécharger l'app</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              {/* Secondary CTA - Sign Up */}
              <motion.button
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-900 font-semibold rounded-full shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-300"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <Users className="h-5 w-5" />
                <span>S'inscrire gratuitement</span>
              </motion.button>
            </motion.div>
          </motion.div>

          {/* RIGHT COLUMN - Visual */}
          <motion.div
            className="relative h-full min-h-96 lg:min-h-[500px]"
            variants={itemVariants}
          >
            <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-200/50">
              {/* Hero Image */}
              <img
                src={heroImg}
                alt="Trajets à Madagascar avec Waiz"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

              {/* Play Button */}
              <motion.button
                className="absolute top-6 right-6 h-12 w-12 rounded-full bg-white text-slate-900 shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="h-5 w-5 fill-current" />
              </motion.button>

              {/* Eco Badge */}
              <motion.div
                className="absolute top-6 left-6 inline-flex items-center gap-2 rounded-lg bg-white/95 backdrop-blur-sm px-3 py-2 shadow-lg border border-white/50"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <span className="text-sm font-semibold text-slate-900">-72%</span>
                <span className="text-xs text-slate-600">CO₂</span>
              </motion.div>

              {/* Trip Card Overlay */}
              <motion.div
                className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-500 mb-1">Antananarivo</p>
                      <p className="font-bold text-slate-900 text-sm">Antananarivo → Toamasina</p>
                    </div>
                    <span className="bg-emerald-700 text-white px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-2">
                      35 000 Ar
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <span>3 places restantes</span>
                    <span className="text-amber-500">★ 4.9</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
