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

export function ProductForm({ defaultProduct = '', onSubmit, isLoading }: ProductFormProps) {
  const [product, setProduct] = useState(defaultProduct)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!product.trim()) return
    onSubmit(product.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div
        className="rounded-xl border p-4"
        style={{
          backgroundColor: 'var(--accent-soft, #f1f5fb)',
          borderColor: 'var(--border)',
        }}
      >
        <p className="text-base font-semibold leading-snug" style={{ color: 'var(--foreground)' }}>
          <span style={{ color: 'var(--primary)' }}>[Ürün adı]</span> için en uygun 3 ihracat pazarını öner.
        </p>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Pazar büyüklüğünü ve neden uygun olduğunu kısaca açıkla.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="product" className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          İhraç etmek istediğiniz ürün
        </Label>
        <Input
          id="product"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          placeholder="örn: el yapımı seramik, organik zeytinyağı, deri çanta"
          required
          disabled={isLoading}
          className="text-base rounded-xl shadow-sm"
          style={{ borderColor: 'var(--border)' }}
        />
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          AI, pazar büyüklüğü ve uygunluk gerekçesini birlikte sunarak en iyi 3 hedef pazarı önerir. Sen seçtiğinde o ülke için 10 bölümlük zincirleme analiz üretilir.
        </p>
      </div>
      <Button
        type="submit"
        disabled={isLoading || !product.trim()}
        className="w-full text-white font-semibold py-3 text-base rounded-xl shadow-sm hover:opacity-90 transition-opacity"
        style={{ backgroundColor: isLoading ? 'var(--muted-foreground)' : 'var(--primary)' }}
      >
        {isLoading ? 'Rapor oluşturuluyor...' : '🚀 Tam İhracat Raporu Oluştur'}
      </Button>
    </form>
  )
}
