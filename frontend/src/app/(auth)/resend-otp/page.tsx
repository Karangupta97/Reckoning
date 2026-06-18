'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function ResendOtpPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    setLoading(true);

    try {
      await new Promise((resolve) =>
        setTimeout(resolve, 2000)
      );

      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 overflow-hidden">
      <div className="min-h-screen flex items-center justify-center p-4">

        <AnimatePresence mode="wait">

          {!sent ? (
            <motion.div
              key="resend"
              initial={{
                opacity: 0,
                y: 30,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
              }}
              transition={{
                duration: 0.5,
              }}
              className="
                w-full
                max-w-lg
                bg-white
                rounded-[32px]
                shadow-xl
                border
                border-slate-200
                p-6
                sm:p-10
              "
            >
              {/* ICON */}

              <motion.div
                initial={{
                  scale: 0,
                }}
                animate={{
                  scale: 1,
                }}
                transition={{
                  delay: 0.2,
                  type: 'spring',
                }}
                className="
                  mx-auto
                  w-20
                  h-20
                  rounded-full
                  bg-blue-600
                  flex
                  items-center
                  justify-center
                  text-white
                  mb-6
                "
              >
                <Mail size={34} />
              </motion.div>

              {/* HEADER */}

              <h1 className="text-center text-3xl font-bold text-slate-900">
                Resend Verification Code
              </h1>

              <p className="text-center text-slate-500 mt-3 mb-8">
                Didn't receive the email?
                Request a new verification code.
              </p>

              {/* INFO CARD */}

              <motion.div
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.3,
                }}
                className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-slate-50
                  p-5
                  text-center
                  mb-8
                "
              >
                <p className="text-slate-600">
                  A new OTP will be sent to
                </p>

                <p className="font-semibold text-slate-900 mt-1">
                  your registered email
                </p>
              </motion.div>

              {/* BUTTON */}

              <motion.button
                whileHover={{
                  y: -2,
                }}
                whileTap={{
                  scale: 0.98,
                }}
                onClick={handleResend}
                disabled={loading}
                className="
                  w-full
                  h-14
                  rounded-xl
                  bg-blue-600
                  hover:bg-blue-700
                  text-white
                  font-semibold
                  transition
                  disabled:opacity-60
                  flex
                  items-center
                  justify-center
                  gap-2
                "
              >
                {loading ? (
                  <>
                    <RefreshCw
                      size={18}
                      className="animate-spin"
                    />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} />
                    Resend OTP
                  </>
                )}
              </motion.button>

              {/* FOOTER */}

              <p className="text-center text-xs text-slate-400 mt-6">
                Protected by secure email verification.
              </p>

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
              className="
                w-full
                max-w-md
                bg-white
                rounded-[32px]
                shadow-xl
                border
                border-slate-200
                p-10
                text-center
              "
            >
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
                  type: 'spring',
                  stiffness: 150,
                }}
                className="mb-6"
              >
                <CheckCircle2
                  size={80}
                  className="mx-auto text-green-500"
                />
              </motion.div>

              <h2 className="text-3xl font-bold text-slate-900">
                OTP Sent!
              </h2>

              <p className="text-slate-500 mt-3">
                A new verification code has
                been sent to your email.
              </p>

              <motion.button
                whileHover={{
                  y: -2,
                }}
                whileTap={{
                  scale: 0.98,
                }}
                className="
                  mt-8
                  w-full
                  h-12
                  rounded-xl
                  bg-blue-600
                  text-white
                  font-semibold
                "
              >
                Back to Verification
              </motion.button>

            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </main>
  );
}