import { z } from 'zod'

// Tüm endpoint'lerdeki request body'leri için Zod şemaları.
// Her endpoint await schema.safeParseAsync(body) ile valide eder.
// Hata durumunda { status: 400, body: { error, issues } } döner.

const trimmedString = (min: number, max = 200) =>
  z.string().trim().min(min, `En az ${min} karakter olmalı`).max(max, `En fazla ${max} karakter olabilir`)

export const reportRequestSchema = z.object({
  product: trimmedString(2, 200),
  country: trimmedString(2, 100),
  countriesContext: z.string().max(20000).optional(),
})

export const countriesRequestSchema = z.object({
  product: trimmedString(2, 200),
})

export const positioningRequestSchema = z.object({
  reportId: z.string().uuid(),
  sections: z.array(z.string()).max(20).optional(),
})

export const leadsRequestSchema = z.object({
  reportId: z.string().uuid(),
})

export type ReportRequest = z.infer<typeof reportRequestSchema>
export type CountriesRequest = z.infer<typeof countriesRequestSchema>
export type PositioningRequest = z.infer<typeof positioningRequestSchema>
export type LeadsRequest = z.infer<typeof leadsRequestSchema>

// Standart Zod hata yanıtı.
export function zodErrorResponse(err: z.ZodError): Response {
  return new Response(
    JSON.stringify({
      error: 'VALIDATION_ERROR',
      issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  )
}
