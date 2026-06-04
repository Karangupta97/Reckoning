'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle2 } from 'lucide-react';

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState([
    '',
    '',
    '',
    '',
    '',
    '',
  ]);

  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const inputRefs = useRef<
    (HTMLInputElement | null)[]
  >([]);

  useEffect(() => {
    if (timer === 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (
    value: string,
    index: number
  ) => {
    if (!/^\d*$/.test(value)) return;

    const updated = [...otp];
    updated[index] = value.slice(-1);

    setOtp(updated);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (
      e.key === 'Backspace' &&
      !otp[index] &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>
  ) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);

    const updated = [...otp];

    pasted.split('').forEach((digit, i) => {
      updated[i] = digit;
    });

    setOtp(updated);
  };

  const handleVerify = async () => {
    const code = otp.join('');

    if (code.length !== 6) {
      alert('Enter complete OTP');
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) =>
        setTimeout(resolve, 1800)
      );

      setVerified(true);

      setTimeout(() => {
        console.log('Navigate to dashboard');
      }, 1800);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setTimer(30);
    setOtp(['', '', '', '', '', '']);

    inputRefs.current[0]?.focus();
  };

  return (
    <main className="min-h-screen bg-slate-50 overflow-hidden">
      <div className="min-h-screen flex items-center justify-center p-4">

        <AnimatePresence mode="wait">

          {!verified ? (
            <motion.div
              key="otp"
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
                Verify Email
              </h1>

              <p className="text-center text-slate-500 mt-3 mb-8">
                Enter the 6-digit verification
                code sent to your email.
              </p>

              {/* OTP */}

              <div className="flex justify-center gap-2 sm:gap-3 mb-8">

                {otp.map((digit, index) => (
                  <motion.input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    initial={{
                      opacity: 0,
                      y: 20,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay: index * 0.05,
                    }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onPaste={handlePaste}
                    onChange={(e) =>
                      handleChange(
                        e.target.value,
                        index
                      )
                    }
                    onKeyDown={(e) =>
                      handleKeyDown(e, index)
                    }
                    className="
                      w-12
                      h-14
                      sm:w-14
                      sm:h-16
                      rounded-xl
                      border
                      border-slate-300
                      text-center
                      text-xl
                      font-bold
                      outline-none
                      transition
                      focus:border-blue-500
                      focus:ring-4
                      focus:ring-blue-100
                    "
                  />
                ))}

              </div>

              {/* BUTTON */}

              <motion.button
                whileHover={{
                  y: -2,
                }}
                whileTap={{
                  scale: 0.98,
                }}
                onClick={handleVerify}
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
                "
              >
                {loading
                  ? 'Verifying...'
                  : 'Verify OTP'}
              </motion.button>

              {/* TIMER */}

              <div className="mt-6 text-center">

                {timer > 0 ? (
                  <p className="text-slate-500">
                    Resend code in{' '}
                    <span className="font-semibold text-blue-600">
                      00:
                      {String(timer).padStart(
                        2,
                        '0'
                      )}
                    </span>
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    className="
                      text-blue-600
                      font-semibold
                    "
                  >
                    Resend Code
                  </button>
                )}

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
                  className="
                    mx-auto
                    text-green-500
                  "
                />
              </motion.div>

              <h2 className="text-3xl font-bold text-slate-900">
                Verified!
              </h2>

              <p className="text-slate-500 mt-3">
                Your email has been
                successfully verified.
              </p>

            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </main>
  );
}