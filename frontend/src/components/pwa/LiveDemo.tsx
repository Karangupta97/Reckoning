"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./LiveDemo.module.css";

export default function LiveDemo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [coords, setCoords] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (error) {
      setCameraError("Camera access was blocked or unavailable.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const getLocation = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setCoords(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      },
      () => setGpsError("Unable to fetch your location."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <section id="live" className={styles.wrap}>
      <div className={styles.header}>
        <h2>Live browser tests</h2>
        <p>Verify camera, GPS, and offline-ready behavior from any browser.</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Camera preview</div>
          <div className={styles.cameraFrame}>
            <video ref={videoRef} autoPlay playsInline muted />
            {!cameraActive && <span className={styles.placeholder}>Camera idle</span>}
          </div>
          {cameraError && <div className={styles.error}>{cameraError}</div>}
          <div className={styles.buttonRow}>
            <button className={styles.primary} type="button" onClick={startCamera}>Start</button>
            <button className={styles.secondary} type="button" onClick={stopCamera}>Stop</button>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>GPS check</div>
          <div className={styles.statBox}>
            {coords ? `Coordinates: ${coords}` : "No location detected"}
          </div>
          {gpsError && <div className={styles.error}>{gpsError}</div>}
          <button className={styles.primary} type="button" onClick={getLocation}>Get GPS</button>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Offline test</div>
          <p className={styles.text}>
            Toggle your connection to simulate offline queues. A banner will appear when offline.
          </p>
          <div className={styles.offlineSteps}>
            <div>1. Open DevTools</div>
            <div>2. Network tab</div>
            <div>3. Set to Offline</div>
          </div>
        </div>
      </div>
    </section>
  );
}
