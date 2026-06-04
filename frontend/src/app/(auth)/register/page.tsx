'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Eye,
  EyeOff,
  UserPlus,
} from 'lucide-react';

export default function RegisterPage() {
  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setLoading(true);

    try {
      await new Promise((resolve) =>
        setTimeout(resolve, 1200)
      );

      console.log('Register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="h-screen overflow-hidden bg-slate-50">
      <div className="h-full flex items-center justify-center p-2 sm:p-4">

        <div
          className="
            w-full
            max-w-6xl
            h-[96vh]
            bg-white
            rounded-[24px]
            shadow-xl
            overflow-hidden
            border
            border-slate-200
          "
        >

          <div className="grid h-full lg:grid-cols-2">

            {/* LEFT PANEL */}

            <div
              className="
                hidden
                lg:flex
                flex-col
                justify-center
                items-center
                bg-gradient-to-br
                from-blue-600
                via-blue-500
                to-indigo-600
                text-white
                px-10
              "
            >

              <div
                className="
                  w-28
                  h-28
                  rounded-full
                  bg-white/20
                  flex
                  items-center
                  justify-center
                  mb-6
                "
              >
                <UserPlus size={56} />
              </div>

              <h1 className="text-5xl font-bold mb-4">
                RECKONING
              </h1>

              <p
                className="
                  text-lg
                  text-center
                  max-w-sm
                  opacity-90
                "
              >
                Join thousands of citizens
                helping build safer roads
                and stronger communities.
              </p>

            </div>

            {/* RIGHT PANEL */}

            <div
              className="
                h-full
                flex
                flex-col
                justify-center
                px-5
                sm:px-8
                lg:px-12
              "
            >

              {/* MOBILE HEADER */}

              <div className="lg:hidden text-center mb-6">

                <div
                  className="
                    mx-auto
                    mb-3
                    w-14
                    h-14
                    rounded-full
                    bg-blue-600
                    text-white
                    flex
                    items-center
                    justify-center
                  "
                >
                  <UserPlus size={24} />
                </div>

                <h1
                  className="
                    text-2xl
                    font-bold
                    text-slate-900
                  "
                >
                  RECKONING
                </h1>

                <p className="text-slate-500 text-sm mt-1">
                  Create Account
                </p>

              </div>

              <div className="max-w-md mx-auto w-full">

                <h2
                  className="
                    text-2xl
                    sm:text-3xl
                    font-bold
                    text-slate-900
                    mb-1
                  "
                >
                  Create Account
                </h2>

                <p
                  className="
                    text-slate-500
                    text-sm
                    sm:text-base
                    mb-5
                  "
                >
                  Join Reckoning and help
                  improve your community.
                </p>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-3"
                >

                  {/* FULL NAME */}

                  <div>

                    <label
                      className="
                        block
                        text-sm
                        font-medium
                        text-slate-700
                        mb-2
                      "
                    >
                      Full Name
                    </label>

                    <input
                      type="text"
                      required
                      placeholder="Enter your name"
                      className="
                        w-full
                        h-12
                        px-4
                        rounded-xl
                        border
                        border-slate-300
                        outline-none
                        focus:border-blue-500
                        focus:ring-4
                        focus:ring-blue-100
                        transition
                      "
                    />

                  </div>

                  {/* EMAIL */}

                  <div>

                    <label
                      className="
                        block
                        text-sm
                        font-medium
                        text-slate-700
                        mb-2
                      "
                    >
                      Email Address
                    </label>

                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      className="
                        w-full
                        h-12
                        px-4
                        rounded-xl
                        border
                        border-slate-300
                        outline-none
                        focus:border-blue-500
                        focus:ring-4
                        focus:ring-blue-100
                        transition
                      "
                    />

                  </div>

                  {/* PASSWORD */}

                  <div>

                    <label
                      className="
                        block
                        text-sm
                        font-medium
                        text-slate-700
                        mb-2
                      "
                    >
                      Password
                    </label>

                    <div className="relative">

                      <input
                        type={
                          showPassword
                            ? 'text'
                            : 'password'
                        }
                        required
                        placeholder="Create password"
                        className="
                          w-full
                          h-12
                          px-4
                          pr-12
                          rounded-xl
                          border
                          border-slate-300
                          outline-none
                          focus:border-blue-500
                          focus:ring-4
                          focus:ring-blue-100
                          transition
                        "
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            !showPassword
                          )
                        }
                        className="
                          absolute
                          right-4
                          top-1/2
                          -translate-y-1/2
                          text-slate-500
                        "
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>

                    </div>

                  </div>

                  {/* CONFIRM PASSWORD */}

                  <div>

                    <label
                      className="
                        block
                        text-sm
                        font-medium
                        text-slate-700
                        mb-2
                      "
                    >
                      Confirm Password
                    </label>

                    <div className="relative">

                      <input
                        type={
                          showConfirmPassword
                            ? 'text'
                            : 'password'
                        }
                        required
                        placeholder="Confirm password"
                        className="
                          w-full
                          h-12
                          px-4
                          pr-12
                          rounded-xl
                          border
                          border-slate-300
                          outline-none
                          focus:border-blue-500
                          focus:ring-4
                          focus:ring-blue-100
                          transition
                        "
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            !showConfirmPassword
                          )
                        }
                        className="
                          absolute
                          right-4
                          top-1/2
                          -translate-y-1/2
                          text-slate-500
                        "
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>

                    </div>

                  </div>

                  {/* BUTTON */}

                  <button
                    type="submit"
                    disabled={loading}
                    className="
                      w-full
                      h-12
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
                      ? 'Creating Account...'
                      : 'Create Account'}
                  </button>

                </form>

                {/* FOOTER */}

                <div className="mt-5 text-center">

                  <p className="text-sm text-slate-600">
                    Already have an account?
                  </p>

                  <Link
                    href="/auth/login"
                    className="
                      mt-2
                      inline-flex
                      justify-center
                      items-center
                      w-full
                      h-11
                      rounded-xl
                      border
                      border-blue-600
                      text-blue-600
                      font-semibold
                    "
                  >
                    Sign In
                  </Link>

                  <p className="mt-4 text-xs text-slate-400">
                    Protected by secure authentication.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </main>
  );
}