import { Navbar } from "./components/waiz/Navbar";
import { Hero } from "./components/waiz/Hero";
import { SearchBar } from "./components/waiz/SearchBar";
import { HowItWorks } from "./components/waiz/HowItWorks";
import { Offres } from "./components/waiz/Offres";
import { Testimonials } from "./components/waiz/Testimonials";
import { CTA } from "./components/waiz/CTA";
import { Footer } from "./components/waiz/Footer";

export default function Acceuil() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <SearchBar />
      <HowItWorks />
      <Offres />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  );
}
