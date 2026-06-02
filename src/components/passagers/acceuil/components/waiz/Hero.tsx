import { Apple, ArrowRight, Play, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import heroImg from "@/assets/hero-picture.png";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-hero pt-32 pb-20 lg:pt-40 lg:pb-28"
    >
      <div className="absolute inset-0 bg-grain opacity-40 pointer-events-none" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 lg:grid-cols-2 lg:gap-16 lg:px-8">
        {/* LEFT COLUMN — title, description, 2 CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col"
        >
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-xs font-medium text-foreground backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Covoiturage nouvelle génération à Madagascar
          </span>

          <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl text-balance">
            Voyagez malin,{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
                économisez
              </span>
              <svg
                viewBox="0 0 200 12"
                className="absolute -bottom-2 left-0 w-full text-primary/40"
                fill="none"
              >
                <path
                  d="M2 8 Q 50 2, 100 6 T 198 4"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            plus.
          </h1>

          <p className="mt-6 max-w-xl text-lg text-muted-foreground text-balance">
            Rejoignez la communauté <strong className="text-foreground">Waiz</strong>{" "}
            et transformez chaque trajet en aventure — sécurisé, abordable et
            éco-responsable.
          </p>

          {/* 2 ACTION BUTTONS */}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-4 text-base font-semibold text-primary-foreground shadow-elegant transition-all hover:bg-primary/90 hover:translate-y-[-1px]">
              <Apple className="h-5 w-5" />
              Télécharger l'app
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button className="group inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-7 py-4 text-base font-semibold text-foreground shadow-soft transition-all hover:bg-muted hover:translate-y-[-1px]">
              <UserPlus className="h-5 w-5 text-primary" />
              S'inscrire gratuitement
            </button>
          </div>

          {/* Trust row */}
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <img
                  key={i}
                  src={`https://i.pravatar.cc/64?img=${i + 10}`}
                  alt=""
                  className="h-9 w-9 rounded-full border-2 border-background object-cover"
                  loading="lazy"
                />
              ))}
            </div>
            <div className="text-sm">
              <p className="font-semibold text-foreground">+12 000 voyageurs</p>
              <p className="text-muted-foreground">
                ★ 4.9/5 · communauté active
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Trajets vérifiés
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN — visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          className="relative"
        >
          <div className="relative overflow-hidden rounded-[2rem] shadow-elegant ring-1 ring-border">
            <img
              src={heroImg}
              alt="Route panoramique à Madagascar"
              width={1280}
              height={1280}
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Floating play */}
            <button className="absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-full bg-background/90 text-foreground shadow-soft backdrop-blur transition-transform hover:scale-105">
              <Play className="h-5 w-5 fill-current" />
            </button>

            {/* Floating trip card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-5 left-5 right-5 rounded-2xl border border-border bg-background/95 p-4 shadow-card backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Prochain départ
                  </p>
                  <p className="mt-0.5 font-semibold text-foreground">
                    Antananarivo → Toamasina
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                  35 000 Ar
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                3 places restantes · départ dans 2h
              </div>
            </motion.div>
          </div>

          {/* Floating eco badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="absolute -left-4 top-12 hidden rounded-2xl border border-border bg-background p-3 shadow-card md:block"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-xl">
                🌿
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">-72%</p>
                <p className="text-xs text-muted-foreground">CO₂ par trajet</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
