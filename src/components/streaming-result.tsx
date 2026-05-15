'use client'
import { useEffect, useRef } from 'react'

interface StreamingResultProps {
  text: string
  isStreaming: boolean
}

export function StreamingResult({ text, isStreaming }: StreamingResultProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [text])

  if (!text && !isStreaming) return null

  return (
    <div
      ref={ref}
      className="mt-4 p-4 bg-slate-50 rounded-lg border text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto"
    >
      {text}
      {isStreaming && <span className="animate-pulse">▌</span>}
    </div>
  )
}
