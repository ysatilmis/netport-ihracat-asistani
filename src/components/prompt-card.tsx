'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StreamingResult } from './streaming-result'
import { extractPlaceholders } from '@/lib/prompts'
import { SaveReportBtn } from './save-report-btn'

interface PromptCardProps {
  promptKey: string
  title: string
  templateText: string
  phase: number
  defaultInputs: Record<string, string>
}

export function PromptCard({ promptKey, title, templateText, phase, defaultInputs }: PromptCardProps) {
  const placeholders = extractPlaceholders(templateText)
  const [inputs, setInputs] = useState<Record<string, string>>(defaultInputs)
  const [completion, setCompletion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    setIsLoading(true)
    setCompletion('')
    setError(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptKey, inputs }),
      })

      if (res.status === 429) {
        setError('TOKEN_LIMIT_EXCEEDED')
        return
      }

      if (!res.ok) {
        try {
          const errData = await res.json() as { error: string; detail?: string }
          setError(errData.detail ? `Hata: ${errData.detail}` : 'Bir hata oluştu.')
        } catch {
          setError(`Hata (${res.status}): sunucudan yanıt alınamadı.`)
        }
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setCompletion((prev) => prev + chunk)
      }
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {placeholders.map((placeholder) => (
          <div key={placeholder} className="space-y-1">
            <Label htmlFor={`${promptKey}-${placeholder}`} className="text-xs capitalize text-slate-600">
              {placeholder}
            </Label>
            <Input
              id={`${promptKey}-${placeholder}`}
              value={inputs[placeholder] ?? ''}
              onChange={(e) => setInputs((prev) => ({ ...prev, [placeholder]: e.target.value }))}
              placeholder={`${placeholder} girin...`}
              className="h-8 text-sm"
            />
          </div>
        ))}

        <Button
          onClick={handleAnalyze}
          disabled={isLoading}
          size="sm"
          className="w-full"
        >
          {isLoading ? 'Analiz ediliyor...' : 'Analiz Et'}
        </Button>

        {error === 'TOKEN_LIMIT_EXCEEDED' && (
          <p className="text-sm text-red-600 font-medium">
            Bu ay token limitiniz doldu.
          </p>
        )}
        {error && error !== 'TOKEN_LIMIT_EXCEEDED' && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <StreamingResult text={completion} isStreaming={isLoading} />

        {completion && !isLoading && (
          <SaveReportBtn
            phase={phase}
            promptKey={promptKey}
            inputs={inputs}
            outputText={completion}
          />
        )}
      </CardContent>
    </Card>
  )
}
