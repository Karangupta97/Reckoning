'use client';

import { useState } from 'react';
import { Fingerprint, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!email || !password) {
      alert('Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) =>
        setTimeout(resolve, 1500)
      );

      console.log({
        email,
        password,
        remember,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center px-3 py-3 sm:px-4 overflow-y-auto">
      {/* Background */}

      <div className="absolute inset-0 bg-black" />

      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px]" />

      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[150px]" />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 20%, rgba(59,130,246,0.12), transparent 40%)',
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Login Card */}

      <div
        className="
          relative
          z-10
          w-full
          max-w-[500px]
          rounded-[30px]
          border
          border-white/10
          bg-[#090B12]/90
          backdrop-blur-3xl
          p-5
          sm:p-8
          shadow-[0_25px_80px_rgba(0,0,0,0.65)]
        "
      >
        {/* Header */}

        <div className="flex flex-col items-center mb-5 sm:mb-8">
          <div
            className="
              w-16
              h-16
              sm:w-20
              sm:h-20
              rounded-full
              bg-gradient-to-br
              from-blue-500
              to-blue-400
              flex
              items-center
              justify-center
              shadow-[0_0_35px_rgba(59,130,246,0.6)]
              mb-4
            "
          >
            <Fingerprint
              size={30}
              className="text-white sm:w-10 sm:h-10"
            />
          </div>

          <h1 className="text-white text-3xl sm:text-4xl font-bold mb-1 text-center">
            RECKONING
          </h1>

          <p className="text-blue-400 text-sm font-semibold mb-2 text-center">
            Administrator Portal
          </p>

          <p className="text-gray-400 text-sm text-center">
            Secure administrative access
          </p>

          <p className="text-xs text-zinc-500 mt-2 text-center">
            Protected by enterprise security
          </p>
        </div>

        {/* Form */}

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >
          {/* Email */}

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Email Address
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className="
                w-full
                h-12
                sm:h-14
                px-4
                rounded-xl
                bg-white/[0.05]
                border
                border-white/15
                text-white
                placeholder:text-gray-500
                outline-none
                transition-all
                duration-300
                focus:border-blue-500/60
                focus:shadow-[0_0_25px_rgba(59,130,246,0.25)]
              "
              required
            />
          </div>

          {/* Password */}

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Password
            </label>

            <div className="relative">
              <input
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="
                  w-full
                  h-12
                  sm:h-14
                  px-4
                  pr-12
                  rounded-xl
                  bg-white/[0.05]
                  border
                  border-white/15
                  text-white
                  placeholder:text-gray-500
                  outline-none
                  transition-all
                  duration-300
                  focus:border-blue-500/60
                  focus:shadow-[0_0_25px_rgba(59,130,246,0.25)]
                "
                required
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
                  text-gray-400
                  hover:text-white
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

          {/* Remember / Forgot */}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) =>
                  setRemember(
                    e.target.checked
                  )
                }
                className="accent-blue-500"
              />

              Remember me
            </label>

            <a
              href="#"
              className="text-blue-400 hover:text-blue-300"
            >
              Forgot Password?
            </a>
          </div>

          {/* Submit */}

          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              h-12
              sm:h-14
              rounded-xl
              bg-gradient-to-r
              from-blue-600
              to-blue-500
              text-white
              font-semibold
              shadow-[0_0_30px_rgba(59,130,246,0.35)]
              transition-all
              duration-300
              hover:scale-[1.02]
              hover:shadow-[0_0_40px_rgba(59,130,246,0.55)]
              active:scale-[0.98]
              disabled:opacity-70
              disabled:cursor-not-allowed
            "
          >
            {loading
              ? 'Signing In...'
              : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}