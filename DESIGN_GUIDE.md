# 🎯 Guide d'Utilisation - Nouveaux Composants & Styles

## Configuration Rapide

Votre landing page Waiz utilise maintenant un système de design premium avec Tailwind CSS v4 et Framer Motion.

---

## 📦 Dépendances Clés

```json
{
  "framer-motion": "^12.40.0",  // Animations fluides
  "lucide-react": "^1.17.0",    // Icônes professionnelles
  "@tailwindcss/vite": "^4.3.0", // Tailwind CSS v4
  "tailwindcss": "^4.3.0"
}
```

---

## 🎨 Système de Couleurs

### Variables CSS Premium

Modifiez `/src/styles/variables.css` pour personnaliser :

```css
:root {
  /* Palette Primaire */
  --primary-color: #10b981;     /* Émeraude 500 */
  --primary-hover: #059669;     /* Émeraude 600 */
  --primary-active: #047857;    /* Émeraude 700 */
  --primary-light: #d1fae5;     /* Émeraude 100 */
  
  /* Palette Secondaire */
  --secondary-color: #14b8a6;   /* Teal 500 */
  --secondary-hover: #0d9488;   /* Teal 600 */
  
  /* Accent */
  --accent-color: #3b82f6;      /* Bleu 500 */
}
```

---

## 🎬 Animations avec Framer Motion

### Container Variants (Orchestration)
```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,      // Délai entre enfants
      delayChildren: 0.2,        // Délai avant début
    },
  },
};
```

### Item Variants (Éléments)
```tsx
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};
```

### Utilisation
```tsx
<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  <motion.h1 variants={itemVariants}>Titre</motion.h1>
  <motion.p variants={itemVariants}>Description</motion.p>
</motion.div>
```

---

## 🔘 Boutons Premium

### Style Primary (Dégradé Émeraude-Teal)
```tsx
<motion.button
  className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-lg hover:shadow-xl"
  whileHover={{ scale: 1.05, y: -2 }}
  whileTap={{ scale: 0.95 }}
>
  <Download className="h-5 w-5" />
  Télécharger l'app
  <ArrowRight className="h-4 w-4" />
</motion.button>
```

### Style Secondary (Border + Hover)
```tsx
<motion.button
  className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-xl hover:border-emerald-500 hover:bg-emerald-50"
  whileHover={{ scale: 1.05, y: -2 }}
>
  <Users className="h-5 w-5 text-emerald-600" />
  S'inscrire gratuitement
</motion.button>
```

---

## 🎭 Micro-interactions

### Hover & Tap Effects
```tsx
whileHover={{ scale: 1.05, y: -2 }}      // Scale 5% + lift 2px
whileTap={{ scale: 0.95 }}               // Compress au click
transition={{ type: "spring", stiffness: 400, damping: 10 }}
```

### Stagger Effect (Cascade d'animations)
```tsx
<motion.div variants={containerVariants}>
  <motion.div variants={itemVariants}>Item 1</motion.div>
  <motion.div variants={itemVariants}>Item 2</motion.div>
  <motion.div variants={itemVariants}>Item 3</motion.div>
</motion.div>
```
→ Chaque item s'affiche avec un délai de 100ms

---

## 📐 Responsive Breakpoints

Utilisez les classes Tailwind responsives :

```tsx
// Format: <breakpoint>:<classe>
className="
  w-full lg:w-1/2                    // Full width mobile, 50% desktop
  text-3xl md:text-5xl lg:text-7xl   // Typographie fluide
  gap-4 lg:gap-12                    // Espacements adaptatifs
  grid-cols-1 lg:grid-cols-2         // Layout adaptatif
"
```

### Breakpoints Tailwind (par défaut)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

---

## 🖇️ Classes Utility Principales

### Flexbox
```tsx
className="flex items-center justify-between gap-4"
// = display: flex + align-items + justify-content + gap
```

### Grid
```tsx
className="grid grid-cols-3 gap-4"
// = display: grid + 3 colonnes + 1rem gap
```

### Spacing
```tsx
className="px-8 py-4 my-6"
// = padding horizontal/vertical + margin vertical
```

### Typography
```tsx
className="text-lg font-semibold leading-relaxed text-slate-900"
// = font size + weight + line height + color
```

---

## 🌑 Dark Mode

Les variables supportent automatiquement le dark mode :

```css
body.dark-mode {
  --text-primary: #f8fafc;
  --bg-primary: #0f172a;
  --shadow-lg: /* ombres adaptées */
}
```

Utilisez dans le composant :
```tsx
// Les variables s'adaptent automatiquement
backgroundColor: 'var(--bg-primary)'
color: 'var(--text-primary)'
```

---

## 🎭 Icônes Lucide-React

```tsx
import { Download, ArrowRight, Users, MapPin, Clock } from "lucide-react";

// Utilisation
<Download className="h-5 w-5 text-emerald-600" />
```

### Icônes disponibles
- **Navigation**: ChevronRight, MapPin, Navigation
- **Actions**: Download, Upload, Share, Copy, Edit
- **Status**: CheckCircle, AlertCircle, Clock, Trending
- **Social**: Users, User, MessageSquare, Heart

---

## 🔄 Réutilisation - Créer une variante Hero

```tsx
export function HeroAlternative() {
  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Votre contenu avec les mêmes animations */}
      </motion.div>
    </section>
  );
}
```

---

## 📝 Bonnes Pratiques

### ✅ À Faire
- Utiliser `clamp()` pour typographie responsive
- Appliquer transitions sur hover/focus
- Combiner animations staggered pour fluidité
- Tester sur mobile/tablet/desktop

### ❌ À Éviter
- Animations trop rapides (< 200ms peut paraître jittery)
- Ombres trop fortes (perte de légèreté)
- Couleurs non contrastées (accessibilité)
- Gradients complexes (surcharge visuelle)

---

## 🧪 Tester les Animations

### Dans le navigateur
1. Ouvrez DevTools (F12)
2. Allez à **Performance** tab
3. Enregistrez une session
4. Vérifiez que les FPS restent ≥ 60

### Avec Framer Motion DevTools
```tsx
// Ajouter en développement
import { MotionConfig } from "framer-motion";

<MotionConfig reducedMotion="user">
  {/* Respect les préférences utilisateur */}
</MotionConfig>
```

---

## 📚 Ressources

- **Framer Motion Docs**: https://www.framer.com/motion/
- **Lucide Icons**: https://lucide.dev
- **Tailwind CSS**: https://tailwindcss.com
- **Tailwind v4**: Guide des nouvelles features

---

## 🚀 Prochaines Étapes

1. **Intégrer les autres sections** avec le même style
2. **Créer des variantes** pour les pages intérieures
3. **Tester les animations** sur vrais utilisateurs
4. **Optimiser les performances** avec code splitting
5. **Ajouter des interactions** au scroll (Scroll triggers)

---

**Happy coding! 🎉**
