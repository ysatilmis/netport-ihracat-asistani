'use client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PromptCard } from './prompt-card'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/lib/supabase/types'

type PromptTemplate = Database['public']['Tables']['prompt_templates']['Row']

interface PhaseTabsProps {
  templates: PromptTemplate[]
  defaultInputs: { ürün: string; ülke: string }
}

export function PhaseTabs({ templates, defaultInputs }: PhaseTabsProps) {
  const phase1 = templates.filter((t) => t.phase === 1)
  const phase2 = templates.filter((t) => t.phase === 2)
  const phase3 = templates.filter((t) => t.phase === 3)

  return (
    <Tabs defaultValue="phase1" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="phase1">Araştırma & Hazırlık</TabsTrigger>
        <TabsTrigger value="phase2" disabled={phase2.length === 0}>
          Konumlandırma
          {phase2.length === 0 && <Badge variant="secondary" className="ml-1 text-xs">Yakında</Badge>}
        </TabsTrigger>
        <TabsTrigger value="phase3" disabled={phase3.length === 0}>
          İlk Temas
          {phase3.length === 0 && <Badge variant="secondary" className="ml-1 text-xs">Yakında</Badge>}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="phase1" className="mt-6 grid gap-4 md:grid-cols-2">
        {phase1.map((t) => (
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

      <TabsContent value="phase2" className="mt-6">
        <p className="text-center text-slate-500 py-12">Yakında eklenecek.</p>
      </TabsContent>

      <TabsContent value="phase3" className="mt-6">
        <p className="text-center text-slate-500 py-12">Yakında eklenecek.</p>
      </TabsContent>
    </Tabs>
  )
}
