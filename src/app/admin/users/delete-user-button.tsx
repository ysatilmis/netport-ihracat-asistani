'use client'

import { useTransition } from 'react'
import { deleteUser } from '@/actions/admin'

export function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm(`"${userName}" kullanıcısını silmek istediğine emin misin? Bu işlem geri alınamaz.`)) return
    startTransition(async () => {
      const result = await deleteUser(userId)
      if (!result.ok) alert(`Hata: ${result.error}`)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="text-[11px] font-mono text-red-500 hover:text-red-700 hover:underline disabled:opacity-40 transition-colors"
    >
      {pending ? 'siliniyor…' : 'Sil'}
    </button>
  )
}
