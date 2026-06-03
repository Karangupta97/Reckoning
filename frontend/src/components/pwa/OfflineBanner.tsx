"use client";

import { useEffect, useState } from "react";
import styles from "./OfflineBanner.module.css";

export default function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();

    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online) return null;

  return (
    <div className={styles.banner}>
      You are offline. Reports will sync when connected.
    </div>
  );
}
