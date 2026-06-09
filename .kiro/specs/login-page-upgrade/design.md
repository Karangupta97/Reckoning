# Design Document — Login Page Upgrade

## Overview

This document describes the technical design for upgrading the Reckoning login page from a minimal single-column card into a modern, enterprise-grade authentication interface. The feature touches three layers:

1. **UI layer** — A new split-screen layout with Framer Motion entrance animation, a glassmorphism branding panel, inline validation feedback, and an accessible form with social login placeholders.
2. **Component layer** — Five focused, independently-testable React components (`AuthLayout`, `LoginForm`, `PasswordField`, `TrustIndicators`, `AuthFooter`) extracted into `frontend/src/components/auth/`.
3. **State layer** — A new Zustand auth store (`frontend/src/stores/authStore.ts`) using Zustand's `create()` (no `persist` middleware — session state lives in memory only, backed by HttpOnly cookies set by the server), exposing `login()`, `logout()`, and `clearError()` actions.

The upgrade preserves all existing design-system tokens (`--color-page`, `--color-card`, `--color-amber`, `neu-card-lg`, etc.), dark mode via `.dark` / `[data-theme="dark"]`, and the DM Sans / DM Mono font stack.

---

## Architecture

### Component Tree

```
app/(auth)/login/page.tsx          ← Next.js page (default export, metadata only)
  └─ <AuthLayout>                  ← Split-screen wrapper, Framer Motion
       ├─ Left column (form panel)
       │    ├─ Social login buttons (Google, GitHub)
       │    ├─ OR CONTINUE WITH EMAIL divider
       │    ├─ <LoginForm>         ← React Hook Form + Zod, auth store integration
       │    │    ├─ Email input
       │    │    ├─ <PasswordField>  ← visibility toggle, CapsLock, strength indicator
       │    │    ├─ Remember Me checkbox + Forgot Password link
       │    │    ├─ Submit button (Spinner when loading)
       │    │    ├─ Secure session notice
       │    │    └─ Inline 401 error region
       │    ├─ <TrustIndicators>
       │    └─ <AuthFooter>
       └─ Right column (branding panel — desktop only)
            ├─ Brand logo + name
            ├─ Glassmorphism card with road-safety illustration
            └─ Platform benefit statements
```

### Data Flow

```
User input → React Hook Form (Zod validation)
                ↓  valid + submitted
           LoginForm calls authStore.login(payload)
                ↓
           authStore → axios POST /api/auth/login
                ↓
       200 OK            401 / 429 / 503 / network error
         ↓                           ↓
  setState(authenticated,      setState(error, loading=false)
  user, loading=false)               ↓
  router.push('/dashboard')   LoginForm reads error, shows
                               inline message OR toast
```

### State Management

The auth store is the single source of truth for authentication state. Components read state via the `useAuthStore` hook and dispatch actions. No auth token is stored on the client — the server sets an HttpOnly cookie on login success.

---

## Shared Utilities

Three utility modules are extracted from component files to keep business logic independently testable and importable.

### `frontend/src/lib/authSchema.ts`

Exports the Zod schema and derived types consumed by `LoginForm` and the test suite.

```
exports: loginSchema, LoginFormData, LoginPayload
```

### `frontend/src/lib/passwordStrength.ts`

Exports the pure `getPasswordStrength` function consumed by `PasswordField` and its property-based tests.

```
exports: getPasswordStrength, PasswordStrength
```

### `frontend/src/lib/toast.ts` + `frontend/src/components/ui/ToastContainer.tsx`

The toast store (Zustand slice, no persist) and the fixed-position container component rendered once inside `AuthLayout`. `showToast` is importable from any component without React context threading.

```
exports (toast.ts): useToastStore, showToast, Toast
exports (ToastContainer.tsx): ToastContainer (named)
```

---

## Components and Interfaces

### `AuthLayout` (`components/auth/AuthLayout.tsx`)

Renders the page shell. On desktop (≥ 1024 px) it presents two equal-height columns. On mobile it renders only the form column. Framer Motion `motion.div` wraps the form panel with a fade-up entrance animation respecting `prefers-reduced-motion`.

```typescript
export interface AuthLayoutProps {
  children: React.ReactNode;
}
```

Key implementation details:
- Uses `useReducedMotion()` from Framer Motion to conditionally suppress animation variants.
- The branding panel uses `bg-gradient-to-br` from amber to blue (using `--color-amber` and `--color-info`) with a `backdrop-blur` glassmorphism card overlay.
- The `.road-pattern` utility class is applied to the branding background for texture.
- Both columns are inside a `flex` container with `lg:grid lg:grid-cols-2`.

Animation spec:
```typescript
const variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};
// When shouldReduceMotion is true → skip animation, render immediately
```

### `LoginForm` (`components/auth/LoginForm.tsx`)

The controlled form component. Integrates React Hook Form with `zodResolver`. Reads loading/error state from `useAuthStore`, calls `authStore.login()` on submit, shows Toast on 429/503/network errors.

```typescript
export interface LoginFormProps {
  // No external props — form is self-contained, reads from auth store
}
```

Key implementation details:
- `useForm<LoginFormData>({ resolver: zodResolver(loginSchema), mode: 'onTouched' })` — validates on blur after first touch, and on change after first submission attempt.
- `handleSubmit` guard: if `authStore.loading` is already `true`, return early (prevents double-submit).
- On HTTP 401: `setError('root', { message: 'Invalid credentials.' })` — displayed below fields via `errors.root?.message`.
- On HTTP 429/503/network: calls `showToast(message)` from the lightweight inline toast utility.
- On any completion: `authStore.loading` resets to `false`, inputs are re-enabled automatically because they bind to `disabled={isLoading}`.
- `isLoading` is derived from both `formState.isSubmitting` and `authStore.loading`.

```typescript
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}
```

### `PasswordField` (`components/auth/PasswordField.tsx`)

A self-contained password input with three features layered on top of a standard `<input>`:

1. **Visibility toggle**: `showPassword` state swaps `type="password"` ↔ `type="text"`.
2. **Caps Lock detection**: `onKeyDown` event checks `event.getModifierState('CapsLock')`, sets `capsLockActive` state. Warning is shown when the field is focused **and** `capsLockActive` is true.
3. **Strength indicator**: derived synchronously from the current value, no debounce needed.

```typescript
export interface PasswordFieldProps {
  id: string;
  label: string;
  // React Hook Form controller props
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  disabled?: boolean;
}
```

Strength scoring logic (pure function, easy to test in isolation):

```typescript
type PasswordStrength = 'weak' | 'fair' | 'strong';

function getPasswordStrength(password: string): PasswordStrength {
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigitOrSpecial = /[0-9\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E]/.test(password);
  const longEnough = password.length >= 8;

  if (!longEnough) return 'weak';
  if (hasUpper && hasLower && hasDigitOrSpecial) return 'strong';
  if ((hasUpper || hasLower) && (hasDigitOrSpecial)) return 'fair';
  return 'weak';
}
```

Strength indicator UI: a 3-segment bar below the input, coloured with `--color-danger` (weak), `--color-amber` (fair), `--color-success` (strong).

Caps Lock warning element:
```html
<p role="alert" id="capslock-warning" aria-live="polite">Caps Lock is on.</p>
```

No raw password value is placed in any DOM attribute. The toggle button's `aria-label` changes between "Show password" and "Hide password".

### `TrustIndicators` (`components/auth/TrustIndicators.tsx`)

Stateless presentational component. Renders four items in a flex-wrap row.

```typescript
export interface TrustIndicatorsProps {
  // No props — items are static
}

const TRUST_ITEMS = [
  'Secure Authentication',
  'Encrypted Sessions',
  'GDPR Compliant',
  'Privacy Protected',
] as const;
```

Each item is a `<span>` containing a `<CheckCircle>` icon (Lucide, sized 14px, coloured `text-[var(--color-success)]`) and the label text. The container uses `flex flex-wrap gap-x-4 gap-y-2` with `sm:flex-nowrap` so items appear in a single row at ≥ 640 px.

### `AuthFooter` (`components/auth/AuthFooter.tsx`)

Stateless presentational component. Renders three anchor elements.

```typescript
export interface AuthFooterProps {
  // No props — links are static
}
```

Links:
- Privacy Policy → `/privacy` — `target="_blank" rel="noopener noreferrer"`
- Terms of Service → `/terms` — `target="_blank" rel="noopener noreferrer"`
- Contact Support → `/support` (or `mailto:support@reckoning.app`)

Styling: `text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors duration-200`.

### Toast Notification Utility (`lib/toast.ts`)

A lightweight inline implementation — no external library. Uses a Zustand store slice or a simple React context to hold a queue of `{ id, message, type }` objects. The `ToastContainer` renders at the top of `AuthLayout` with `role="status"` and `aria-live="polite"`.

```typescript
export interface Toast {
  id: string;
  message: string;
  type: 'error' | 'info' | 'success';
}

export function showToast(message: string, type: Toast['type'] = 'error'): void;
```

Toasts auto-dismiss after 5 seconds. Position: fixed top-right (`fixed top-4 right-4 z-50`).

### Social Login Buttons

Rendered inline in `LoginForm.tsx` above the email/password section. These are UI-only placeholders; clicking them logs a `console.log` and displays a "Coming soon" toast.

```typescript
const SOCIAL_PROVIDERS = [
  { name: 'Google', icon: <GoogleIcon />, id: 'google' },
  { name: 'GitHub', icon: <GithubIcon />, id: 'github' },
] as const;
```

Google and GitHub brand icons will be inline SVGs (no external icon library dependency).

---

## Data Models

### Auth Store State

```typescript
// frontend/src/stores/authStore.ts
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

export interface AuthState {
  user: AuthUser | null;
  authenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export type AuthStore = AuthState & AuthActions;
```

### Login API Payload

```typescript
export interface LoginPayload {
  email: string;
  password: string;
  rememberMe: boolean;
}
```

### Login API Response

```typescript
// POST /api/auth/login → 200
export interface LoginResponse {
  user: AuthUser;
  message: string;
  // Session token is set as HttpOnly cookie by the server
  // No token field is returned in the JSON body
}
```

### Zod Validation Schema

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*[\d\x21-\x7E]).{8,}$/,
      'Password must include uppercase, lowercase, and a digit or special character'
    ),
  rememberMe: z.boolean(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
```

### Auth Store Implementation Shape

```typescript
export const useAuthStore = create<AuthStore>()(
  // NOTE: No persist middleware — auth state lives in memory only.
  // Session is maintained by the HttpOnly cookie set by the server.
  (set, get) => ({
    user: null,
    authenticated: false,
    loading: false,
    error: null,

    login: async (payload) => {
      if (get().loading) return; // guard against double-submit
      set({ loading: true, error: null });
      try {
        const res = await axios.post<LoginResponse>('/api/auth/login', payload, {
          withCredentials: true, // ensures the HttpOnly cookie is stored
        });
        set({ user: res.data.user, authenticated: true, loading: false, error: null });
        router.push('/dashboard'); // using next/navigation router
      } catch (err) {
        const message = extractErrorMessage(err);
        set({ authenticated: false, user: null, loading: false, error: message });
        throw err; // re-throw so LoginForm can inspect status code for toast routing
      }
    },

    logout: async () => {
      try {
        await axios.post('/api/auth/logout', {}, { withCredentials: true });
      } finally {
        // Always clear state regardless of API success/failure
        set({ user: null, authenticated: false, error: null, loading: false });
      }
    },

    clearError: () => set({ error: null }),
  })
);
```

### Error Code Routing (in `LoginForm`)

```typescript
function handleLoginError(err: unknown): void {
  const status = axios.isAxiosError(err) ? err.response?.status : null;

  if (status === 401) {
    setError('root', { message: 'Invalid credentials.' });
  } else if (status === 429) {
    showToast('Too many attempts. Please try again later.');
  } else if (status === 503) {
    showToast('Service unavailable. Please try again shortly.');
  } else if (!status) {
    showToast('Network error. Please check your connection.');
  } else {
    showToast('An unexpected error occurred. Please try again.');
  }
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

PBT is applicable here because the feature contains pure validation functions (`loginSchema`, `getPasswordStrength`), pure state transition logic in the auth store, and universal accessibility/security invariants that should hold across arbitrary inputs. The property-based testing library for this TypeScript/React project will be **fast-check**.

**Property Reflection:**

After reviewing all properties identified in the prework, the following consolidation decisions were made:
- Properties 9.1, 9.2, 9.3 (label association, aria-describedby, aria-invalid) are related but each tests a distinct DOM attribute, so they are kept separate for clarity.
- Properties 5.4 (clearError sets null) and 5.5 (no token storage) are independent security/state properties that each provide unique value.
- Properties 4.2 and 4.10 (disabled while loading, re-enabled after) are kept separate because one tests the loading state entry and the other tests the exit — together they form a round-trip invariant.
- Property 3.3 (CapsLock round-trip) subsumes testing 3.2 (show on) since showing then hiding is strictly more than just showing.

### Property 1: Email validator accepts only valid email addresses

*For any* string, the Zod `loginSchema` email validator SHALL accept the string if and only if it is a syntactically valid email address (contains exactly one `@`, has a non-empty local part and domain, and the domain contains at least one `.`).

**Validates: Requirements 2.1**

### Property 2: Password validator enforces all complexity rules

*For any* string, the Zod `loginSchema` password validator SHALL reject it unless it is ≥ 8 characters long AND contains at least one character in each of: `[A-Z]`, `[a-z]`, and `[0-9\x21-\x7E]`.

**Validates: Requirements 2.2**

### Property 3: Submit button is disabled when any validation error is present

*For any* combination of form field values where at least one field fails the Zod schema, the Login_Form submit button SHALL be in a disabled state.

**Validates: Requirements 2.5**

### Property 4: Password strength classification is deterministic and covers all inputs

*For any* non-empty password string, `getPasswordStrength(password)` SHALL return:
- `'weak'` if the string is fewer than 8 characters or lacks complexity,
- `'fair'` if the string is ≥ 8 characters with partial complexity (e.g., missing one required character class),
- `'strong'` if and only if the string is ≥ 8 characters and contains all required character classes.

No input should produce an unclassified result.

**Validates: Requirements 3.4**

### Property 5: CapsLock warning shows on activation and hides on deactivation (round trip)

*For any* password field instance, simulating a `keydown` event with `getModifierState('CapsLock') === true` SHALL cause the warning to be visible, and a subsequent `keydown` event with `getModifierState('CapsLock') === false` SHALL cause the warning to be hidden — restoring the pre-warning state.

**Validates: Requirements 3.2, 3.3**

### Property 6: No password value appears in any accessible DOM attribute

*For any* password string value entered into `PasswordField`, no rendered DOM attribute (including `aria-label`, `aria-describedby`, `data-*`, `value` on non-password elements) SHALL contain the raw password string.

**Validates: Requirements 3.6**

### Property 7: All form inputs are disabled while the auth store loading flag is true

*For any* form state (any valid or invalid field values, any Remember Me state), when `authStore.loading` is `true`, every `<input>` and the submit `<button>` inside `LoginForm` SHALL have the `disabled` attribute set to `true`.

**Validates: Requirements 4.2**

### Property 8: Form inputs are re-enabled after every login completion

*For any* login attempt outcome (success response, 401, 429, 503, network error), once the auth store's `loading` flag returns to `false`, all `<input>` elements and the submit `<button>` SHALL no longer have the `disabled` attribute.

**Validates: Requirements 4.10**

### Property 9: Auth store logout always clears authentication state

*For any* server response from the logout endpoint (200, 4xx, 5xx, or network error), calling `authStore.logout()` SHALL always result in `user === null`, `authenticated === false`, and `error === null` in the store state after the action completes.

**Validates: Requirements 5.3**

### Property 10: clearError always produces a null error state

*For any* error string value currently stored in `authStore.error` (including empty string, long messages, special characters, Unicode), calling `authStore.clearError()` SHALL always result in `authStore.error === null`.

**Validates: Requirements 5.4**

### Property 11: No token is written to client storage during any login attempt

*For any* valid `LoginPayload`, calling `authStore.login(payload)` SHALL never write any value to `window.localStorage`, `window.sessionStorage`, or any non-HttpOnly cookie during or after the login flow.

**Validates: Requirements 5.5**

### Property 12: Remember Me checkbox state is preserved after a failed login

*For any* initial Remember Me boolean value (true or false), after a failed login attempt (any error response), the `rememberMe` field value in the form state SHALL equal the value it held before the submission.

**Validates: Requirements 6.5**

### Property 13: Every form input has an associated visible label

*For any* render of `LoginForm`, every `<input>` element SHALL have a corresponding `<label>` element where `label.htmlFor === input.id`.

**Validates: Requirements 9.1**

### Property 14: Every input with an error has aria-describedby referencing the error element

*For any* form field in an error state, the `<input>` element's `aria-describedby` attribute SHALL contain the `id` of the rendered error message element.

**Validates: Requirements 9.2**

### Property 15: Inputs in error state always have aria-invalid="true"

*For any* form field that has a validation error message, the corresponding `<input>` SHALL have `aria-invalid="true"`.

**Validates: Requirements 9.3**

### Property 16: Alert elements always carry role="alert"

*For any* rendered state of `LoginForm` or `PasswordField`, all inline error messages and the Caps Lock warning element SHALL have `role="alert"` on their root DOM element.

**Validates: Requirements 9.8**

---

## Error Handling

### Client-Side Validation Errors

Handled entirely by React Hook Form + Zod. The `zodResolver` runs on blur (after first touch) and on every change after the first submission attempt. Error messages are rendered in `<p>` elements beneath each field with `role="alert"` and referenced via `aria-describedby`.

### HTTP 401 — Authentication Failure

The `login()` action re-throws the error. `LoginForm`'s catch block detects `status === 401` and calls React Hook Form's `setError('root', ...)`. The root error is displayed in a dedicated `<div role="alert">` below the form fields. The message is intentionally generic: "Invalid credentials." — no hint about whether the email exists.

### HTTP 429 — Rate Limiting

Detected in `LoginForm`'s catch block. A toast notification is shown: "Too many attempts. Please try again later." The form inputs are re-enabled so the user can wait and retry.

### HTTP 503 — Service Unavailable

Detected in `LoginForm`'s catch block. A toast notification is shown: "Service unavailable. Please try again shortly."

### Network Error (no response)

`axios.isAxiosError(err) && !err.response` condition. A toast notification is shown: "Network error. Please check your connection."

### Auth Store Error State vs Toast

The distinction between inline errors and toasts follows this rule:
- **Inline** (`authStore.error` / `setError('root', ...)`): actionable errors the user can fix by editing the form (wrong credentials).
- **Toast**: transient, environment-level errors the user cannot fix by changing inputs (rate limit, server down, network).

On new form submission, `clearError()` is called to wipe the previous inline error before the next request.

### Logout Failures

The `logout()` action always clears local auth state regardless of server response. If the server-side session deletion fails, the client still becomes unauthenticated. This is intentional — a failed server log-out is a security concern to investigate server-side, not something to block the user on.

---

## File Map

All files created or modified by this feature:

| Action | Path |
|--------|------|
| **Install** | `react-hook-form`, `zod`, `@hookform/resolvers` (prod) |
| **Install** | `fast-check` (devDependency) |
| **Create** | `frontend/src/lib/authSchema.ts` |
| **Create** | `frontend/src/lib/passwordStrength.ts` |
| **Create** | `frontend/src/lib/toast.ts` |
| **Create** | `frontend/src/components/ui/ToastContainer.tsx` |
| **Create** | `frontend/src/stores/authStore.ts` |
| **Create** | `frontend/src/components/auth/AuthLayout.tsx` |
| **Create** | `frontend/src/components/auth/PasswordField.tsx` |
| **Create** | `frontend/src/components/auth/TrustIndicators.tsx` |
| **Create** | `frontend/src/components/auth/AuthFooter.tsx` |
| **Create** | `frontend/src/components/auth/LoginForm.tsx` |
| **Replace** | `frontend/src/app/(auth)/login/page.tsx` |
| **Create** | `frontend/src/__tests__/auth/loginSchema.test.ts` |
| **Create** | `frontend/src/__tests__/auth/passwordStrength.test.ts` |
| **Create** | `frontend/src/__tests__/auth/authStore.test.ts` |
| **Create** | `frontend/src/__tests__/auth/LoginForm.test.tsx` |
| **Create** | `frontend/src/__tests__/auth/PasswordField.test.tsx` |

---

## Testing Strategy

### Overview

The testing approach uses three complementary layers:
1. **Unit tests** — pure function logic (schema validation, strength scoring)
2. **Property-based tests** — universal invariants across arbitrary inputs (via `fast-check`)
3. **Component tests** — React component rendering and interaction (via `@testing-library/react` + `vitest`)

No end-to-end tests are added as part of this feature spec; those belong to a broader E2E suite.

### Property-Based Testing Setup

Library: **fast-check** (TypeScript-native, no additional config needed beyond `npm install --save-dev fast-check`).

Each property test runs a minimum of **100 iterations**. Tests are tagged with a comment referencing the design property:

```typescript
// Feature: login-page-upgrade, Property 1: email validator accepts only valid email addresses
fc.assert(fc.property(fc.emailAddress(), (email) => {
  const result = loginSchema.shape.email.safeParse(email);
  expect(result.success).toBe(true);
}), { numRuns: 100 });
```

### Test Files

| File | Contents |
|---|---|
| `__tests__/auth/loginSchema.test.ts` | Properties 1, 2 — Zod schema validation |
| `__tests__/auth/passwordStrength.test.ts` | Property 4 — strength classification |
| `__tests__/auth/authStore.test.ts` | Properties 9, 10, 11 — store state management |
| `__tests__/auth/LoginForm.test.tsx` | Properties 3, 7, 8, 12, 13, 14, 15, 16 — component behaviour |
| `__tests__/auth/PasswordField.test.tsx` | Properties 5, 6 — CapsLock round trip, no password leak |

### Property Test Configuration

```typescript
// vitest.config.ts — no changes needed; fast-check integrates with standard test runners
// Each property test uses: { numRuns: 100 }
```

### Unit / Example Tests

- `AuthLayout` animation: mock `useReducedMotion`, verify variants applied/not applied.
- `AuthFooter` links: render test verifying `href`, `target`, and `rel` attributes.
- `TrustIndicators`: render test verifying all four labels and icon color class.
- Login success flow: mock axios POST returning 200, verify store state and `router.push` called.
- Login 401: verify `errors.root.message === 'Invalid credentials.'`.
- Login 429/503/network: verify correct toast message for each status.
- Remember Me payload: verify `rememberMe: true` / `false` in axios call payload based on checkbox state.
- Keyboard tab order: simulate Tab keypresses, assert focus order matches requirement 9.4.

### Accessibility Testing Note

Full WCAG 2.1 AA compliance (Requirement 9.7 colour contrast ratios) requires manual testing with assistive technologies and/or automated tools like axe-core. The design uses design-system tokens that have been validated for AA contrast in the existing codebase. `@testing-library/jest-dom` queries like `getByRole` and `getByLabelText` will validate structural accessibility in component tests.
