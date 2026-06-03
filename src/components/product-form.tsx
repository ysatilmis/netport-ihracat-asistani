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
    </form>
  )
}
