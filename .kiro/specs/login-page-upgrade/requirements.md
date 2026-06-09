# Requirements Document

## Introduction

This feature upgrades the existing Reckoning login page (`frontend/src/app/(auth)/login/page.tsx`) from a minimal single-column card into a modern, enterprise-grade authentication interface. The upgrade introduces a split-screen layout on desktop, real-time form validation via React Hook Form + Zod, security-oriented UX patterns (Caps Lock detection, password strength, rate-limit feedback), Zustand-based auth state management, and a reusable component architecture under `components/auth/`. The existing design-system tokens (`--color-page`, `--color-amber`, `neu-card-lg`, etc.) and dark-mode support are preserved throughout.

---

## Glossary

- **Auth_Layout**: The top-level wrapper component (`AuthLayout.tsx`) that renders the split-screen structure and handles responsive collapse.
- **Login_Form**: The controlled form component (`LoginForm.tsx`) that manages email/password inputs, validation, and submission.
- **Password_Field**: The specialised password input component (`PasswordField.tsx`) encapsulating visibility toggle, Caps Lock detection, and strength indicator.
- **Trust_Indicators**: The component (`TrustIndicators.tsx`) that renders the four security badge items below the form.
- **Auth_Footer**: The component (`AuthFooter.tsx`) rendering Privacy Policy, Terms of Service, and Contact Support links.
- **Auth_Store**: The Zustand store (`stores/authStore.ts`) that holds and exposes authentication state and actions.
- **Validator**: The Zod schema instance responsible for email and password validation rules.
- **Spinner**: The animated loading indicator rendered inside the submit button during authentication.
- **Toast_Notification**: A non-blocking message overlay used to surface error and status feedback to the user.
- **Social_Login_Button**: A UI-only placeholder button for OAuth provider entry points (Google, GitHub).
- **Password_Strength_Indicator**: A visual bar or label that rates password complexity in real time.
- **Caps_Lock_Warning**: An inline notice shown when the OS keyboard Caps Lock key is active while the password field is focused.
- **Remember_Me**: A checkbox option that communicates a persistent-session preference in the login payload.
- **HttpOnly_Cookie**: A server-set cookie inaccessible to JavaScript, used to store session tokens.

---

## Requirements

### Requirement 1: Split-Screen Authentication Layout

**User Story:** As a user accessing Reckoning on desktop, I want to see a branded split-screen login layout, so that the page communicates the platform's identity and key benefits alongside the login form.

#### Acceptance Criteria

1. THE Auth_Layout SHALL render a two-column layout on viewports ≥ 1024 px wide, with the left column containing the Login_Form and the right column containing at minimum: the Reckoning brand name and logo, one road-safety illustration, at least 2 platform benefit statements, and at least 1 trust indicator.
2. WHEN the viewport width is less than 1024 px, THE Auth_Layout SHALL collapse into a single-column layout, hiding the branding column entirely.
3. THE Auth_Layout SHALL constrain the Login_Form column to a maximum width of 480 px.
4. THE Auth_Layout SHALL apply the CSS tokens `--color-page` as the page background and `--color-card` as the card surface; these tokens SHALL reflect the active colour scheme without a page reload when the OS or user colour preference changes.
5. WHEN the page first renders AND `prefers-reduced-motion` is not active in the user's OS settings, THE Auth_Layout SHALL animate the form panel into view using a Framer Motion entrance animation with a duration no longer than 600 ms.
6. WHEN `prefers-reduced-motion` is active, THE Auth_Layout SHALL completely disable the entrance animation and render the form panel immediately without motion.

---

### Requirement 2: Form Validation

**User Story:** As a user filling in the login form, I want real-time inline validation feedback, so that I know immediately when my input is invalid before submitting.

#### Acceptance Criteria

1. THE Validator SHALL enforce that the email field contains a syntactically valid RFC-5321 email address.
2. THE Validator SHALL enforce that the password field contains at least 8 characters, at least one uppercase letter (A–Z), at least one lowercase letter (a–z), and at least one digit (0–9) or special character (any non-alphanumeric printable ASCII character in the decimal range 33–126).
3. WHEN a field value fails validation after the user has interacted with it (on blur or on change after the first submission attempt), THE Login_Form SHALL display an inline error message directly beneath that field. WHEN the field value subsequently becomes valid, THE Login_Form SHALL remove the inline error message.
4. IF an input contains a validation error, THEN THE Login_Form SHALL apply error-state styling (border coloured with `--color-danger`) to that input. IF the error is resolved, THEN THE Login_Form SHALL remove the error-state styling from that input.
5. WHILE any validation error is present, THE Login_Form SHALL keep the submit button in a disabled state.
6. THE Login_Form SHALL use React Hook Form integrated with the Zod Validator via `@hookform/resolvers/zod`.

---

### Requirement 3: Password Field Security Features

**User Story:** As a user entering my password, I want visibility toggle, Caps Lock warnings, and password strength feedback, so that I can enter my password confidently and securely.

#### Acceptance Criteria

1. THE Password_Field SHALL default to `type="password"` and SHALL render a toggle button that switches the input between `type="password"` and `type="text"` when activated.
2. WHEN the password input is focused and the OS Caps Lock key is active, THE Password_Field SHALL display the Caps_Lock_Warning message: "Caps Lock is on."
3. WHEN the Caps Lock key is deactivated while the password input remains focused, THE Password_Field SHALL hide the Caps_Lock_Warning.
4. THE Password_Field SHALL render a Password_Strength_Indicator that updates within one keystroke of the user's input, reflecting at minimum the categories: Weak (fewer than 8 characters or missing complexity), Fair (8+ characters with partial complexity), Strong (8+ characters meeting all complexity rules).
5. THE Password_Field SHALL set `autoComplete="current-password"` on the login form's password input to align with browser credential management for sign-in flows.
6. THE Password_Field SHALL not render the password value in any accessible DOM attribute that could be captured by logging tools (e.g., no `data-value` or `aria-label` containing the raw password).

---

### Requirement 4: Login Protection and Submission State

**User Story:** As a user submitting the login form, I want clear loading feedback and protection against accidental multiple submissions, so that I can trust the form is working without triggering duplicate requests.

#### Acceptance Criteria

1. WHEN the Login_Form is submitted, THE Auth_Store SHALL call `login()` with the login payload via a POST request to `/api/auth/login`.
2. WHILE a login request is in flight, THE Login_Form SHALL disable all form inputs and the submit button.
3. WHILE a login request is in flight, THE Login_Form SHALL replace the submit button label with a Spinner component.
4. WHILE a login request is in flight, THE Login_Form SHALL ignore any additional submit attempts so that only one request is active at a time.
5. WHEN the login request succeeds, THE Auth_Store SHALL update `authenticated` to `true` and redirect the user to the dashboard.
6. IF the server returns an authentication failure (HTTP 401), THEN THE Login_Form SHALL display the generic inline message "Invalid credentials." below the form fields, without revealing whether the email address exists in the system.
7. IF the server returns HTTP 429 (rate limited), THEN THE Login_Form SHALL display a Toast_Notification with the message "Too many attempts. Please try again later."
8. WHEN the browser receives no HTTP response (request timeout or network failure), THE Login_Form SHALL display a Toast_Notification with the message "Network error. Please check your connection."
9. IF the server returns HTTP 503, THEN THE Login_Form SHALL display a Toast_Notification with the message "Service unavailable. Please try again shortly."
10. WHEN the login request completes (success or failure), THE Login_Form SHALL re-enable all form inputs and the submit button.

---

### Requirement 5: Auth Store Integration

**User Story:** As a developer, I want a centralised Zustand auth store, so that authentication state is accessible across the application without prop drilling.

#### Acceptance Criteria

1. THE Auth_Store SHALL initialise with the state: `user: null`, `authenticated: false`, `loading: false`, `error: null`, and SHALL expose these fields for consumption by components.
2. THE Auth_Store SHALL expose a `login(payload)` action that: sets `loading` to `true` before the API call; on success sets `authenticated` to `true`, populates `user` from the response user object, clears `error`, and resets `loading` to `false`; on failure sets `authenticated` to `false`, leaves `user` as `null`, sets `error` to the server-returned message or a generic fallback string, and resets `loading` to `false`.
3. THE Auth_Store SHALL expose a `logout()` action that calls the server-side session deletion endpoint and, regardless of whether that call succeeds or fails, clears `user`, sets `authenticated` to `false`, and resets `error` to `null`.
4. THE Auth_Store SHALL expose a `clearError()` action that sets `error` to `null`.
5. THE Auth_Store SHALL NOT write any value to `localStorage`, `sessionStorage`, or non-HttpOnly cookies as part of authentication token storage.

---

### Requirement 6: Session Awareness and Remember Me

**User Story:** As a user, I want a "Remember Me" option and a visible secure session notice, so that I can choose persistent sessions and feel confident my session is protected.

#### Acceptance Criteria

1. THE Login_Form SHALL render a "Remember Me" checkbox that defaults to unchecked.
2. WHEN the user checks "Remember Me", THE Login_Form SHALL pass a persistent-session indicator in the login payload so the server can issue a longer-lived session.
3. WHEN the user does not check "Remember Me", THE Login_Form SHALL pass a session-scoped indicator in the login payload so the server issues a session-only token.
4. THE Login_Form SHALL display a secure session notice below the submit button at all times, communicating that the session is protected by secure authentication.
5. WHEN the login request fails, THE Login_Form SHALL retain the "Remember Me" checkbox in the same state (checked or unchecked) as it was before the submission.

---

### Requirement 8: Trust Indicators

**User Story:** As a user, I want to see security trust signals below the form, so that I feel confident submitting my credentials.

#### Acceptance Criteria

1. THE Trust_Indicators SHALL render exactly four items: "Secure Authentication", "Encrypted Sessions", "GDPR Compliant", and "Privacy Protected", each preceded by a checkmark icon.
2. THE Trust_Indicators SHALL use `--color-success` for the checkmark icons.
3. THE Trust_Indicators SHALL be visible on both mobile (single-column) and desktop (within the form column) layouts.
4. THE Trust_Indicators items SHALL be rendered in a single row on viewports ≥ 640 px and MAY wrap to two rows on narrower viewports.

---

### Requirement 9: Accessibility

**User Story:** As a user relying on keyboard navigation or assistive technology, I want the login page to be fully navigable and screen-reader compatible, so that I can authenticate without barriers.

#### Acceptance Criteria

1. THE Login_Form SHALL associate every input with a visible `<label>` element using `htmlFor` / `id` pairing.
2. THE Login_Form SHALL apply `aria-describedby` on each input to reference its corresponding inline error message element.
3. WHEN an inline error message is shown, THE Login_Form SHALL set `aria-invalid="true"` on the corresponding input.
4. THE Login_Form SHALL be fully operable using keyboard Tab navigation in the following explicit order: social login buttons → email input → password input → remember-me checkbox → forgot-password link → submit button.
5. WHEN the user presses Enter while any form field is focused AND both the email and password fields are non-empty, THE Login_Form SHALL attempt submission.
6. THE Login_Form SHALL provide `:focus-visible` styles on all interactive elements consistent with the design system's `--color-amber` focus ring.
7. THE Auth_Layout SHALL ensure colour contrast ratios meet WCAG 2.1 AA: normal-size text SHALL achieve at least 4.5:1 against its background; large text (≥ 18 pt or ≥ 14 pt bold) and UI components SHALL achieve at least 3:1.
8. THE Caps_Lock_Warning and inline error messages SHALL have `role="alert"` so that screen readers announce them immediately upon appearance.
9. WHEN the password field has focus, the Caps_Lock_Warning SHALL be shown or hidden based on a `keydown` event where `event.getModifierState('CapsLock')` is evaluated, ensuring detection is event-driven rather than polled.

---

### Requirement 10: Auth Footer Links

**User Story:** As a user on the login page, I want to access Privacy Policy, Terms of Service, and Contact Support links, so that I can review legal information and get help if needed.

#### Acceptance Criteria

1. THE Auth_Footer SHALL render three links: "Privacy Policy" (opens in a new tab), "Terms of Service" (opens in a new tab), and "Contact Support" (navigates to `/support` or opens a `mailto:` link).
2. THE Auth_Footer SHALL be visible below the login card on all viewport sizes.
3. THE Auth_Footer SHALL use `--color-text-muted` for the link text colour in their default state, transitioning to `--color-text-secondary` on hover; the colour transition SHALL complete within 200 ms.
4. THE Auth_Footer links SHALL be keyboard-focusable and SHALL display a `:focus-visible` ring consistent with `--color-amber`.

---

### Requirement 11: Component Architecture

**User Story:** As a developer, I want the login page broken into reusable components, so that each concern is isolated and individually testable.

#### Acceptance Criteria

1. THE Login_Form component SHALL reside at `frontend/src/components/auth/LoginForm.tsx`.
2. THE Password_Field component SHALL reside at `frontend/src/components/auth/PasswordField.tsx`.
3. THE Auth_Layout component SHALL reside at `frontend/src/components/auth/AuthLayout.tsx`.
4. THE Trust_Indicators component SHALL reside at `frontend/src/components/auth/TrustIndicators.tsx`.
5. THE Auth_Footer component SHALL reside at `frontend/src/components/auth/AuthFooter.tsx`.
6. THE Auth_Store SHALL reside at `frontend/src/stores/authStore.ts`.
7. THE login page entry point (`frontend/src/app/(auth)/login/page.tsx`) SHALL contain only import statements, component composition (JSX), and Next.js metadata exports — no API calls, validation schemas, Zustand store definitions, or event handler logic.
8. ALL component files SHALL be compiled with `"strict": true` from the project-level `tsconfig.json` and SHALL declare a named TypeScript `interface` or `type` alias for their props, referenced explicitly in the component function signature.
9. ALL five `components/auth/` component files and `authStore.ts` SHALL use named exports; the login page entry point SHALL use a default export, matching the existing codebase convention.
