# FEATURE: Password Authentication

**Status**: Completed
**Priority**: P1 (Critical - Security/Authentication)
**Estimated Time**: 2-3 hours
**Dependencies**: Supabase Auth setup
**Business Impact**: Essential authentication method for user access control

**Purpose**: Implement standard password-based authentication alongside magic link authentication, providing users with multiple secure login options

---

## 📋 **Requirements**

### Authentication Functionality

- Sign up with email and password
- Sign in with email and password
- Toggle between password and magic link modes
- Email confirmation for new accounts
- Secure password requirements (minimum 6 characters)
- Clear error messaging for auth failures
- Automatic redirect on successful login

### User Experience Requirements

- Unified login/signup interface
- Toggle between sign in and sign up modes
- Switch between password and magic link authentication
- Responsive design (mobile-first)
- Loading states for async operations
- Toast notifications for user feedback
- No "Continue as Guest" option (removed)

### Security Requirements

- Password validation (min 6 characters)
- Supabase Auth security features
- HTTPS-only in production
- CSRF protection via Supabase
- Secure session management
- Proper redirect URL configuration

---

## 🎯 **Success Criteria**

1. Users can sign up with email and password
2. Users can sign in with existing credentials
3. Email confirmation sent on signup
4. Magic link authentication still works
5. Users can toggle between auth modes seamlessly
6. All authentication flows properly redirect
7. Guest access is completely removed
8. Tests pass with ≥90% coverage
9. No security vulnerabilities

---

## 📐 **Technical Implementation**

### Authentication Modes

The login page supports two authentication modes:

1. **Password Mode** (default)
   - Email + password input fields
   - Sign in / Sign up toggle
   - Supabase `signInWithPassword()` and `signUp()`

2. **Magic Link Mode**
   - Email-only input field
   - Supabase `signInWithOtp()`
   - Email confirmation required

### Files Modified

```
app/auth/login/page.tsx              # Main login UI with dual auth modes
app/auth/callback/route.ts           # OAuth callback handler (unchanged)
.env.local                           # NEXT_PUBLIC_SITE_URL for redirects
```

### Key Code Patterns

#### Password Authentication

```tsx
const { error } = await supabase.auth.signInWithPassword({
  email,
  password,
})
```

#### Sign Up with Password

```tsx
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  },
})
```

#### Magic Link Authentication

```tsx
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  },
})
```

### State Management

```tsx
type AuthMode = 'password' | 'magic-link'

const [authMode, setAuthMode] = useState<AuthMode>('password')
const [isSignUp, setIsSignUp] = useState(false)
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
```

---

## 🧪 **Test Requirements**

### Unit Tests

- Password validation
- Form submission handlers
- State management (authMode, isSignUp)
- Error handling for auth failures
- Toast notification triggers

### Integration Tests

- Full signup flow with password
- Full signin flow with password
- Magic link flow (existing)
- Email confirmation process
- Redirect behavior after auth
- Toggle between auth modes

### E2E Tests

- User flow: Create account → Confirm email → Login
- User flow: Existing user login
- User flow: Switch to magic link → Receive email
- Error scenarios (wrong password, invalid email, etc.)

---

## 🔐 **Security Considerations**

### Password Requirements

- Minimum 6 characters (Supabase default)
- Consider adding complexity requirements in future
- Password field uses `type="password"` for masking
- No client-side password storage

### URL Configuration

- Fixed magic link redirect using `NEXT_PUBLIC_SITE_URL`
- Prevents localhost URLs in production emails
- Falls back to `window.location.origin` in development

### Supabase Security Features

- Built-in rate limiting
- Email verification required for signup
- Secure session cookies
- PKCE flow for OAuth
- Row Level Security (RLS) for database access

---

## 📊 **Phase Breakdown**

### Phase 1: Fix Magic Link Redirects ✅

1. Update redirect URL configuration
2. Use `NEXT_PUBLIC_SITE_URL` environment variable
3. Test magic link in production context

### Phase 2: Remove Guest Access ✅

1. Remove "Continue as Guest" button
2. Remove guest handler function
3. Update UI layout (removed CardFooter)

### Phase 3: Add Password Authentication ✅

1. Add password input field
2. Implement sign in with password
3. Implement sign up with password
4. Add auth mode toggle
5. Add sign in/sign up toggle

### Phase 4: Polish & Testing ⏳

1. Update existing tests
2. Add new test cases for password auth
3. Verify email confirmation flow
4. Test error scenarios
5. Update documentation

---

## 🚨 **Risk Mitigation**

- **Risk**: Users forget passwords
  - **Mitigation**: Keep magic link option available, add password reset in future

- **Risk**: Weak passwords
  - **Mitigation**: Enforce minimum 6 characters, consider strength indicator in future

- **Risk**: Email deliverability issues
  - **Mitigation**: Use Supabase's built-in email service, configure custom SMTP in production

- **Risk**: Redirect URL misconfiguration
  - **Mitigation**: Use environment variable with fallback, validate in tests

---

## 📝 **Implementation Notes**

### UI/UX Decisions

1. **Password mode as default**: Most users expect traditional login
2. **Unified form**: Single form adapts to auth mode, reduces complexity
3. **Clear toggles**: Users can easily switch between modes and actions
4. **No guest access**: Forces account creation for better user tracking and security

### Environment Variables

```bash
# Required for proper email redirects
NEXT_PUBLIC_SITE_URL=https://yourdomain.com  # Production
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # Development
```

### Supabase Configuration

Ensure your Supabase project has:

- Email authentication enabled
- Email confirmation required (recommended)
- Password authentication enabled
- Proper site URL configured in Supabase dashboard

---

## 🔄 **Migration from Guest System**

### Changes Made

- ✅ Removed guest button from login page
- ✅ Removed `handleGuestStart()` function
- ⏳ Guest-related features may need cleanup in other areas

### Future Considerations

- Add password reset flow (forgot password)
- Add password strength indicator
- Add OAuth providers (Google, GitHub, etc.)
- Add session management UI (view active sessions)
- Add two-factor authentication (2FA)

---

## 🎬 **Next Steps**

### Immediate

1. Update tests in `__tests__/unit/app/auth/login/page.test.tsx`
2. Add integration tests for password flows
3. Verify email confirmation process works
4. Test in production-like environment

### Future Enhancements

1. Password reset functionality
2. Password strength validation
3. OAuth providers integration
4. Account settings page
5. Two-factor authentication

---

## 📚 **Related Documentation**

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [CLAUDE.md](../../CLAUDE.md) - Project development guide
- [ARCHITECTURE.md](../ARCHITECTURE.md) - System architecture

---

**Created**: 2025-10-29
**Last Updated**: 2025-10-29
**Version**: 1.0
