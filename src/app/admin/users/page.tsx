import { getAllUsersDetailed, updateUserLimit } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function AdminUsersPage() {
  const users = await getAllUsersDetailed()

  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <div className="text-xs font-mono uppercase tracking-wider text-[var(--accent-strong)] font-bold mb-2">
          Admin · Users
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Kullanıcılar</h1>
        <p className="text-sm text-slate-500 mt-1 font-mono">
          {users.length} kayıt · paket alanlar + rapor sayıları
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 text-left">Kullanıcı</th>
                <th className="px-5 py-3 text-left">Plan</th>
                <th className="px-5 py-3 text-left">Ek Paket</th>
                <th className="px-5 py-3 text-left">Rapor</th>
                <th className="px-5 py-3 text-left">Ödeme</th>
                <th className="px-5 py-3 text-left">Limit Güncelle</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserRow key={u.id} user={u} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function UserRow({ user }: {
  user: {
    id: string
    email: string
    full_name: string | null
    role: string
    created_at: string
    sub: {
      plan: string
      monthly_limit_tokens: number
      extra_tokens: number
      current_period_start: string
      current_period_end: string
    } | null
    reportCount: number
    paymentCount: number
    paymentTotal: number
  }
}) {
  const sub = user.sub
  const plan = sub?.plan ?? 'free'
  const extraPacks = sub?.extra_tokens ?? 0

  async function handleUpdate(formData: FormData) {
    'use server'
    const newLimit = parseInt(formData.get('limit') as string)
    if (!isNaN(newLimit) && newLimit > 0) {
      await updateUserLimit(user.id, newLimit)
    }
  }

  return (
    <tr className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors">
      <td className="px-5 py-4">
        <div className="font-semibold text-slate-900">{user.full_name ?? user.email}</div>
        <div className="text-slate-500 text-xs font-mono mt-0.5">{user.email}</div>
        <div className="flex gap-1.5 mt-1.5">
          {user.role === 'admin' && (
            <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-wider">admin</Badge>
          )}
          <span className="text-[10px] text-slate-400 font-mono">{formatDate(user.created_at)}</span>
        </div>
      </td>
      <td className="px-5 py-4">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${
          plan === 'pro' ? 'bg-[var(--p4-bg)] text-[var(--p4-fg)] border-[var(--p4-line)]' :
          plan === 'starter' ? 'bg-[var(--p1-bg)] text-[var(--p1-fg)] border-[var(--p1-line)]' :
          'bg-slate-50 text-slate-600 border-slate-200'
        }`}>
          {plan}
        </span>
        {sub && (
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            {formatDate(sub.current_period_start)} — {formatDate(sub.current_period_end)}
          </div>
        )}
      </td>
      <td className="px-5 py-4">
        {extraPacks > 0 ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-green-50 text-green-700 border border-green-200">
            +{extraPacks} rapor
          </span>
        ) : (
          <span className="text-xs text-slate-400 font-mono">—</span>
        )}
      </td>
      <td className="px-5 py-4">
        <span className="font-mono tabular-nums text-slate-700">{user.reportCount}</span>
      </td>
      <td className="px-5 py-4">
        {user.paymentCount > 0 ? (
          <div>
            <span className="font-mono tabular-nums text-slate-700">{user.paymentCount} ödeme</span>
            <div className="text-xs font-semibold text-green-700 font-mono">₺{user.paymentTotal.toLocaleString('tr-TR')}</div>
          </div>
        ) : (
          <span className="text-xs text-slate-400 font-mono">—</span>
        )}
      </td>
      <td className="px-5 py-4">
        <form action={handleUpdate} className="flex gap-2">
          <Input
            name="limit"
            type="number"
            defaultValue={sub?.monthly_limit_tokens ?? 5000}
            className="w-28 h-9 text-sm font-mono"
            min={1000}
            step={1000}
          />
          <Button type="submit" size="sm" variant="outline">Güncelle</Button>
        </form>
      </td>
    </tr>
  )
}
