'use client'

import { useState, useTransition } from 'react'
import { submitFeedback } from '@/actions/feedback'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function FeedbackForm() {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [message, setMessage] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await submitFeedback(rating, message)
      if (result.ok) {
        setDone(true)
      } else {
        setError(result.error)
      }
    })
  }

  if (done) {
    return (
      <div className="text-center py-10">
        <div className="text-4xl mb-4">🙏</div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Teşekkürler!</h2>
        <p className="text-slate-500 text-sm">Geri bildirimin iletildi. Görüşlerin ürünümüzü geliştirmemize yardımcı oluyor.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Yıldız rating */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Genel deneyiminizi puanlayın
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="text-3xl transition-transform hover:scale-110 focus:outline-none"
              aria-label={`${star} yıldız`}
            >
              <span className={(hovered || rating) >= star ? 'text-amber-400' : 'text-slate-200'}>
                ★
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Mesaj */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
          Görüşleriniz
        </label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ürün hakkında düşüncelerinizi paylaşın — ne beğendiniz, ne eksik gördünüz?"
          rows={5}
          maxLength={1000}
          required
          className="resize-none"
        />
        <p className="text-xs text-slate-400 mt-1 text-right">{message.length}/1000</p>
      </div>

      {error && (
        <p className="text-sm text-red-500 font-mono">{error}</p>
      )}

      <Button
        type="submit"
        disabled={pending || rating === 0 || message.trim().length < 10}
        className="w-full"
      >
        {pending ? 'Gönderiliyor…' : 'Geri Bildirimi Gönder'}
      </Button>
    </form>
  )
}
