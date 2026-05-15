'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ProductFormProps {
  defaultProduct?: string
  defaultCountry?: string
  onSubmit: (product: string, country: string) => void
  isLoading: boolean
}

export function ProductForm({ defaultProduct = '', defaultCountry = '', onSubmit, isLoading }: ProductFormProps) {
  const [product, setProduct] = useState(defaultProduct)
  const [country, setCountry] = useState(defaultCountry)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!product.trim()) return
    onSubmit(product.trim(), country.trim())
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
      </div>
      <div className="space-y-2">
        <Label htmlFor="country" className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
          Hedef ülke{' '}
          <span className="text-xs font-normal">(opsiyonel — boş bırakırsanız AI en uygun pazarı önerir)</span>
        </Label>
        <Input
          id="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="örn: Almanya, Hollanda, BAE"
          disabled={isLoading}
          style={{ borderColor: 'var(--border)' }}
        />
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
