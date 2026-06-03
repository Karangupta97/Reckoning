import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div>
        <div className={styles.title}>RoadWatch PWA</div>
        <div className={styles.text}>Built for civic accountability and field-ready reporting.</div>
      </div>
      <div className={styles.meta}>
        <span>Camera</span>
        <span>GPS</span>
        <span>Offline</span>
        <span>Installable</span>
      </div>
    </footer>
  );
}
