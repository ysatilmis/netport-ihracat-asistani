'use client'
import { signUp } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useActionState } from 'react'

export default function RegisterPage() {
  const [state, action, pending] = useActionState(signUp, undefined)

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Ad Soyad</Label>
        <Input id="full_name" name="full_name" required placeholder="Yüksel Hanım" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" name="email" type="email" required placeholder="ornek@firma.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Şifre (min 6 karakter)</Label>
        <Input id="password" name="password" type="password" required minLength={6} />
      </div>
      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Hesap oluşturuluyor...' : 'Hesap Oluştur'}
      </Button>
      <p className="text-center text-sm text-slate-500">
        Zaten hesabın var mı? <Link href="/login" className="text-blue-600 hover:underline">Giriş yap</Link>
      </p>
    </form>
  )
}
