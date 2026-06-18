"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Describes how the app can be installed on the current device.
 * - "prompt"     → Chrome/Edge `beforeinstallprompt` is available.
 * - "ios"        → Safari on iPhone/iPad – show manual instructions.
 * - "installed"  → App is already running in standalone mode.
 * - "unsupported"→ Browser/device does not support install.
 */
export type InstallMode = "prompt" | "ios" | "installed" | "unsupported";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface UsePWAInstallReturn {
  /** Current install mode */
  mode: InstallMode;
  /** Whether the install prompt/instructions can be shown */
  canInstall: boolean;
  /** Trigger native install prompt (Android/Desktop Chrome) */
  install: () => Promise<boolean>;
  /** Whether the user has dismissed the banner in this session */
  dismissed: boolean;
  /** Dismiss the banner for this session */
  dismiss: () => void;
  /** Whether an app update is available (new SW waiting) */
  updateAvailable: boolean;
  /** Apply the waiting service worker update */
  applyUpdate: () => void;
}

const DISMISS_KEY = "reckoning-pwa-install-dismissed";

function getIsIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function getIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<InstallMode>("unsupported");
  const [dismissed, setDismissed] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // Check if already installed
    if (getIsStandalone()) {
      setMode("installed");
      return;
    }

    // Check iOS
    if (getIsIOS()) {
      setMode("ios");
    }

    // Check session dismissal
    if (sessionStorage.getItem(DISMISS_KEY) === "true") {
      setDismissed(true);
    }

    // Listen for beforeinstallprompt (Chrome/Edge/Samsung)
    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setMode("prompt");
    };

    // Listen for appinstalled
    const handleInstalled = () => {
      setMode("installed");
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);

    // Detect SW updates
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
              setWaitingWorker(newWorker);
            }
          });
        });

        // Also check if there's already a waiting worker
        if (registration.waiting && navigator.serviceWorker.controller) {
          setUpdateAvailable(true);
          setWaitingWorker(registration.waiting);
        }
      });

      // Listen for controller change (update applied)
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setMode("installed");
      return true;
    }

    return false;
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    sessionStorage.setItem(DISMISS_KEY, "true");
  }, []);

  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
  }, [waitingWorker]);

  const canInstall = mode === "prompt" || mode === "ios";

  return {
    mode,
    canInstall,
    install,
    dismissed,
    dismiss,
    updateAvailable,
    applyUpdate,
  };
}
