'use client'

import { useActionState, useRef } from 'react'
import { updateUserCredits } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type State = { ok: boolean; error?: string } | null

function CreditFormInner({ userId, defaultCredits }: { userId: string; defaultCredits: number }) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function action(_prev: State, formData: FormData): Promise<State> {
    const raw = formData.get('credits')
    const newCredits = parseInt(raw as string, 10)
    if (isNaN(newCredits) || newCredits < 0) return { ok: false, error: 'Geçersiz değer' }
    const result = await updateUserCredits(userId, newCredits)
    return result
  }

  const [state, formAction, pending] = useActionState(action, null)

  return (
    <form action={formAction} className="flex gap-2 items-center">
      <Input
        ref={inputRef}
        name="credits"
        type="number"
        defaultValue={defaultCredits}
        className="w-20 h-9 text-sm font-mono"
        min={0}
        max={10000}
        step={1}
      />
      <span className="text-[10px] text-slate-400 font-mono">kredi</span>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? '...' : 'Set'}
      </Button>
      {state && (
        <span className={`text-[10px] font-mono ml-1 ${state.ok ? 'text-green-600' : 'text-red-500'}`}>
          {state.ok ? '✓ Kaydedildi' : (state.error ?? 'Hata')}
        </span>
      )}
    </form>
  )
}

export function CreditForm({ userId, defaultCredits }: { userId: string; defaultCredits: number }) {
  return <CreditFormInner userId={userId} defaultCredits={defaultCredits} />
}
