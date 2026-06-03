import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.badge}>RoadWatch PWA</div>
      <h1 className={styles.title}>Civic road accountability you can install.</h1>
      <p className={styles.subtitle}>
        Camera, GPS, offline queues, and fast installability. Designed for public trust
        and real-world road reporting across India and BIMSTEC regions.
      </p>
      <div className={styles.ctaRow}>
        <a className={styles.primary} href="#live">
          Try live features
        </a>
        <a className={styles.secondary} href="#install">
          Install guide
        </a>
      </div>
      <div className={styles.heroPanel}>
        <div className={styles.panelTitle}>System readiness</div>
        <div className={styles.panelGrid}>
          {[
            { label: "Camera", value: "Ready" },
            { label: "GPS", value: "Ready" },
            { label: "Offline", value: "Enabled" },
            { label: "Install", value: "Available" },
          ].map(item => (
            <div key={item.label} className={styles.panelItem}>
              <div className={styles.panelLabel}>{item.label}</div>
              <div className={styles.panelValue}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
