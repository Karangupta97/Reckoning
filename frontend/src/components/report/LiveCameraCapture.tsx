"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Video,
  X,
  Zap,
  ZapOff,
  Check,
  Trash2,
  SwitchCamera,
} from "lucide-react";

type CaptureMode = "photo" | "video";
type FlashMode = "off" | "on";

interface LiveCameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (files: File[]) => void;
  maxFiles?: number;
  currentFileCount?: number;
}

/* ── Viewport / body lock helpers ───────────────────────────── */

let _savedViewport = "";

function lockViewport() {
  // Prevent pinch-zoom and double-tap-zoom while camera is active
  const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (meta) {
    _savedViewport = meta.content;
    meta.content =
      "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";
  }
  // Lock body scroll and touch gestures
  document.body.style.overflow = "hidden";
  document.body.style.touchAction = "none";
  document.body.style.overscrollBehavior = "none";
}

function unlockViewport() {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (meta && _savedViewport) {
    meta.content = _savedViewport;
    _savedViewport = "";
  }
  document.body.style.overflow = "";
  document.body.style.touchAction = "";
  document.body.style.overscrollBehavior = "";
}

export function LiveCameraCapture({
  open,
  onClose,
  onCapture,
  maxFiles = 5,
  currentFileCount = 0,
}: LiveCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [mode, setMode] = useState<CaptureMode>("photo");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [capturedFiles, setCapturedFiles] = useState<{ file: File; previewUrl: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const remainingSlots = maxFiles - currentFileCount - capturedFiles.length;

  /* ── Viewport lock effect ─────────────────────────────────── */
  useEffect(() => {
    if (open) {
      lockViewport();
    } else {
      unlockViewport();
    }
    return () => { unlockViewport(); };
  }, [open]);

  /* ── Multiple cameras check ───────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      setHasMultipleCameras(devices.filter((d) => d.kind === "videoinput").length > 1);
    }).catch(() => setHasMultipleCameras(false));
  }, [open]);

  /* ── Start camera stream ──────────────────────────────────── */
  const startCamera = useCallback(async () => {
    setError(null);
    setCameraReady(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    try {
      // Try with ideal constraints first (rear camera, high resolution)
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: mode === "video",
        });
      } catch {
        // Fallback: simpler constraints for older/budget phones
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode },
            audio: mode === "video",
          });
        } catch {
          // Last resort: any camera
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: mode === "video",
          });
        }
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure playsinline for iOS Safari
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("webkit-playsinline", "true");
        await videoRef.current.play();
      }
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && flash === "on") {
        try { await (videoTrack as any).applyConstraints({ advanced: [{ torch: true } as any] }); }
        catch { /* torch not supported */ }
      }
      setCameraReady(true);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Camera access denied. Please allow camera permissions in your browser settings.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setError("No camera found on this device.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setError("Camera is in use by another app. Please close other camera apps and try again.");
      } else if (err.name === "OverconstrainedError") {
        setError("Camera does not support the requested settings. Please try again.");
      } else {
        setError("Unable to access camera. Make sure you're using HTTPS and have granted camera permissions.");
      }
    }
  }, [facingMode, flash, mode]);

  useEffect(() => {
    if (open) { startCamera(); }
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    };
  }, [open, startCamera]);

  /* ── Flash toggle ─────────────────────────────────────────── */
  const toggleFlash = useCallback(async () => {
    const next = flash === "off" ? "on" : "off";
    setFlash(next);
    const vt = streamRef.current?.getVideoTracks()[0];
    if (vt) {
      try { await (vt as any).applyConstraints({ advanced: [{ torch: next === "on" } as any] }); }
      catch { /* ignore */ }
    }
  }, [flash]);

  /* ── Capture photo ────────────────────────────────────────── */
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || remainingSlots <= 0) return;
    const vid = videoRef.current;
    const cvs = canvasRef.current;
    cvs.width = vid.videoWidth;
    cvs.height = vid.videoHeight;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    if (facingMode === "user") { ctx.translate(cvs.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(vid, 0, 0);
    cvs.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
      setCapturedFiles((p) => [...p, { file, previewUrl: URL.createObjectURL(blob) }]);
    }, "image/jpeg", 0.92);
  }, [facingMode, remainingSlots]);

  /* ── Video recording ──────────────────────────────────────── */
  const startRecording = useCallback(() => {
    if (!streamRef.current || remainingSlots <= 0) return;
    chunksRef.current = [];
    // Determine best available recording format — iOS Safari only supports mp4
    let mimeType = "";
    const candidates = [
      "video/mp4",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];
    for (const candidate of candidates) {
      if (MediaRecorder.isTypeSupported(candidate)) {
        mimeType = candidate;
        break;
      }
    }
    if (!mimeType) {
      // Last resort: let the browser pick
      mimeType = "";
    }
    try {
      const recOptions: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const rec = new MediaRecorder(streamRef.current, recOptions);
      mediaRecorderRef.current = rec;
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const actualType = rec.mimeType || mimeType || "video/mp4";
        const blob = new Blob(chunksRef.current, { type: actualType });
        const ext = actualType.includes("mp4") ? "mp4" : "webm";
        const file = new File([blob], `video_${Date.now()}.${ext}`, { type: actualType });
        setCapturedFiles((p) => [...p, { file, previewUrl: URL.createObjectURL(blob) }]);
        chunksRef.current = [];
      };
      rec.start(1000);
      setIsRecording(true);
      setRecordingDuration(0);
      recordingIntervalRef.current = setInterval(() => setRecordingDuration((p) => p + 1), 1000);
    } catch { setError("Video recording is not supported on this device."); }
  }, [remainingSlots]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) { clearInterval(recordingIntervalRef.current); recordingIntervalRef.current = null; }
      setRecordingDuration(0);
    }
  }, [isRecording]);

  /* ── Confirm / close ──────────────────────────────────────── */
  const removeCapture = useCallback((i: number) => {
    setCapturedFiles((p) => { URL.revokeObjectURL(p[i].previewUrl); return p.filter((_, idx) => idx !== i); });
  }, []);

  const confirmCaptures = useCallback(() => {
    if (capturedFiles.length === 0) return;
    onCapture(capturedFiles.map((c) => c.file));
    capturedFiles.forEach((c) => URL.revokeObjectURL(c.previewUrl));
    setCapturedFiles([]);
    onClose();
  }, [capturedFiles, onCapture, onClose]);

  const handleClose = useCallback(() => {
    if (isRecording) stopRecording();
    capturedFiles.forEach((c) => URL.revokeObjectURL(c.previewUrl));
    setCapturedFiles([]);
    onClose();
  }, [isRecording, stopRecording, capturedFiles, onClose]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        /* Truly fullscreen — covers browser chrome, notch, and all page content */
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100dvh",
          zIndex: 99999,
          background: "#000",
          display: "flex",
          flexDirection: "column",
          touchAction: "none",
          overscrollBehavior: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-4 safe-area-top"
          style={{ paddingTop: "max(12px, env(safe-area-inset-top))", paddingBottom: 12 }}>
          <button type="button" onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
            aria-label="Close camera">
            <X size={20} />
          </button>

          {isRecording && (
            <div className="flex items-center gap-2 rounded-full bg-red-600/90 px-3 py-1.5 backdrop-blur">
              <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
              <span className="text-xs font-semibold text-white">{formatTime(recordingDuration)}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleFlash}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
              aria-label={flash === "on" ? "Turn off flash" : "Turn on flash"}>
              {flash === "on" ? <Zap size={18} /> : <ZapOff size={18} />}
            </button>
            {hasMultipleCameras && (
              <button type="button" onClick={() => setFacingMode((p) => p === "user" ? "environment" : "user")}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
                aria-label="Switch camera">
                <SwitchCamera size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Viewfinder — fills all remaining space */}
        <div className="relative flex-1 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            webkit-playsinline="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: facingMode === "user" ? "scaleX(-1)" : "none",
            }}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 px-6">
              <Camera size={48} className="mb-4 text-white/50" />
              <p className="text-center text-sm text-white/80">{error}</p>
              <button type="button" onClick={startCamera}
                className="mt-4 rounded-full bg-white/20 px-5 py-2 text-sm font-medium text-white">
                Retry
              </button>
            </div>
          )}

          {/* Loading */}
          {!cameraReady && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </div>
          )}

          {/* Captured strip */}
          {capturedFiles.length > 0 && (
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex gap-2 overflow-x-auto rounded-2xl bg-black/60 p-2 backdrop-blur">
                {capturedFiles.map((c, i) => (
                  <div key={i} className="relative shrink-0">
                    {c.file.type.startsWith("video/") ? (
                      <video src={c.previewUrl} className="h-14 w-14 rounded-xl object-cover" />
                    ) : (
                      <img src={c.previewUrl} alt={`Capture ${i + 1}`} className="h-14 w-14 rounded-xl object-cover" />
                    )}
                    <button type="button" onClick={() => removeCapture(i)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                      aria-label={`Remove capture ${i + 1}`}>
                      <X size={10} />
                    </button>
                    {c.file.type.startsWith("video/") && (
                      <div className="absolute bottom-0.5 left-0.5 rounded bg-black/70 px-1 py-0.5">
                        <Video size={8} className="text-white" />
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex shrink-0 items-center px-2">
                  <span className="text-[10px] font-medium text-white/70">
                    {capturedFiles.length}/{remainingSlots + capturedFiles.length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="relative z-10 space-y-3 bg-black px-4 pt-4"
          style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
          {/* Mode selector */}
          <div className="flex items-center justify-center gap-6">
            {(["photo", "video"] as CaptureMode[]).map((m) => (
              <button key={m} type="button"
                onClick={() => { if (!isRecording) setMode(m); }}
                className={`text-xs font-semibold uppercase tracking-wider transition ${mode === m ? "text-white" : "text-white/50"}`}>
                {m}
              </button>
            ))}
          </div>

          {/* Capture row */}
          <div className="flex items-center justify-between">
            {/* Discard */}
            <div className="flex w-16 justify-center">
              {capturedFiles.length > 0 && (
                <button type="button" onClick={handleClose}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white"
                  aria-label="Discard captures">
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            {/* Main shutter */}
            <div className="flex justify-center">
              {mode === "photo" ? (
                <button type="button" onClick={capturePhoto}
                  disabled={!cameraReady || remainingSlots <= 0}
                  className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-[4px] border-white disabled:opacity-40"
                  aria-label="Take photo">
                  <div className="h-[58px] w-[58px] rounded-full bg-white transition-transform active:scale-90" />
                </button>
              ) : (
                <button type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={!cameraReady || (!isRecording && remainingSlots <= 0)}
                  className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-[4px] border-white disabled:opacity-40"
                  aria-label={isRecording ? "Stop recording" : "Start recording"}>
                  {isRecording
                    ? <div className="h-7 w-7 rounded-md bg-red-500 transition-transform active:scale-90" />
                    : <div className="h-[58px] w-[58px] rounded-full bg-red-500 transition-transform active:scale-90" />}
                </button>
              )}
            </div>

            {/* Confirm */}
            <div className="flex w-16 justify-center">
              {capturedFiles.length > 0 && (
                <button type="button" onClick={confirmCaptures}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-amber,#f59e0b)] text-white"
                  aria-label="Use captures">
                  <Check size={20} />
                </button>
              )}
            </div>
          </div>

          {remainingSlots <= 0 && (
            <p className="text-center text-xs text-red-400">
              Maximum file limit reached. Remove a capture to take more.
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
