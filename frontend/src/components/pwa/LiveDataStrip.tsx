import styles from "./LiveDataStrip.module.css";

const DATA = [
  { label: "Active issues", value: "12,847" },
  { label: "Districts covered", value: "412" },
  { label: "Reports queued", value: "128" },
  { label: "Avg response", value: "36h" },
];

export default function LiveDataStrip() {
  return (
    <section className={styles.strip}>
      {DATA.map(item => (
        <div key={item.label} className={styles.item}>
          <div className={styles.label}>{item.label}</div>
          <div className={styles.value}>{item.value}</div>
        </div>
      ))}
    </section>
  );
}
