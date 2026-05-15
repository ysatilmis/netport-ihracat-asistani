import { getAllUsersWithUsage, updateUserLimit } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default async function AdminUsersPage() {
  const users = await getAllUsersWithUsage()

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Kullanıcılar ({users.length})
      </h1>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Kullanıcı</th>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-left">Bu Ay Kullanım</th>
              <th className="px-4 py-3 text-left">Limit</th>
              <th className="px-4 py-3 text-left">Limit Güncelle</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <UserRow key={u.id} user={u} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function UserRow({ user }: {
  user: {
    id: string
    email: string
    full_name: string | null
    role: string
    created_at: string
    periodUsage: number
    sub?: {
      plan: string
      monthly_limit_tokens: number
      current_period_start: string
      current_period_end: string
    }
  }
}) {
  const limit = user.sub?.monthly_limit_tokens ?? 5000
  const isOverLimit = user.periodUsage >= limit

  async function handleUpdate(formData: FormData) {
    'use server'
    const newLimit = parseInt(formData.get('limit') as string)
    if (!isNaN(newLimit) && newLimit > 0) {
      await updateUserLimit(user.id, newLimit)
    }
  }

  return (
    <tr>
      <td className="px-4 py-3">
        <div className="font-medium">{user.full_name ?? user.email}</div>
        <div className="text-slate-400 text-xs">{user.email}</div>
        {user.role === 'admin' && <Badge variant="secondary" className="text-xs mt-1">admin</Badge>}
      </td>
      <td className="px-4 py-3 text-slate-600">{user.sub?.plan ?? 'free'}</td>
      <td className="px-4 py-3">
        <span className={isOverLimit ? 'text-red-600 font-medium' : ''}>
          {user.periodUsage.toLocaleString('tr-TR')}
        </span>
      </td>
      <td className="px-4 py-3 text-slate-600">
        {limit.toLocaleString('tr-TR')}
      </td>
      <td className="px-4 py-3">
        <form action={handleUpdate} className="flex gap-2">
          <Input
            name="limit"
            type="number"
            defaultValue={limit}
            className="w-28 h-8 text-sm"
            min={1000}
            step={1000}
          />
          <Button type="submit" size="sm" variant="outline">Güncelle</Button>
        </form>
      </td>
    </tr>
  )
}
