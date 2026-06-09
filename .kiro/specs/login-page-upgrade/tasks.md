# Implementation Plan: Login Page Upgrade

## Overview

Upgrade the Reckoning login page from a minimal single-column card into a modern, enterprise-grade authentication interface. The implementation follows a bottom-up dependency order: packages first, then shared utilities, then the Zustand auth store, then individual UI components, and finally the composition page and tests.

All work is in the `frontend/` directory. The backend API (`POST /api/auth/login`) is assumed to already exist and set an HttpOnly session cookie on success.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1"],
      "description": "Install packages — unblocks everything else"
    },
    {
      "wave": 2,
      "tasks": ["2"],
      "description": "Shared utilities (authSchema, passwordStrength, toast) — unblocks components and store"
    },
    {
      "wave": 3,
      "tasks": ["3", "4", "5", "6", "7"],
      "description": "Auth store + all individual components (parallel) — no interdependencies within this wave"
    },
    {
      "wave": 4,
      "tasks": ["8"],
      "description": "LoginForm — depends on auth store (3), PasswordField (4), and AuthLayout (7)"
    },
    {
      "wave": 5,
      "tasks": ["9"],
      "description": "Login page entry point — composes all components"
    },
    {
      "wave": 6,
      "tasks": ["10"],
      "description": "Property-based and unit tests — depends on all implementation tasks"
    }
  ]
}
```

## Tasks

- [x] 1. Install required dependencies
  - Run `npm install react-hook-form zod @hookform/resolvers` in the `frontend/` directory
  - Run `npm install --save-dev fast-check` in the `frontend/` directory
  - Verify all packages appear in `frontend/package.json` under their respective sections
  - **Requirements:** 2.6

- [x] 2. Create shared utility modules
  - [x] 2.1 Create `frontend/src/lib/authSchema.ts`
    - Define and export `loginSchema` using Zod: email (RFC-5321 `.email()`), password (`min(8)` + regex enforcing ≥1 uppercase `[A-Z]`, ≥1 lowercase `[a-z]`, ≥1 digit or special `[\d\x21-\x7E]`)
    - Export `LoginFormData` type via `z.infer<typeof loginSchema>`
    - Export `LoginPayload` interface: `{ email: string; password: string; rememberMe: boolean }`
    - **Requirements:** 2.1, 2.2, 2.6
  - [x] 2.2 Create `frontend/src/lib/passwordStrength.ts`
    - Export `PasswordStrength` type: `'weak' | 'fair' | 'strong'`
    - Export pure function `getPasswordStrength(password: string): PasswordStrength`
    - Weak: fewer than 8 chars or missing complexity; Fair: ≥8 chars with partial complexity; Strong: ≥8 chars with all required character classes present
    - No side effects, no imports beyond TypeScript primitives
    - **Requirements:** 3.4
  - [x] 2.3 Create `frontend/src/lib/toast.ts` and `frontend/src/components/ui/ToastContainer.tsx`
    - `toast.ts`: Zustand store (no persist) with `Toast[]` queue typed as `{ id: string; message: string; type: 'error' | 'info' | 'success' }`; export `useToastStore`, `showToast(message, type?)`; toasts auto-dismiss after 5 seconds via `setTimeout`
    - `ToastContainer.tsx`: named export; `fixed top-4 right-4 z-50`; container has `role="status"` and `aria-live="polite"`; each toast is dismissible
    - **Requirements:** 4.7, 4.8, 4.9, 7.2

- [x] 3. Create Zustand auth store
  - Create `frontend/src/stores/authStore.ts` with `"use client"` directive
  - Export interfaces: `AuthUser` (`id`, `email`, `name`, `role`, `avatarUrl?`), `AuthState`, `AuthActions`, `AuthStore`
  - Initialise with `user: null, authenticated: false, loading: false, error: null`
  - `login(payload)`: guard `if (get().loading) return`, set `loading: true, error: null`, POST to `/api/auth/login` with `withCredentials: true`; on success set `user`, `authenticated: true`, `loading: false`; on failure set `error` + `loading: false` + re-throw so LoginForm can inspect status code
  - `logout()`: POST to `/api/auth/logout` with `withCredentials: true`; in `finally` always clear `user`, `authenticated`, `error`, `loading`
  - `clearError()`: set `error: null`
  - Use `create<AuthStore>()` with NO `persist` middleware
  - Export `useAuthStore` as named export
  - **Requirements:** 5.1, 5.2, 5.3, 5.4, 5.5

- [x] 4. Create PasswordField component
  - Create `frontend/src/components/auth/PasswordField.tsx` with `"use client"` directive
  - Export `PasswordFieldProps` interface: `{ id: string; label: string; value: string; onChange: (v: string) => void; onBlur: () => void; error?: string; disabled?: boolean }`
  - Export named `PasswordField` component
  - Default `type="password"`; Eye/EyeOff toggle button (lucide-react) with `aria-label="Show password"` or `"Hide password"` — never contains password value
  - CapsLock: `onKeyDown` + `event.getModifierState('CapsLock')`; local `capsLockActive` state; warning `<p role="alert">Caps Lock is on.</p>` shown when field is focused AND capsLockActive
  - Strength bar: import `getPasswordStrength` from `lib/passwordStrength.ts`; render 3 segments — 1 filled = weak (`--color-danger`), 2 filled = fair (`--color-amber`), 3 filled = strong (`--color-success`)
  - `autoComplete="current-password"` on the input
  - Inline error: `<p role="alert">` only when `error` prop is set
  - Raw password value must not appear in any DOM attribute
  - **Requirements:** 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 9.8, 9.9

- [x] 5. Create TrustIndicators component
  - Create `frontend/src/components/auth/TrustIndicators.tsx`
  - Export `TrustIndicatorsProps` interface (empty)
  - Export named `TrustIndicators` component
  - Render exactly four items: "Secure Authentication", "Encrypted Sessions", "GDPR Compliant", "Privacy Protected"
  - Each item: `<CheckCircle>` (lucide-react, size 14) with `text-[var(--color-success)]` + label text
  - Container: `flex flex-wrap gap-x-4 gap-y-2 sm:flex-nowrap` — single row on ≥640px, wraps on smaller
  - **Requirements:** 8.1, 8.2, 8.3, 8.4

- [x] 6. Create AuthFooter component
  - Create `frontend/src/components/auth/AuthFooter.tsx`
  - Export `AuthFooterProps` interface (empty)
  - Export named `AuthFooter` component
  - Three links: "Privacy Policy" (`/privacy`, `target="_blank" rel="noopener noreferrer"`), "Terms of Service" (`/terms`, `target="_blank" rel="noopener noreferrer"`), "Contact Support" (`/support`)
  - Styling: `text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors duration-200`
  - All links keyboard-focusable with `:focus-visible` ring using `--color-amber`
  - **Requirements:** 10.1, 10.2, 10.3, 10.4

- [x] 7. Create AuthLayout component
  - Create `frontend/src/components/auth/AuthLayout.tsx` with `"use client"` directive
  - Export `AuthLayoutProps` interface: `{ children: React.ReactNode }`
  - Export named `AuthLayout` component
  - Full-screen: `min-h-screen bg-[var(--color-page)]`
  - Desktop (≥1024px): `lg:grid lg:grid-cols-2`; left column centres children with max-width 480px; right column `hidden lg:flex`
  - Branding panel: `bg-gradient-to-br from-[var(--color-amber)] to-[var(--color-info)]` + `.road-pattern` texture; glassmorphism card `backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl` containing: Reckoning logo, brand name, road-safety illustration, ≥2 benefit statements, ≥1 trust indicator text
  - Animation: import `useReducedMotion` from `framer-motion`; wrap form panel in `motion.div`; variants `{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } }`; when `shouldReduceMotion` is true render in `"visible"` state immediately with no initial animation
  - Render `<ToastContainer />` inside the layout root
  - Use CSS token variables directly — never hardcode hex colours
  - **Requirements:** 1.1, 1.2, 1.3, 1.4, 1.5, 1.6

- [x] 8. Create LoginForm component
  - Create `frontend/src/components/auth/LoginForm.tsx` with `"use client"` directive
  - Export `LoginFormProps` interface (empty)
  - Export named `LoginForm` component
  - `useForm<LoginFormData>({ resolver: zodResolver(loginSchema), mode: 'onTouched', defaultValues: { email: '', password: '', rememberMe: false } })`
  - `isLoading = formState.isSubmitting || authStore.loading`
  - **Social login buttons** (above OR divider): "Continue with Google" and "Continue with GitHub" with inline SVG brand icons; on click `showToast('Social login coming soon.', 'info')` and return; must not submit form or change URL
  - **OR divider**: horizontal lines + "OR CONTINUE WITH EMAIL" text
  - **Email field**: `<label htmlFor="email">`, `<input id="email" type="email" autoComplete="email" aria-describedby="email-error" aria-invalid={!!errors.email}>`, disabled when isLoading; error `<p id="email-error" role="alert">` when `errors.email` present
  - **Password field**: `<PasswordField>` wired with `register('password')` controller props, `error={errors.password?.message}`, `disabled={isLoading}`
  - **Remember Me row**: checkbox `id="remember-me"` with label + Forgot Password link (`/forgot-password`) right-aligned
  - **Submit button**: `btn-amber`, disabled when `!formState.isValid || isLoading`; renders `<Spinner>` (animated SVG) when isLoading
  - **Secure session notice**: always-visible `<p>` with `ShieldCheck` icon below submit button
  - **Root error region**: `<div role="alert">` for inline 401 message (`errors.root?.message`), hidden when null
  - **Create Account link**: `<Link href="/register">`
  - **Submit handler**: `clearError()` first; try `authStore.login(payload)` + redirect on success; catch → `handleLoginError(err)` routing 401→`setError('root', ...)`, 429/503/network→`showToast(...)`
  - Tab order: Google btn → GitHub btn → email → password → remember-me → forgot-password → submit
  - **Requirements:** 2.1–2.6, 3.1–3.6, 4.1–4.10, 6.1–6.5, 7.1–7.2, 9.1–9.9

- [x] 9. Replace login page entry point
  - Rewrite `frontend/src/app/(auth)/login/page.tsx`
  - Add `metadata` export: `{ title: 'Sign In — Reckoning', description: 'Sign in to your Reckoning account.' }`
  - Default export renders `<AuthLayout>` containing `<LoginForm />`, `<TrustIndicators />`, `<AuthFooter />`
  - File contains ONLY: import statements, metadata export, default export function with JSX — no API calls, schemas, store definitions, or event handlers
  - **Requirements:** 11.1–11.9

- [ ] 10. Write property-based and unit tests
  - [-] 10.1 Create `frontend/src/__tests__/auth/loginSchema.test.ts`
    - Property 1 (100 runs, `fc.emailAddress()`): `loginSchema.shape.email.safeParse(email).success === true`
    - Property 2 (100 runs): strings satisfying all password rules → `.success === true`; strings missing any rule → `.success === false`
    - **Requirements:** 2.1, 2.2
  - [-] 10.2 Create `frontend/src/__tests__/auth/passwordStrength.test.ts`
    - Property 4 (100 runs): `getPasswordStrength` always returns one of `'weak'|'fair'|'strong'` — never undefined; boundary cases for Weak/Fair/Strong classifications
    - **Requirements:** 3.4
  - [-] 10.3 Create `frontend/src/__tests__/auth/authStore.test.ts`
    - Property 9: mock axios logout to reject; call `logout()`; assert `user === null`, `authenticated === false`, `error === null`
    - Property 10 (100 runs, `fc.string()`): set store error to arbitrary string; call `clearError()`; assert `error === null`
    - Property 11: spy on `localStorage.setItem` and `sessionStorage.setItem`; call `login(payload)`; assert neither spy called
    - **Requirements:** 5.3, 5.4, 5.5
  - [-] 10.4 Create `frontend/src/__tests__/auth/LoginForm.test.tsx`
    - Property 3: invalid field combos → submit button has `disabled` attribute
    - Property 7: `authStore.loading = true` → all inputs and submit have `disabled`
    - Property 8: after each error outcome (401/429/503/network) settles → inputs and submit do NOT have `disabled`
    - Property 12: set rememberMe to random boolean; trigger failing login; assert value unchanged
    - Property 13: all `<input>` elements have matching `<label htmlFor>` in DOM
    - Property 14: errored inputs have `aria-describedby` matching error element `id`
    - Property 15: errored inputs have `aria-invalid="true"`
    - Property 16: all active errors have `role="alert"` on their root element
    - Unit: 401 → `errors.root.message === 'Invalid credentials.'`
    - Unit: 429 → toast "Too many attempts. Please try again later."
    - Unit: network error → toast "Network error. Please check your connection."
    - **Requirements:** 2.5, 4.2, 4.10, 6.5, 9.1, 9.2, 9.3, 9.8
  - [ ] 10.5 Create `frontend/src/__tests__/auth/PasswordField.test.tsx`
    - Property 5: `keydown` with CapsLock=true → warning visible; `keydown` with CapsLock=false → warning hidden
    - Property 6 (100 runs, `fc.string()`): no rendered DOM attribute contains the raw password value
    - Unit: toggle click swaps input type between `password` and `text`
    - Unit: toggle `aria-label` is `"Show password"` when hidden, `"Hide password"` when shown
    - **Requirements:** 3.1, 3.2, 3.3, 3.6, 9.8, 9.9

## Notes

- The backend `POST /api/auth/login` endpoint is assumed to exist and return `{ user: AuthUser }` with an HttpOnly session cookie. No backend changes are required for this feature.
- Social login buttons (Google, GitHub) are UI-only placeholders. OAuth integration is out of scope — the click handler shows a "coming soon" toast.
- The `fast-check` PBT library runs 100 iterations per property by default. All 16 correctness properties from `design.md` are covered across the five test files.
- WCAG 2.1 AA colour contrast (Requirement 9.7) is partially verified by design-system token usage; full validation requires manual testing with assistive technologies or axe-core.
- The auth store uses no `persist` middleware intentionally — session continuity is managed by the server's HttpOnly cookie, not client storage.
