# Token Limit Activation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Activate the token limit system so free users get 3 reports (~80K tokens/month) and are prompted to buy a Stripe token pack when exhausted.

**Architecture:** Four surgical edits — update PLANS constants in `stripe.ts`, flip two env flags in `.env.local`, sync the webhook `tierLimits` map with the updated PLANS values, and add a "rapor hakkın kaldı" display + correct CTA labels to `token-meter.tsx`. No new packages, no DB migrations, no model changes.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, Stripe webhooks, Supabase (subscriptions table)

---

## File Map

| File | Change |
|------|--------|
| `src/lib/stripe.ts` | Update `PLANS` token values + feature labels + add `ESTIMATED_TOKENS_PER_REPORT` |
| `.env.local` | Add `ENFORCE_TOKEN_LIMITS=true` + `NEXT_PUBLIC_ENFORCE_TOKEN_LIMITS=true` |
| `src/app/api/webhooks/stripe/route.ts` | Sync `tierLimits` map (line 66) + `subscription.deleted` fallback (line 111) |
| `src/components/token-meter.tsx` | Import constant, add rapor-count display, fix exhausted CTA label |

---

### Task 1: Update PLANS token values in `src/lib/stripe.ts`

**Files:**
- Modify: `src/lib/stripe.ts:30-52`

- [ ] **Step 1: Replace the PLANS export with corrected values**

Open `src/lib/stripe.ts`. Replace lines 30–52 (the `export const PLANS = { ... }` block) with:

```typescript
export const PLANS = {
  free: {
    name: 'Ücretsiz',
    tokens: 80000,
    price: 0,
    priceId: null,
    features: ['3 tam rapor/ay', 'Temel ülke analizi', 'Sonuçları görüntüleme'],
  },
  starter: {
    name: 'Starter',
    tokens: 250000,
    price: 29,
    priceId: STRIPE_PRICES.starter,
    features: ['10 tam rapor/ay', 'Tüm analiz aşamaları', 'PDF indirme', 'E-posta desteği'],
  },
  pro: {
    name: 'Pro',
    tokens: 500000,
    price: 79,
    priceId: STRIPE_PRICES.pro,
    features: ['Sınırsız rapor', 'Öncelikli analiz', 'Özel prompt', 'Telefon desteği', 'CSV export'],
  },
} as const
```

- [ ] **Step 2: Add ESTIMATED_TOKENS_PER_REPORT constant after the PLANS block**

After the `export type PlanTier = keyof typeof PLANS` line (currently the last line of the file), append:

```typescript
export const ESTIMATED_TOKENS_PER_REPORT = 25000
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/stripe.ts
git commit -m "feat(token-limit): update PLANS to free=80K/starter=250K/pro=500K + add ESTIMATED_TOKENS_PER_REPORT"
```

---

### Task 2: Enable token limit enforcement in `.env.local`

**Files:**
- Modify: `.env.local`

- [ ] **Step 1: Append the two env flags**

Open `.env.local` and append at the end:

```
ENFORCE_TOKEN_LIMITS=true
NEXT_PUBLIC_ENFORCE_TOKEN_LIMITS=true
```

The final `.env.local` should look like:

```
NEXT_PUBLIC_SUPABASE_URL=https://uvhtsnwwaouzqbqndjbl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

OPENROUTER_API_KEY=sk-or-v1-...

ENFORCE_TOKEN_LIMITS=true
NEXT_PUBLIC_ENFORCE_TOKEN_LIMITS=true
```

- [ ] **Step 2: Commit**

`.env.local` is git-ignored — no commit needed. Verify it's ignored:

```bash
git status .env.local
```

Expected output contains: `.env.local` is either not listed or listed as ignored.

---

### Task 3: Sync webhook tierLimits with updated PLANS

**Files:**
- Modify: `src/app/api/webhooks/stripe/route.ts:66` and `src/app/api/webhooks/stripe/route.ts:111`

- [ ] **Step 1: Update tierLimits map on line 66**

Find this line (around line 66):

```typescript
const tierLimits: Record<string, number> = { starter: 25000, pro: 100000, free: 5000 }
```

Replace with:

```typescript
const tierLimits: Record<string, number> = { starter: 250000, pro: 500000, free: 80000 }
```

Also update the fallback default on the same `upsert` call (line ~72) from `?? 25000` to `?? 250000`:

```typescript
monthly_limit_tokens: tierLimits[tier] ?? 250000,
```

- [ ] **Step 2: Update subscription.deleted fallback on line 111**

Find this block (around line 109–112):

```typescript
await (supabase.from('subscriptions') as any).update({
  plan: 'free',
  monthly_limit_tokens: 5000,
}).eq('stripe_subscription_id', sub.id)
```

Replace `monthly_limit_tokens: 5000` with `monthly_limit_tokens: 80000`:

```typescript
await (supabase.from('subscriptions') as any).update({
  plan: 'free',
  monthly_limit_tokens: 80000,
}).eq('stripe_subscription_id', sub.id)
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/webhooks/stripe/route.ts
git commit -m "fix(token-limit): sync webhook tierLimits + subscription.deleted fallback with updated PLANS"
```

---

### Task 4: Update TokenMeter — rapor hakkı display + fix CTA labels

**Files:**
- Modify: `src/components/token-meter.tsx`

- [ ] **Step 1: Add import for ESTIMATED_TOKENS_PER_REPORT**

At the top of `src/components/token-meter.tsx`, the current imports are:

```typescript
import Link from 'next/link'
import { getMonthlyUsage } from '@/lib/token'
```

Add the stripe import:

```typescript
import Link from 'next/link'
import { getMonthlyUsage } from '@/lib/token'
import { ESTIMATED_TOKENS_PER_REPORT } from '@/lib/stripe'
```

- [ ] **Step 2: Add reportsLeft calculation after the pct/isWarning/isExhausted block**

After this existing block (around line 41–43):

```typescript
const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
const isWarning = pct >= 80 && pct < 100
const isExhausted = pct >= 100
```

Add:

```typescript
const remaining = Math.max(0, limit - used)
const reportsLeft = Math.max(0, Math.floor(remaining / ESTIMATED_TOKENS_PER_REPORT))
```

- [ ] **Step 3: Add "rapor hakkın kaldı" text inside the meter pill**

Find the existing token ratio text (around line 65–67):

```tsx
<span className="text-[11px] text-white/80">
  {usedFormatted} / {limitFormatted}
</span>
```

Replace with:

```tsx
<span className="text-[11px] text-white/80">
  {isExhausted
    ? '🔥 Hakkın bitti'
    : isWarning
      ? `🔥 ~${reportsLeft} rapor hakkın kaldı`
      : `${usedFormatted} / ${limitFormatted}`}
</span>
```

- [ ] **Step 4: Fix the exhausted CTA label**

Find the Link button below (around line 76–83):

```tsx
{(isWarning || isExhausted) && (
  <Link
    href="/pricing"
    className="text-[10px] font-semibold text-white bg-amber-500 hover:bg-amber-600 px-2 py-0.5 rounded-full transition-colors"
  >
    {isExhausted ? 'Plan Yükselt' : 'Az Kaldı →'}
  </Link>
)}
```

Replace only the label string and exhausted button color:

```tsx
{(isWarning || isExhausted) && (
  <Link
    href="/pricing"
    className={`text-[10px] font-semibold text-white px-2 py-0.5 rounded-full transition-colors ${
      isExhausted
        ? 'bg-red-500 hover:bg-red-600'
        : 'bg-amber-500 hover:bg-amber-600'
    }`}
  >
    {isExhausted ? 'Token Satın Al' : 'Az Kaldı →'}
  </Link>
)}
```

- [ ] **Step 5: Type-check and build**

```bash
npx tsc --noEmit
npm run build
```

Expected: No type errors, build succeeds. Watch for any "Module not found" on the stripe import — if it appears, verify `@/lib/stripe` path alias is configured in `tsconfig.json`.

- [ ] **Step 6: Commit**

```bash
git add src/components/token-meter.tsx
git commit -m "feat(token-meter): show rapor-hakkı count + red Token Satın Al CTA on exhaustion"
```

---

## Final Verification

- [ ] **Build passes**

```bash
npm run build
```

Expected: `✓ Compiled successfully`

- [ ] **Smoke test: pilot mode is gone**

Start dev server (`npm run dev`), log in as a free user. The navbar should show the token meter in "active limit mode" (green/amber/red pill) instead of the "Pilot" badge.

- [ ] **Smoke test: warning state**

In Supabase, temporarily set a test user's `subscriptions.tokens_used` to 85% of 80000 (= 68000). Reload the app — meter should show amber "Az Kaldı →" button.

- [ ] **Smoke test: exhausted state**

Set `tokens_used` ≥ 80000. Meter should show red "Token Satın Al" button linking to `/pricing`.

- [ ] **Final commit (if any loose changes)**

```bash
git add -A
git commit -m "chore: token-limit activation complete"
```
