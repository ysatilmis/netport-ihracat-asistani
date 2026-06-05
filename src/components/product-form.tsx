'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ProductFormProps {
  defaultProduct?: string
  onSubmit: (product: string) => void
  isLoading: boolean
}

function needsConfirmation(product: string): boolean {
  const trimmed = product.trim()
  if (trimmed.length < 4) return true
  if (/^\d+$/.test(trimmed)) return true
  // Single word without space and short → might be incomplete
  if (trimmed.length <= 15 && !trimmed.includes(' ')) return true
  return false
}

export function ProductForm({ defaultProduct = '', onSubmit, isLoading }: ProductFormProps) {
  const [product, setProduct] = useState(defaultProduct)
  const [pendingConfirm, setPendingConfirm] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = product.trim()
    if (!trimmed) return
    if (needsConfirmation(trimmed)) {
      setPendingConfirm(trimmed)
    } else {
      onSubmit(trimmed)
    }
  }

  const handleConfirm = () => {
    if (pendingConfirm) {
      onSubmit(pendingConfirm)
      setPendingConfirm(null)
    }
  }

  const handleEdit = () => {
    setPendingConfirm(null)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div
        className="rounded-xl p-5"
        style={{
          backgroundColor: '#FFF7ED',
          borderLeft: '3px solid var(--accent)',
        }}
      >
        <p className="text-lg font-bold leading-relaxed" style={{ color: 'var(--foreground)' }}>
          <span style={{ color: 'var(--primary)' }}>[Ürün adı]</span> için en uygun 3 ihracat pazarını öner.
        </p>
        <p className="mt-2 text-base leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          Pazar büyüklüğünü ve neden uygun olduğunu kısaca açıkla.
        </p>
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="product" className="text-base font-medium" style={{ color: 'var(--foreground)' }}>
          İhraç etmek istediğiniz ürün
        </Label>
        <Input
          id="product"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          placeholder="örn: el yapımı seramik, organik zeytinyağı, deri çanta"
          required
          disabled={isLoading}
          className="text-base rounded-xl bg-white border-2 border-slate-200 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)', height: '3.5rem', minHeight: '3.5rem' }}
        />
        <p className="text-base leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          AI, pazar büyüklüğü ve uygunluk gerekçesini birlikte sunarak en iyi 3 hedef pazarı önerir. Sen seçtiğinde o ülke için 10 bölümlük zincirleme analiz üretilir.
        </p>
      </div>
      <Button
        type="submit"
        disabled={isLoading || !product.trim()}
        className="w-full text-white font-semibold text-lg rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
        style={{
          backgroundColor: isLoading ? 'var(--muted-foreground)' : 'var(--netport-green)',
          height: '3.5rem',
          minHeight: '3.5rem',
        }}
      >
        {isLoading ? 'Rapor oluşturuluyor...' : '🚀 Tam İhracat Raporu Oluştur'}
      </Button>

      {/* Onay dialogu */}
      {pendingConfirm && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900 mb-1">
            📦 &quot;{pendingConfirm}&quot; ürününü araştırmak istediğinizden emin misiniz?
          </p>
          <p className="text-xs text-amber-700 mb-3">
            Daha spesifik ürün adı daha iyi sonuç verir.<br />
            Örn: &quot;zeytinyağı&quot; yerine &quot;sızma organik zeytinyağı 500ml&quot;
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleConfirm}
              className="flex-1 text-sm font-semibold text-white rounded-xl"
              style={{ backgroundColor: 'var(--netport-green)' }}
            >
              ✓ Evet, devam et
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleEdit}
              className="flex-1 text-sm rounded-xl border-amber-300 text-amber-800 hover:bg-amber-100"
            >
              ✗ Düzelt
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}
