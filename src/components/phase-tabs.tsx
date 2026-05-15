'use client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PromptCard } from './prompt-card'
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
        <TabsTrigger value="phase2">Konumlandırma</TabsTrigger>
        <TabsTrigger value="phase3">İlk Temas</TabsTrigger>
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

      <TabsContent value="phase2" className="mt-6 grid gap-4 md:grid-cols-2">
        {phase2.map((t) => (
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

      <TabsContent value="phase3" className="mt-6 grid gap-4 md:grid-cols-2">
        {phase3.map((t) => (
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
    </Tabs>
  )
}
