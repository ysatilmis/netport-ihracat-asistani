import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Hata mesajlarından API key, token ve hassas URL'leri temizler.
 * Hedef: OpenRouter URL'leri (içinde ?apiKey= veya key= query param olan),
 * 32+ karakter hex/api token'ları, Bearer header'ları.
 */
export function sanitizeError(message: string): string {
  if (!message) return message
  let cleaned = message

  // 1. OpenRouter URL'lerindeki API key query param'ı: https://...openrouter.ai/...?apiKey=sk-or-...
  //    veya ?key=... gibi varyasyonlar
  cleaned = cleaned.replace(
    /(https?:\/\/[^\s]*[?&](?:api[_-]?key|key|token|auth)=)([^&\s]+)/gi,
    (_full, prefix, _value) => `${prefix}REDACTED`,
  )

  // 2. sk-or-v1- prefiksli OpenRouter key'leri
  cleaned = cleaned.replace(/sk-or-v1-[a-zA-Z0-9]{32,}/g, 'sk-or-v1-REDACTED')

  // 3. 40+ karakter hex string'ler (standalone API key'ler)
  cleaned = cleaned.replace(/\b[a-f0-9]{40,}\b/gi, 'REDACTED')

  // 4. Bearer token header'ları
  cleaned = cleaned.replace(/(bearer\s+)[a-zA-Z0-9._-]{20,}/gi, '$1REDACTED')

  // 5. Authorization header satırları
  cleaned = cleaned.replace(/(authorization:\s*)[^\n]+/gi, '$1REDACTED')

  return cleaned
}
