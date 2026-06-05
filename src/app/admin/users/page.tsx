import { getAllUsersDetailed } from '@/actions/admin'
import { Badge } from '@/components/ui/badge'
import { CreditForm } from './credit-form'
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
        {/* Desktop tablo */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 text-left">Kullanıcı</th>
                <th className="px-5 py-3 text-left">Plan</th>
                <th className="px-5 py-3 text-left">Ek Paket</th>
                <th className="px-5 py-3 text-left">Rapor</th>
                <th className="px-5 py-3 text-left">Kredi</th>
                <th className="px-5 py-3 text-left">Ödeme</th>
                <th className="px-5 py-3 text-left">Kredi Güncelle</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserRow key={u.id} user={u} />
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobil kart listesi */}
        <div className="md:hidden divide-y divide-slate-100">
          {users.map((u) => <UserCard key={u.id} user={u} />)}
        </div>
      </div>
    </div>
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

type UserData = Awaited<ReturnType<typeof getAllUsersDetailed>>[number]

function UserRow({ user }: { user: UserData }) {
  const sub = user.sub
  const plan = sub?.plan ?? 'free'
  const extraPacks = sub?.extra_tokens ?? 0

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
        <span className={`font-mono tabular-nums text-sm font-semibold ${user.credits === 0 ? 'text-red-500' : user.credits === 1 ? 'text-amber-600' : 'text-green-700'}`}>
          {user.credits}
        </span>
        <div className="text-[10px] text-slate-400 font-mono">kredi</div>
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
        <CreditForm userId={user.id} defaultCredits={user.credits} />
      </td>
    </tr>
  )
}

function UserCard({ user }: { user: UserData }) {
  const sub = user.sub
  const plan = sub?.plan ?? 'free'
  const extraPacks = sub?.extra_tokens ?? 0

  return (
    <div className="px-4 py-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-slate-900 text-sm">{user.full_name ?? user.email}</div>
          <div className="text-xs text-slate-500 font-mono break-all">{user.email}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{formatDate(user.created_at)}</div>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium border shrink-0 ${
          plan === 'pro' ? 'bg-[var(--p4-bg)] text-[var(--p4-fg)] border-[var(--p4-line)]' :
          plan === 'starter' ? 'bg-[var(--p1-bg)] text-[var(--p1-fg)] border-[var(--p1-line)]' :
          'bg-slate-50 text-slate-600 border-slate-200'
        }`}>{plan}</span>
      </div>
      <div className="flex flex-wrap gap-3 text-xs font-mono text-slate-600">
        <span>Rapor: <strong>{user.reportCount}</strong></span>
        <span className={user.credits === 0 ? 'text-red-500 font-semibold' : user.credits === 1 ? 'text-amber-600 font-semibold' : 'text-green-700 font-semibold'}>
          Kredi: {user.credits}
        </span>
        {extraPacks > 0 && <span className="text-green-700">+{extraPacks} ek paket</span>}
        {user.paymentCount > 0 && <span>{user.paymentCount} ödeme · ₺{user.paymentTotal.toLocaleString('tr-TR')}</span>}
      </div>
      <CreditForm userId={user.id} defaultCredits={user.credits} />
    </div>
  )
}
