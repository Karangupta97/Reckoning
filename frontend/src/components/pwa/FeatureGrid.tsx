import styles from "./FeatureGrid.module.css";

const FEATURES = [
  {
    title: "Camera-first reporting",
    text: "Capture defects with an optimized camera flow and scan overlay.",
  },
  {
    title: "Accurate GPS context",
    text: "Pinpoint issues with district-level precision and auto-fill metadata.",
  },
  {
    title: "Offline queues",
    text: "Keep reporting when the network drops. Sync resumes automatically.",
  },
  {
    title: "Installable PWA",
    text: "Add RoadWatch to the home screen with a single tap.",
  },
  {
    title: "Transparent workflows",
    text: "Step-by-step status updates built for accountability.",
  },
  {
    title: "Browser testable",
    text: "Runs entirely in the browser for quick demos and QA checks.",
  },
];

export default function FeatureGrid() {
  return (
    <section className={styles.grid}>
      {FEATURES.map(feature => (
        <article key={feature.title} className={styles.card}>
          <h3>{feature.title}</h3>
          <p>{feature.text}</p>
        </article>
      ))}
    </section>
  );
}
