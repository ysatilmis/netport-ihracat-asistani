# Forgot Password Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete forgot-password / reset-password flow using Supabase Auth's built-in `resetPasswordForEmail` + `updateUser` APIs, matching the existing auth UI style.

**Architecture:** User clicks "Şifremi Unuttum" on the login page → enters email → Supabase sends a reset link → link opens `/auth/reset-password` callback that exchanges the token → user is redirected to `/reset-password` page to enter a new password → on success redirects to `/dashboard`.

**Tech Stack:** Next.js 15 App Router, Supabase Auth (`@supabase/ssr`), Server Actions (`'use server'`), `useActionState`, Tailwind CSS, existing CSS variables (`--primary`, `--accent`)

---

## File Map

| Action | File |
|--------|------|
| Create | `src/actions/auth.ts` — add `requestPasswordReset` and `updatePassword` server actions |
| Create | `src/app/(auth)/forgot-password/page.tsx` — email input form |
| Create | `src/app/(auth)/reset-password/page.tsx` — new password form |
| Modify | `src/app/auth/callback/route.ts` — handle `type=recovery` redirects |
| Modify | `src/app/(auth)/login/page.tsx` — add "Şifremi Unuttum" link |
| Modify | `middleware.ts` — whitelist `/forgot-password` and `/reset-password` as public routes |

---

## Task 1: Add server actions for password reset

**Files:**
- Modify: `src/actions/auth.ts`

- [ ] **Step 1: Add `requestPasswordReset` action to `src/actions/auth.ts`**

Append after the `signOut` function:

```typescript
export async function requestPasswordReset(_prevState: unknown, formData: FormData) {
  const email = formData.get('email')
  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return { error: 'Geçerli bir e-posta adresi girin.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://netportai.com'}/auth/callback?type=recovery`,
  })

  // Always return success to prevent email enumeration
  if (error) {
    console.error('[auth] resetPasswordForEmail error:', error.message)
  }

  return { success: true }
}

export async function updatePassword(_prevState: unknown, formData: FormData) {
  const password = formData.get('password')
  const confirm = formData.get('confirm_password')

  if (!password || typeof password !== 'string' || password.length < 6) {
    return { error: 'Şifre en az 6 karakter olmalı.' }
  }
  if (password !== confirm) {
    return { error: 'Şifreler eşleşmiyor.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    return { error: 'Şifre güncellenemedi. Lütfen tekrar şifre sıfırlama isteği gönderin.' }
  }

  redirect('/dashboard')
}
```

- [ ] **Step 2: Verify the file compiles (no TypeScript errors)**

```bash
cd C:\UMUT\netport-ihracat-asistani && npx tsc --noEmit --project tsconfig.json 2>&1 | head -30
```

Expected: No errors related to `auth.ts`

- [ ] **Step 3: Commit**

```bash
git add src/actions/auth.ts
git commit -m "feat(auth): add requestPasswordReset and updatePassword server actions"
```

---

## Task 2: Forgot-password page (email form)

**Files:**
- Create: `src/app/(auth)/forgot-password/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
// src/app/(auth)/forgot-password/page.tsx
'use client'
import { requestPasswordReset } from '@/actions/auth'
import Link from 'next/link'
import { useActionState } from 'react'

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined)

  if (state?.success) {
    return (
      <div className="w-full text-center">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-2">
          Mail gönderildi
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-3">
          Şifre sıfırlama linki gönderildi.
        </h2>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 mb-6">
          <span className="text-3xl">📧</span>
        </div>
        <p className="text-slate-600 text-sm sm:text-base mb-2 max-w-md mx-auto leading-relaxed">
          E-posta adresine bir şifre sıfırlama linki gönderdik.
        </p>
        <p className="text-slate-500 text-sm mb-8 max-w-md mx-auto leading-relaxed">
          Mail gelmezse spam klasörünü kontrol et. Link 1 saat geçerlidir.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          Giriş sayfasına dön
          <span aria-hidden>→</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">
        Şifre sıfırla
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-1.5">
        Şifreni mi unuttun?
      </h2>
      <p className="text-slate-500 text-sm sm:text-base mb-8">
        E-posta adresini gir, sana sıfırlama linki gönderelim.
      </p>

      <form action={action} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            E-posta
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="ornek@firma.com"
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15 transition-all"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          {pending ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
        </button>

        <p className="text-center text-sm text-slate-500">
          Şifreni hatırladın mı?{' '}
          <Link href="/login" className="font-medium text-[var(--primary)] hover:underline">
            Giriş yap
          </Link>
        </p>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(auth)/forgot-password/page.tsx
git commit -m "feat(auth): add forgot-password page with email form"
```

---

## Task 3: Reset-password page (new password form)

**Files:**
- Create: `src/app/(auth)/reset-password/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
// src/app/(auth)/reset-password/page.tsx
'use client'
import { updatePassword } from '@/actions/auth'
import { useActionState } from 'react'

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState(updatePassword, undefined)

  return (
    <div className="w-full">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">
        Yeni şifre
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-1.5">
        Yeni şifreni belirle.
      </h2>
      <p className="text-slate-500 text-sm sm:text-base mb-8">
        En az 6 karakter olmalı.
      </p>

      <form action={action} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Yeni Şifre <span className="text-slate-400 font-normal">(min 6 karakter)</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirm_password" className="block text-sm font-medium text-slate-700">
            Şifre Tekrar
          </label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            required
            minLength={6}
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15 transition-all"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          {pending ? 'Kaydediliyor...' : 'Şifremi Güncelle'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(auth)/reset-password/page.tsx
git commit -m "feat(auth): add reset-password page with new password form"
```

---

## Task 4: Update auth/callback to handle recovery tokens

**Files:**
- Modify: `src/app/auth/callback/route.ts`

- [ ] **Step 1: Read current file and update**

Replace the entire contents of `src/app/auth/callback/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }
      return NextResponse.redirect(`${origin}${next ?? '/login?confirmed=1'}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd C:\UMUT\netport-ihracat-asistani && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/auth/callback/route.ts
git commit -m "feat(auth): handle recovery type in auth callback — redirect to /reset-password"
```

---

## Task 5: Add "Şifremi Unuttum" link to login page

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Add the link below the password label**

In `src/app/(auth)/login/page.tsx`, find the block:

```tsx
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Şifre
            </label>
          </div>
```

Replace with:

```tsx
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Şifre
            </label>
            <Link href="/forgot-password" className="text-xs text-[var(--primary)] hover:underline">
              Şifremi unuttum
            </Link>
          </div>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(auth)/login/page.tsx
git commit -m "feat(auth): add forgot-password link to login page"
```

---

## Task 6: Whitelist new routes in middleware

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Update the unauthenticated route check**

In `middleware.ts`, find:

```typescript
  if (!user && !path.startsWith('/login') && !path.startsWith('/register') && path !== '/admin/login') {
```

Replace with:

```typescript
  if (
    !user &&
    !path.startsWith('/login') &&
    !path.startsWith('/register') &&
    !path.startsWith('/forgot-password') &&
    !path.startsWith('/reset-password') &&
    path !== '/admin/login'
  ) {
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd C:\UMUT\netport-ihracat-asistani && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat(auth): whitelist /forgot-password and /reset-password as public routes"
```

---

## Task 7: Manual end-to-end test

- [ ] **Step 1: Start dev server**

```bash
cd C:\UMUT\netport-ihracat-asistani && npm run dev
```

- [ ] **Step 2: Test the full flow**

1. Go to `http://localhost:3000/login`
2. Verify "Şifremi unuttum" link is visible next to the password label
3. Click the link → should land on `/forgot-password`
4. Enter a valid email (e.g. `umutsahinkaya1@gmail.com`) → click submit
5. Verify success screen appears ("Mail gönderildi")
6. Check email inbox for reset link
7. Click the reset link → should redirect to `/reset-password`
8. Enter new password + confirm → click "Şifremi Güncelle"
9. Should redirect to `/dashboard`
10. Verify new password works by signing out and logging in again

- [ ] **Step 3: Test edge cases**

- Enter an invalid email on `/forgot-password` → error message shown
- Enter mismatched passwords on `/reset-password` → error message shown
- Enter password < 6 chars on `/reset-password` → error message shown
- Navigate directly to `/forgot-password` without being logged in → page loads (not redirected)
- Navigate directly to `/reset-password` without a valid recovery session → Supabase returns error → error message shown

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -p
git commit -m "fix(auth): address issues found in e2e test"
```
