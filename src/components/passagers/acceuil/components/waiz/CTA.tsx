import { Apple, Smartphone } from "lucide-react";

export function CTA() {
  return (
    <section className="px-5 pb-24 lg:px-8 lg:pb-32">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-primary px-8 py-16 text-primary-foreground shadow-elegant lg:px-16 lg:py-20">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-glow/30 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl text-balance">
              Prêt à prendre la route ?
            </h2>
            <p className="mt-4 max-w-lg text-lg text-primary-foreground/80">
              Téléchargez Waiz et rejoignez des milliers de voyageurs malins
              partout à Madagascar.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <button className="inline-flex items-center justify-center gap-3 rounded-2xl bg-background px-6 py-4 text-foreground shadow-soft transition-transform hover:-translate-y-0.5">
              <Apple className="h-7 w-7" />
              <span className="text-left">
                <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Télécharger sur
                </span>
                <span className="block text-base font-semibold">App Store</span>
              </span>
            </button>
            <button className="inline-flex items-center justify-center gap-3 rounded-2xl bg-background px-6 py-4 text-foreground shadow-soft transition-transform hover:-translate-y-0.5">
              <Smartphone className="h-7 w-7" />
              <span className="text-left">
                <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Disponible sur
                </span>
                <span className="block text-base font-semibold">Google Play</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
