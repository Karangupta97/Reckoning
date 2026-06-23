"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Video,
  X,
  RotateCcw,
  Zap,
  ZapOff,
  Circle,
  Square,
  Check,
  Trash2,
  SwitchCamera,
  Timer,
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

  const [mode, setMode] = useState<CaptureMode>("photo");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [capturedFiles, setCapturedFiles] = useState<{ file: File; previewUrl: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remainingSlots = maxFiles - currentFileCount - capturedFiles.length;

  // Check for multiple cameras
  useEffect(() => {
    if (!open) return;
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      setHasMultipleCameras(videoDevices.length > 1);
    }).catch(() => {
      setHasMultipleCameras(false);
    });
  }, [open]);

  // Start/stop camera stream
  const startCamera = useCallback(async () => {
    setError(null);
    setCameraReady(false);

    // Stop existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: mode === "video",
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Apply flash/torch if supported
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && flash === "on") {
        try {
          await (videoTrack as any).applyConstraints({
            advanced: [{ torch: true } as any],
          });
        } catch {
          // Torch not supported on this device
        }
      }

      setCameraReady(true);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Camera access denied. Please allow camera permissions in your browser settings.");
      } else if (err.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError("Unable to access camera. Please try again.");
      }
    }
  }, [facingMode, flash, mode]);

  useEffect(() => {
    if (open) {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [open, startCamera]);

  // Toggle flash
  const toggleFlash = useCallback(async () => {
    const newFlash = flash === "off" ? "on" : "off";
    setFlash(newFlash);

    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        try {
          await (videoTrack as any).applyConstraints({
            advanced: [{ torch: newFlash === "on" } as any],
          });
        } catch {
          // Torch not supported
        }
      }
    }
  }, [flash]);

  // Switch camera
  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || remainingSlots <= 0) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // If front camera, mirror the image
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const timestamp = Date.now();
        const file = new File([blob], `capture_${timestamp}.jpg`, { type: "image/jpeg" });
        const previewUrl = URL.createObjectURL(blob);
        setCapturedFiles((prev) => [...prev, { file, previewUrl }]);
      },
      "image/jpeg",
      0.92,
    );
  }, [facingMode, remainingSlots]);

  // Start video recording
  const startRecording = useCallback(() => {
    if (!streamRef.current || remainingSlots <= 0) return;

    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4";

    try {
      const recorder = new MediaRecorder(streamRef.current, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const extension = mimeType.includes("mp4") ? "mp4" : "webm";
        const timestamp = Date.now();
        const file = new File([blob], `video_${timestamp}.${extension}`, { type: mimeType });
        const previewUrl = URL.createObjectURL(blob);
        setCapturedFiles((prev) => [...prev, { file, previewUrl }]);
        chunksRef.current = [];
      };

      recorder.start(1000);
      setIsRecording(true);
      setRecordingDuration(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      setError("Video recording is not supported on this device.");
    }
  }, [remainingSlots]);

  // Stop video recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      setRecordingDuration(0);
    }
  }, [isRecording]);

  // Remove a captured file
  const removeCapture = useCallback((index: number) => {
    setCapturedFiles((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Confirm and send files back
  const confirmCaptures = useCallback(() => {
    if (capturedFiles.length === 0) return;
    const files = capturedFiles.map((c) => c.file);
    onCapture(files);
    // Clean up preview URLs
    capturedFiles.forEach((c) => URL.revokeObjectURL(c.previewUrl));
    setCapturedFiles([]);
    onClose();
  }, [capturedFiles, onCapture, onClose]);

  // Handle close
  const handleClose = useCallback(() => {
    if (isRecording) {
      stopRecording();
    }
    capturedFiles.forEach((c) => URL.revokeObjectURL(c.previewUrl));
    setCapturedFiles([]);
    onClose();
  }, [isRecording, stopRecording, capturedFiles, onClose]);

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex flex-col bg-black"
      >
        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
            aria-label="Close camera"
          >
            <X size={20} />
          </button>

          {isRecording && (
            <div className="flex items-center gap-2 rounded-full bg-red-600/90 px-3 py-1.5 backdrop-blur">
              <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
              <span className="text-xs font-semibold text-white">{formatTime(recordingDuration)}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFlash}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
              aria-label={flash === "on" ? "Turn off flash" : "Turn on flash"}
            >
              {flash === "on" ? <Zap size={18} /> : <ZapOff size={18} />}
            </button>
            {hasMultipleCameras && (
              <button
                type="button"
                onClick={switchCamera}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
                aria-label="Switch camera"
              >
                <SwitchCamera size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Camera viewfinder */}
        <div className="relative flex-1 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 px-6">
              <Camera size={48} className="mb-4 text-white/50" />
              <p className="text-center text-sm text-white/80">{error}</p>
              <button
                type="button"
                onClick={startCamera}
                className="mt-4 rounded-full bg-white/20 px-5 py-2 text-sm font-medium text-white"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading state */}
          {!cameraReady && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </div>
          )}

          {/* Captured files preview strip */}
          {capturedFiles.length > 0 && (
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex gap-2 overflow-x-auto rounded-2xl bg-black/60 p-2 backdrop-blur">
                {capturedFiles.map((capture, index) => (
                  <div key={index} className="relative shrink-0">
                    {capture.file.type.startsWith("video/") ? (
                      <video
                        src={capture.previewUrl}
                        className="h-14 w-14 rounded-xl object-cover"
                      />
                    ) : (
                      <img
                        src={capture.previewUrl}
                        alt={`Capture ${index + 1}`}
                        className="h-14 w-14 rounded-xl object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeCapture(index)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                      aria-label={`Remove capture ${index + 1}`}
                    >
                      <X size={10} />
                    </button>
                    {capture.file.type.startsWith("video/") && (
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
        <div className="relative z-10 space-y-3 bg-black/90 px-4 pb-6 pt-4 backdrop-blur">
          {/* Mode selector */}
          <div className="flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => {
                if (isRecording) return;
                setMode("photo");
              }}
              className={`text-xs font-semibold uppercase tracking-wider transition ${
                mode === "photo" ? "text-white" : "text-white/50"
              }`}
            >
              Photo
            </button>
            <button
              type="button"
              onClick={() => {
                if (isRecording) return;
                setMode("video");
              }}
              className={`text-xs font-semibold uppercase tracking-wider transition ${
                mode === "video" ? "text-white" : "text-white/50"
              }`}
            >
              Video
            </button>
          </div>

          {/* Capture button and actions */}
          <div className="flex items-center justify-between">
            {/* Done / close */}
            <div className="flex w-16 justify-center">
              {capturedFiles.length > 0 && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white"
                  aria-label="Discard captures"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            {/* Main capture button */}
            <div className="flex justify-center">
              {mode === "photo" ? (
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={!cameraReady || remainingSlots <= 0}
                  className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-[4px] border-white disabled:opacity-40"
                  aria-label="Take photo"
                >
                  <div className="h-[58px] w-[58px] rounded-full bg-white transition-transform active:scale-90" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={!cameraReady || (!isRecording && remainingSlots <= 0)}
                  className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-[4px] border-white disabled:opacity-40"
                  aria-label={isRecording ? "Stop recording" : "Start recording"}
                >
                  {isRecording ? (
                    <div className="h-7 w-7 rounded-md bg-red-500 transition-transform active:scale-90" />
                  ) : (
                    <div className="h-[58px] w-[58px] rounded-full bg-red-500 transition-transform active:scale-90" />
                  )}
                </button>
              )}
            </div>

            {/* Confirm button */}
            <div className="flex w-16 justify-center">
              {capturedFiles.length > 0 && (
                <button
                  type="button"
                  onClick={confirmCaptures}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-amber,#f59e0b)] text-white"
                  aria-label="Use captures"
                >
                  <Check size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Remaining slots info */}
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
