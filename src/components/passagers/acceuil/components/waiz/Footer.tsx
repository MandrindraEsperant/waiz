import { Mail, Heart, Share2, Phone } from "lucide-react";
import { motion } from "framer-motion";

const cols = [
  {
    title: "Découvrir",
    links: ["Comment ça marche", "Trajets disponibles", "Communauté", "Devenir conducteur"],
  },
  {
    title: "Légal",
    links: ["Conditions générales", "Confidentialité", "Mentions légales", "Cookies"],
  },
  {
    title: "Support",
    links: ["Centre d'aide", "Nous contacter", "Sécurité", "Statut du service"],
  },
];

export function Footer() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <footer id="footer" className="border-t border-slate-200/60 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        {/* Main Content Grid */}
        <motion.div
          className="grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_2fr]"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Brand Section */}
          <motion.div variants={itemVariants}>
            {/* Logo */}
            <a href="/" className="inline-flex items-center gap-3 mb-6 group">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:shadow-lg transition-shadow">
                W
              </div>
              <span className="text-2xl font-bold tracking-tight text-slate-900">Waiz</span>
            </a>

            {/* Description */}
            <p className="text-slate-600 leading-relaxed mb-6 max-w-sm">
              Le covoiturage malin, sécurisé et éco-responsable à Madagascar. Économisez, voyagez en confiance, réduisez votre empreinte carbone.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {[
                { icon: Mail, label: "Email", href: "#" },
                { icon: Heart, label: "Favorites", href: "#" },
                { icon: Share2, label: "Share", href: "#" },
              ].map(({ icon: Icon, label, href }) => (
                <motion.a
                  key={label}
                  href={href}
                  className="h-10 w-10 rounded-lg border border-slate-200 text-slate-600 hover:border-emerald-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={label}
                >
                  <Icon className="h-4.5 w-4.5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Links Grid */}
          <motion.div
            className="grid grid-cols-2 gap-8 sm:grid-cols-3"
            variants={containerVariants}
          >
            {cols.map((c) => (
              <motion.div key={c.title} variants={itemVariants}>
                <h4 className="text-sm font-semibold text-slate-900 mb-4">
                  {c.title}
                </h4>

                <ul className="space-y-3">
                  {c.links.map((l) => (
                    <li key={l}>
                      <a
                        href="#"
                        className="text-sm text-slate-600 hover:text-emerald-700 transition-colors"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          className="mt-14 pt-6 border-t border-slate-200/60"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Copyright */}
            <p className="text-xs text-slate-500">
              © Waiz {new Date().getFullYear()} — Tous droits réservés
            </p>

            {/* Contact Info */}
            <div className="flex flex-col sm:flex-row gap-4 text-xs text-slate-600">
              <a
                href="tel:+261123456789"
                className="inline-flex items-center gap-1.5 hover:text-emerald-700 transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                +261 (0) 123 456 789
              </a>
              <a
                href="mailto:contact@waiz.mg"
                className="inline-flex items-center gap-1.5 hover:text-emerald-700 transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                contact@waiz.mg
              </a>
            </div>

            {/* Eco Message */}
            <p className="text-xs text-slate-500 italic">
              Covoiturer, c'est réduire son empreinte carbone
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
