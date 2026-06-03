"use client";

import { useEffect, useState } from "react";
import styles from "./InstallPrompt.module.css";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => setInstalled(true);

    window.addEventListener("beforeinstallprompt", handler as EventListener);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler as EventListener);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  };

  return (
    <section id="install" className={styles.wrap}>
      <div className={styles.card}>
        <div>
          <div className={styles.title}>Install RoadWatch</div>
          <p className={styles.text}>
            Add this PWA to your home screen to access camera, GPS, and offline mode instantly.
          </p>
          <ol className={styles.list}>
            <li>Open browser menu</li>
            <li>Select "Install app"</li>
            <li>Launch from home screen</li>
          </ol>
        </div>
        <button
          className={styles.button}
          type="button"
          onClick={handleInstall}
          disabled={!promptEvent || installed}
        >
          {installed ? "Installed" : "Install now"}
        </button>
      </div>
    </section>
  );
}
