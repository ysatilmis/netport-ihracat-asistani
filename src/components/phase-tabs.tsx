'use client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PromptCard } from './prompt-card'
import type { Database } from '@/lib/supabase/types'

type PromptTemplate = Database['public']['Tables']['prompt_templates']['Row']

interface PhaseTabsProps {
  templates: PromptTemplate[]
  defaultInputs: { ürün: string; ülke: string }
}

const PHASE_LABELS = {
  1: { label: 'Araştırma & Hazırlık', emoji: '🔍' },
  2: { label: 'Konumlandırma', emoji: '🎯' },
  3: { label: 'İlk Temas', emoji: '🤝' },
}

export function PhaseTabs({ templates, defaultInputs }: PhaseTabsProps) {
  const phase1 = templates.filter((t) => t.phase === 1)
  const phase2 = templates.filter((t) => t.phase === 2)
  const phase3 = templates.filter((t) => t.phase === 3)

  return (
    <Tabs defaultValue="phase1" className="w-full">
      <TabsList className="h-auto p-1 gap-1 rounded-xl mb-6" style={{ backgroundColor: 'var(--muted)' }}>
        {[
          { value: 'phase1', ...PHASE_LABELS[1], count: phase1.length },
          { value: 'phase2', ...PHASE_LABELS[2], count: phase2.length },
          { value: 'phase3', ...PHASE_LABELS[3], count: phase3.length },
        ].map(({ value, label, emoji, count }) => (
          <TabsTrigger
            key={value}
            value={value}
            className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all data-[state=active]:shadow-sm data-[state=active]:text-white"
            style={{
              '--tw-data-active-bg': 'var(--primary)',
            } as React.CSSProperties}
          >
            <span className="mr-1.5">{emoji}</span>
            {label}
            <span className="ml-2 text-xs opacity-60 font-normal">({count})</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {[
        { value: 'phase1', items: phase1 },
        { value: 'phase2', items: phase2 },
        { value: 'phase3', items: phase3 },
      ].map(({ value, items }) => (
        <TabsContent key={value} value={value} className="mt-0 grid gap-4 md:grid-cols-2">
          {items.map((t) => (
            <PromptCard
              key={t.key}
              promptKey={t.key}
              title={t.title}
              templateText={t.template_text}
              phase={t.phase}
              defaultInputs={{ ürün: defaultInputs.ürün, ülke: defaultInputs.ülke }}
            />
          ))}
        </TabsContent>
      ))}
    </Tabs>
  )
}
