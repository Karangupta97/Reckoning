"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

const OTP_LENGTH = 6;

export default function OTPVerification() {
  const [otp, setOtp] = useState<string[]>(
    Array(OTP_LENGTH).fill("")
  );

  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const inputRefs = useRef<
    (HTMLInputElement | null)[]
  >([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) =>
        prev > 0 ? prev - 1 : 0
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleChange = (
    index: number,
    value: string
  ) => {
    if (!/^\d*$/.test(value)) return;

    const updated = [...otp];
    updated[index] = value.slice(-1);

    setOtp(updated);

    if (
      value &&
      index < OTP_LENGTH - 1
    ) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      e.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    const code = otp.join("");

    if (code.length === OTP_LENGTH) {
      verifyOTP(code);
    }
  }, [otp]);

  const verifyOTP = async (
    code: string
  ) => {
    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      // Demo Success OTP
      if (code === "123456") {
        setVerified(true);
      } else {
        setInvalid(true);

        setTimeout(() => {
          setInvalid(false);
          setOtp(
            Array(OTP_LENGTH).fill("")
          );
          inputRefs.current[0]?.focus();
        }, 600);
      }
    }, 1200);
  };

  const resendOTP = () => {
    setCountdown(30);

    setOtp(Array(OTP_LENGTH).fill(""));

    inputRefs.current[0]?.focus();
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-8 sm:px-6 bg-[var(--color-page)]"
      suppressHydrationWarning
    >
      <AnimatePresence mode="wait">
        {!verified ? (
          <motion.div
            key="otp"
            initial={{
              opacity: 0,
              y: 40,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
            }}
            transition={{
              duration: 0.4,
            }}
            className="w-full max-w-md"
          >
            <div className="neu-card-lg p-8">
              {/* Icon */}

              <motion.div
                initial={{
                  scale: 0,
                  rotate: -180,
                }}
                animate={{
                  scale: 1,
                  rotate: 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 180,
                }}
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{
                  background:
                    "color-mix(in srgb,var(--color-info) 12%,transparent)",
                }}
              >
                <ShieldCheck
                  size={40}
                  color="var(--color-info)"
                />
              </motion.div>

              <h1
                className="text-3xl font-bold text-center"
                style={{
                  color:
                    "var(--color-text-primary)",
                }}
              >
                Verify OTP
              </h1>

              <p
                className="text-center mt-3"
                style={{
                  color:
                    "var(--color-text-secondary)",
                }}
              >
                Enter the verification code
                sent to your email.
              </p>

              {/* OTP Boxes */}

              <motion.div
                animate={
                  invalid
                    ? {
                        x: [
                          -10,
                          10,
                          -8,
                          8,
                          -4,
                          4,
                          0,
                        ],
                      }
                    : {}
                }
                transition={{
                  duration: 0.4,
                }}
                className="flex justify-center gap-3 mt-8"
              >
                {otp.map(
                  (digit, index) => (
                    <motion.div
                      key={index}
                      animate={{
                        scale: digit
                          ? [1, 1.15, 1]
                          : 1,
                      }}
                      transition={{
                        duration: 0.25,
                      }}
                      className="relative"
                    >
                      <input
                        ref={(el) => {
                          inputRefs.current[
                            index
                          ] = el;
                        }}
                        type="text"
                        maxLength={1}
                        inputMode="numeric"
                        value={digit}
                        onChange={(e) =>
                          handleChange(
                            index,
                            e.target.value
                          )
                        }
                        onKeyDown={(e) =>
                          handleKeyDown(
                            index,
                            e
                          )
                        }
                        className="w-14 h-16 text-center text-2xl font-bold rounded-2xl border outline-none transition-all"
                        style={{
                          background:
                            "var(--color-card)",
                          color:
                            "var(--color-text-primary)",
                          borderColor:
                            digit
                              ? "var(--color-info)"
                              : "var(--color-border)",
                          boxShadow:
                            digit
                              ? "0 0 20px rgba(59,130,246,.25)"
                              : "var(--shadow-neu)",
                        }}
                      />

                      {digit && (
                        <motion.div
                          initial={{
                            scale: 0,
                            opacity: 0,
                          }}
                          animate={{
                            scale: 1,
                            opacity: 1,
                          }}
                          className="absolute inset-0 rounded-2xl pointer-events-none"
                          style={{
                            border:
                              "1px solid var(--color-info)",
                          }}
                        />
                      )}
                    </motion.div>
                  )
                )}
              </motion.div>

              {/* Loading */}

              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    exit={{
                      opacity: 0,
                    }}
                    className="mt-6 flex flex-col items-center"
                  >
                    <motion.div
                      animate={{
                        rotate: 360,
                      }}
                      transition={{
                        repeat:
                          Infinity,
                        duration: 1,
                        ease: "linear",
                      }}
                    >
                      <RefreshCw
                        size={24}
                        color="var(--color-info)"
                      />
                    </motion.div>

                    <p
                      className="mt-3 text-sm"
                      style={{
                        color:
                          "var(--color-text-secondary)",
                      }}
                    >
                      Verifying...
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Resend */}

              <div className="text-center mt-8">
                {countdown > 0 ? (
                  <p
                    style={{
                      color:
                        "var(--color-text-muted)",
                    }}
                  >
                    Resend OTP in{" "}
                    {countdown}s
                  </p>
                ) : (
                  <button
                    onClick={resendOTP}
                    className="font-semibold"
                    style={{
                      color:
                        "var(--color-info)",
                    }}
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{
              opacity: 0,
              scale: 0.7,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            className="neu-card-lg p-10 text-center max-w-md w-full"
          >
            <motion.div
              initial={{
                scale: 0,
                rotate: -180,
              }}
              animate={{
                scale: [0, 1.3, 1],
                rotate: 0,
              }}
              transition={{
                duration: 0.8,
              }}
            >
              <CheckCircle2
                size={90}
                color="var(--color-success)"
              />
            </motion.div>

            <motion.h2
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="text-3xl font-bold mt-5"
              style={{
                color:
                  "var(--color-text-primary)",
              }}
            >
              Verified Successfully
            </motion.h2>

            <motion.p
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              className="mt-3"
              style={{
                color:
                  "var(--color-text-secondary)",
              }}
            >
              Your account has been
              verified successfully.
            </motion.p>

            <motion.div
              initial={{
                scale: 0,
              }}
              animate={{
                scale: [0, 1.1, 1],
              }}
              transition={{
                delay: 0.2,
              }}
              className="mt-8"
            >
              <button className="btn-amber px-6 py-3">
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}