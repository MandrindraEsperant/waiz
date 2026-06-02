import { Home, User, Globe, Mail, Phone} from "lucide-react";

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
  return (
    <footer id="footer" className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
                W
              </span>
              <span className="text-2xl font-semibold tracking-tight">Waiz</span>
            </div>

            <p className="mt-4 max-w-sm text-muted-foreground">
              Le covoiturage malin, sécurisé et éco-responsable à Madagascar.
            </p>

            <div className="mt-6 flex items-center gap-2">
              {[Home, User, Globe, Mail, Phone].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {cols.map((c) => (
              <div key={c.title}>
                <h4 className="text-sm font-semibold text-foreground">
                  {c.title}
                </h4>

                <ul className="mt-4 space-y-3">
                  {c.links.map((l) => (
                    <li key={l}>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © WAIZ {new Date().getFullYear()} — Tous droits réservés
          </p>

          <p className="text-xs text-muted-foreground">
            🌿 Covoiturer, c'est réduire son empreinte carbone
          </p>
        </div>
      </div>
    </footer>
  );
}