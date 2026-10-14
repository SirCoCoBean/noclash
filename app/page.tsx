import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";

export default function HomePage() {
  return (
    <main className="sakura-page">
      {/* Decorative petals */}

      <span className="sakura-petal sakura-petal-one" />
      <span className="sakura-petal sakura-petal-two" />
      <span className="sakura-petal sakura-petal-three" />
      <span className="sakura-petal sakura-petal-four" />

      <div className="sakura-content">
        <Navbar />

        <Hero />
      </div>
    </main>
  );
}