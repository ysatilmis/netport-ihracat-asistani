import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // iyzipay (Iyzico SDK) dynamic require() ile resource loading yapıyor —
  // Turbopack statik analizi başarısız oluyor. serverExternalPackages ile
  // bundle'dan dışarıda tut, runtime'da Node'un require'ı kullansın.
  serverExternalPackages: ['iyzipay'],
}

export default nextConfig
