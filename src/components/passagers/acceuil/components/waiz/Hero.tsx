import { Download, ArrowRight, ChevronRight, MapPin, Clock, Users, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import heroImg from "@/assets/hero-picture.png";

export function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50 pt-24 pb-12 lg:pt-32 lg:pb-20">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl -z-10" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* LEFT COLUMN - Content */}
          <motion.div className="flex flex-col justify-center" variants={itemVariants}>
            {/* Badge */}
            <motion.div
              className="inline-flex w-fit items-center gap-2.5 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-2 mb-6"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="flex h-2 w-2 relative">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 animate-pulse" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
              </div>
              <span className="text-sm font-semibold text-emerald-700">Nouvelle génération 🚀</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight text-slate-900 mb-6"
              variants={itemVariants}
            >
              Voyagez malin,{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  économisez
                </span>
                <motion.svg
                  viewBox="0 0 200 10"
                  className="absolute -bottom-2 left-0 w-full text-emerald-400"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                >
                  <motion.path
                    d="M2 8 Q 50 2, 100 6 T 198 4"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </motion.svg>
              </span>{" "}
              plus.
            </motion.h1>

            {/* Description */}
            <motion.p
              className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg mb-8"
              variants={itemVariants}
            >
              Rejoignez la révolution du covoiturage à Madagascar. Connectez-vous avec des voyageurs,
              <span className="font-semibold text-slate-900"> économisez jusqu'à 60%</span> sur vos trajets,
              et contribuez à un avenir plus écologique.
            </motion.p>

            {/* Social Proof - Trust metrics */}
            <motion.div
              className="flex flex-col sm:flex-row gap-6 mb-10"
              variants={itemVariants}
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <img
                      key={i}
                      src={`https://i.pravatar.cc/40?img=${i + 20}`}
                      alt={`User ${i}`}
                      className="h-8 w-8 rounded-full border-2 border-white object-cover"
                      loading="lazy"
                    />
                  ))}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">+12,000 voyageurs</p>
                  <p className="text-xs text-slate-500">⭐ 4.9/5</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Croissance rapide
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              variants={itemVariants}
            >
              {/* Primary CTA - Download */}
              <motion.button
                className="group relative inline-flex items-center justify-center gap-2.5 px-8 py-3.5 sm:py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Download className="h-5 w-5 relative z-10" />
                <span className="relative z-10">Télécharger l'app</span>
                <ArrowRight className="h-4 w-4 relative z-10 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              {/* Secondary CTA - Sign Up */}
              <motion.button
                className="group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 sm:py-4 bg-white border-2 border-slate-200 text-slate-900 font-semibold rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-300 shadow-sm hover:shadow-md"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Users className="h-5 w-5 text-emerald-600" />
                <span>S'inscrire gratuitement</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>
          </motion.div>

          {/* RIGHT COLUMN - Visual */}
          <motion.div
            className="relative h-full min-h-96 lg:min-h-[600px]"
            variants={itemVariants}
          >
            {/* Main Hero Image */}
            <div className="relative w-full h-full rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={heroImg}
                alt="Trajets à Madagascar avec Waiz"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

              {/* Floating Cards - Trip Info */}
              <motion.div
                className="absolute bottom-4 left-4 right-4 sm:left-6 sm:bottom-6 bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-2xl border border-white/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                whileHover={{ y: -5 }}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-500 mb-1">Prochain départ</p>
                      <p className="font-bold text-slate-900 text-sm">Antananarivo → Toamasina</p>
                    </div>
                    <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      35k Ar
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs text-slate-600">Dans 2h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs text-slate-600">3 places</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs text-slate-600">Vérifié</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Eco Badge */}
              <motion.div
                className="absolute -left-3 sm:-left-4 top-8 sm:top-12 hidden md:block bg-white rounded-2xl p-4 shadow-xl border border-slate-100"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                whileHover={{ scale: 1.05, x: 10 }}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl p-2.5">
                    <span className="text-xl">🌱</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">-72% CO₂</p>
                    <p className="text-xs text-slate-500">par trajet</p>
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
