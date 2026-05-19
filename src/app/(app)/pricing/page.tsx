import { createClient } from '@/lib/supabase/server'
import { PLANS, TOKEN_PACKS } from '@/lib/stripe'
import { createCheckoutSession, createTokenPackCheckout } from '@/actions/stripe'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { PlanTier, TokenPackSize } from '@/lib/stripe'

export const metadata: Metadata = {
  title: 'Fiyatlandırma — Netport İhracat Asistanı',
}

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let currentPlan: PlanTier = 'free'
  if (user) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .single() as { data: { plan: string } | null; error: unknown }
    if (sub?.plan && ['free', 'starter', 'pro'].includes(sub.plan)) {
      currentPlan = sub.plan as PlanTier
    }
  }

  const tiers: PlanTier[] = ['free', 'starter', 'pro']

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Fiyatlandırma</h1>
        <p className="text-gray-500">
          İhracat araştırmanızı büyütün. İhtiyacınıza uygun planı seçin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {tiers.map((tier) => {
          const plan = PLANS[tier]
          const isCurrent = currentPlan === tier

          return (
            <Card key={tier} className={tier === 'pro' ? 'border-blue-500 ring-1 ring-blue-500' : ''}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {plan.name}
                  {isCurrent && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Mevcut
                    </span>
                  )}
                </CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">
                    {plan.price === 0 ? 'Ücretsiz' : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && <span className="text-gray-400 text-sm">/ay</span>}
                </div>
                <p className="text-sm text-gray-500">{plan.tokens.toLocaleString('tr')} token/ay</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {tier === 'free' ? (
                  <Link
                    href={user ? '/dashboard' : '/register'}
                    className={buttonVariants({ variant: 'outline', className: 'w-full' })}
                  >
                    {user ? 'Dashboard\'a Git' : 'Başla'}
                  </Link>
                ) : isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Mevcut Plan
                  </Button>
                ) : user ? (
                  <form action={createCheckoutSession.bind(null, tier)} className="w-full">
                    <Button className="w-full" type="submit">
                      {tier === 'pro' ? 'Pro\'ya Geç' : 'Starter\'a Geç'}
                    </Button>
                  </form>
                ) : (
                  <Link
                    href={`/register?plan=${tier}`}
                    className={buttonVariants({ className: 'w-full' })}
                  >
                    Kayıt Ol
                  </Link>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Token Top-up Packs — tek seferlik ek token alımı */}
      <div className="border-t border-gray-200 pt-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Ek Token Paketleri
          </h2>
          <p className="text-gray-500 text-sm">
            Plan yükseltmek istemiyor musun? Tek seferlik ek token al — abonelik yok, aylık limit yerine sayılır.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {(Object.entries(TOKEN_PACKS) as [TokenPackSize, typeof TOKEN_PACKS[TokenPackSize]][]).map(([size, pack]) => {
            const hasPriceId = Boolean(pack.priceId)
            return (
              <Card key={size} className={size === 'medium' ? 'border-amber-400 ring-1 ring-amber-300' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{pack.label}</span>
                    {size === 'medium' && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        Popüler
                      </span>
                    )}
                  </CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">${pack.price}</span>
                    <span className="text-gray-400 text-sm ml-2">tek seferlik</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {pack.tokens.toLocaleString('tr')} ek token
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      Bir kerelik ödeme — abonelik yok
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      Aylık limite ek olarak kullanılabilir
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      Süresiz — kullanana kadar bekler
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  {!user ? (
                    <Link
                      href="/register"
                      className={buttonVariants({ variant: 'outline', className: 'w-full' })}
                    >
                      Giriş Yap
                    </Link>
                  ) : !hasPriceId ? (
                    <Button variant="outline" className="w-full" disabled title="Yakında">
                      Yakında
                    </Button>
                  ) : (
                    <form action={createTokenPackCheckout.bind(null, size)} className="w-full">
                      <Button className="w-full" type="submit">
                        Satın Al
                      </Button>
                    </form>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </main>
  )
}
