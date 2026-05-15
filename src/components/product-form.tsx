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
    <form onSubmit={handleSubmit} className="space-y-4">
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
          className="text-base"
          style={{ borderColor: 'var(--border)' }}
        />
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          AI en uygun 3 hedef pazarı bulup birinci öncelikli ülkeyle tüm raporu zincirleme üretir. Sen sadece ürünü yaz.
        </p>
      </div>
      <Button
        type="submit"
        disabled={isLoading || !product.trim()}
        className="w-full text-white font-semibold py-3 text-base"
        style={{ backgroundColor: isLoading ? 'var(--muted-foreground)' : 'var(--primary)' }}
      >
        {isLoading ? 'Rapor oluşturuluyor...' : '🚀 Tam İhracat Raporu Oluştur'}
      </Button>
    </form>
  )
}
