import { Apple, Smartphone, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function CTA() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
      <motion.div
        className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 to-emerald-800 px-6 sm:px-8 lg:px-16 py-16 lg:py-20 text-white shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/40 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-600/30 rounded-full blur-3xl -z-10" />

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance mb-4">
              Prêt à prendre la route?
            </h2>
            <p className="text-lg text-emerald-100 leading-relaxed max-w-lg">
              Téléchargez Waiz et rejoignez des milliers de voyageurs malins partout à Madagascar. Économisez sur vos trajets et voyagez en confiance.
            </p>
          </motion.div>

          {/* Download Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 lg:justify-end"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <motion.button
              className="inline-flex items-center justify-center gap-3 rounded-xl bg-white text-slate-900 px-6 py-4 font-semibold shadow-lg hover:shadow-xl transition-all"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Apple className="h-6 w-6" />
              <span>
                <span className="block text-xs font-medium text-slate-600">
                  Télécharger sur
                </span>
                <span className="block text-base">App Store</span>
              </span>
            </motion.button>

            <motion.button
              className="inline-flex items-center justify-center gap-3 rounded-xl bg-white text-slate-900 px-6 py-4 font-semibold shadow-lg hover:shadow-xl transition-all"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Smartphone className="h-6 w-6" />
              <span>
                <span className="block text-xs font-medium text-slate-600">
                  Disponible sur
                </span>
                <span className="block text-base">Google Play</span>
              </span>
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Secondary CTA */}
      <motion.div
        className="mt-12 text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        viewport={{ once: true }}
      >
        <p className="text-slate-600 mb-4">Ou commencez directement en ligne</p>
        <motion.button
          className="inline-flex items-center gap-2 px-8 py-3 bg-slate-100 text-slate-900 font-semibold rounded-xl hover:bg-slate-200 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Accéder à la plateforme web
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      </motion.div>
    </section>
  );
}
