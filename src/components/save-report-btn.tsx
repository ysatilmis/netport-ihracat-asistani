'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { saveReport } from '@/actions/reports'

interface SaveReportBtnProps {
  phase: number
  promptKey: string
  inputs: Record<string, string>
  outputText: string
}

export function SaveReportBtn({ phase, promptKey, inputs, outputText }: SaveReportBtnProps) {
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    await saveReport({ phase, promptKey, input_json: inputs, output_text: outputText })
    setSaved(true)
  }

  if (saved) return <p className="text-sm text-green-600">✓ Kaydedildi</p>

  return (
    <Button variant="outline" size="sm" onClick={handleSave} className="w-full">
      Kaydet
    </Button>
  )
}
