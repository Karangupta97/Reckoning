import Hero from "../components/pwa/Hero";
import FeatureGrid from "../components/pwa/FeatureGrid";
import LiveDemo from "../components/pwa/LiveDemo";
import InstallPrompt from "../components/pwa/InstallPrompt";
import OfflineBanner from "../components/pwa/OfflineBanner";
import LiveDataStrip from "../components/pwa/LiveDataStrip";
import Footer from "../components/pwa/Footer";
import styles from "../components/pwa/page.module.css";

export default function HomePage() {
  return (
    <div className={styles.page}>
      <OfflineBanner />
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>RW</span>
          RoadWatch
        </div>
        <div className={styles.navLinks}>
          <a href="#live">Live tests</a>
          <a href="#install">Install</a>
          <a href="#features">Features</a>
        </div>
      </nav>

      <Hero />
      <LiveDataStrip />

      <section id="features">
        <FeatureGrid />
      </section>

      <LiveDemo />
      <InstallPrompt />
      <Footer />
    </div>
  );
}
