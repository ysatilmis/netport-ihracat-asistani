'use client'
import { DEEP_DIVE_SECTIONS } from '@/lib/report-prompts'
import type { CountryOption } from '@/lib/report-prompts'

export type FlowStep = 'form' | 'countries_streaming' | 'choosing' | 'deep_dive' | 'done'
export type SectionData = { title: string; text: string; phase: number }
export type ReportState = Record<string, SectionData>

export interface StreamerState {
  step: FlowStep
  isLoading: boolean
  error: string | null
  countriesText: string
  countryOptions: CountryOption[]
  sections: ReportState
  streamingSection?: string
  currentPhase?: number
  completedCount: number
  reportProduct: string
  selectedCountry: string
  savedReportId: string | null
}

const STORAGE_KEY = 'netport-dashboard-state-v2'

function emptyState(): StreamerState {
  return {
    step: 'form',
    isLoading: false,
    error: null,
    countriesText: '',
    countryOptions: [],
    sections: {},
    streamingSection: undefined,
    currentPhase: undefined,
    completedCount: 0,
    reportProduct: '',
    selectedCountry: '',
    savedReportId: null,
  }
}

// Stable, frozen snapshot returned during SSR and the initial client render
// (before hydration completes). Using a constant reference here prevents
// React hydration mismatches caused by sessionStorage-restored state.
const SERVER_SNAPSHOT: StreamerState = Object.freeze(emptyState()) as StreamerState

export function getServerSnapshot(): StreamerState {
  return SERVER_SNAPSHOT
}

class ReportStreamer {
  private state: StreamerState = emptyState()
  private listeners = new Set<() => void>()
  private currentController: AbortController | null = null
  private hydrated = false

  constructor() {
    // No-op — hydration is deferred until hydrateFromStorage() is called
    // explicitly (after React hydration), so SSR and the first client render
    // both observe the same empty state.
  }

  hydrateFromStorage(): void {
    if (this.hydrated) return
    if (typeof window === 'undefined') return
    this.hydrated = true
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const persisted = JSON.parse(raw) as Partial<StreamerState>
      this.state = {
        ...emptyState(),
        ...persisted,
        // Stream-bound flags reset (singleton fresh constructed)
        isLoading: false,
        streamingSection: undefined,
        error: null,
      }
      this.listeners.forEach((l) => l())
    } catch {
      // ignore corrupted state
    }
  }

  getSnapshot = (): StreamerState => this.state

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private setState(partial: Partial<StreamerState>): void {
    this.state = { ...this.state, ...partial }
    this.persist()
    this.listeners.forEach((l) => l())
  }

  private persist(): void {
    if (typeof window === 'undefined') return
    if (
      this.state.step === 'form' &&
      !this.state.reportProduct &&
      !this.state.countriesText
    ) {
      try {
        sessionStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }
      return
    }
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          step: this.state.step,
          countriesText: this.state.countriesText,
          countryOptions: this.state.countryOptions,
          sections: this.state.sections,
          currentPhase: this.state.currentPhase,
          completedCount: this.state.completedCount,
          reportProduct: this.state.reportProduct,
          selectedCountry: this.state.selectedCountry,
          savedReportId: this.state.savedReportId,
        }),
      )
    } catch {
      // sessionStorage quota / serialization error — non-essential
    }
  }

  reset(): void {
    if (this.currentController) {
      this.currentController.abort()
      this.currentController = null
    }
    this.state = emptyState()
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }
    }
    this.listeners.forEach((l) => l())
  }

  async startCountries(product: string): Promise<void> {
    if (this.state.isLoading) return
    if (this.currentController) this.currentController.abort()
    const controller = new AbortController()
    this.currentController = controller

    this.setState({
      step: 'countries_streaming',
      isLoading: true,
      error: null,
      reportProduct: product,
      countriesText: '',
      countryOptions: [],
      sections: {},
      completedCount: 0,
      selectedCountry: '',
      savedReportId: null,
      currentPhase: undefined,
    })

    try {
      const res = await fetch('/api/report/countries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product }),
        signal: controller.signal,
      })

      if (res.status === 429) {
        this.setState({ error: 'Bu ay token limitiniz doldu.', step: 'form' })
        return
      }
      if (!res.ok) {
        this.setState({
          error: `Hata (${res.status}): sunucudan yanıt alınamadı.`,
          step: 'form',
        })
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6)) as {
              type: string
              text?: string
              countries?: CountryOption[]
              message?: string
            }

            if (event.type === 'chunk' && event.text) {
              this.setState({ countriesText: this.state.countriesText + event.text })
            } else if (event.type === 'countries' && event.countries) {
              this.setState({ countryOptions: event.countries, step: 'choosing' })
            } else if (event.type === 'countries_parse_error') {
              this.setState({
                error: event.message ?? 'Ülke listesi ayıklanamadı.',
              })
            } else if (event.type === 'error' && event.message) {
              this.setState({ error: event.message })
            }
          } catch {
            // skip malformed line
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      this.setState({
        error: `Bağlantı hatası: ${(err as Error).message}`,
        step: 'form',
      })
    } finally {
      if (this.currentController === controller) {
        this.currentController = null
      }
      this.setState({ isLoading: false })
    }
  }

  async startDeepDive(country: string): Promise<void> {
    if (this.state.isLoading) return
    if (!this.state.reportProduct) {
      this.setState({ error: 'Ürün bilgisi yok, baştan başla.' })
      return
    }
    if (this.currentController) this.currentController.abort()
    const controller = new AbortController()
    this.currentController = controller

    this.setState({
      step: 'deep_dive',
      isLoading: true,
      error: null,
      selectedCountry: country,
      sections: {},
      streamingSection: undefined,
      currentPhase: undefined,
      completedCount: 0,
      savedReportId: null,
    })

    const sectionTitles: Record<string, string> = {}
    const sectionPhases: Record<string, number> = {}
    DEEP_DIVE_SECTIONS.forEach((s) => {
      sectionTitles[s.key] = s.title
      sectionPhases[s.key] = s.phase
    })

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: this.state.reportProduct,
          country,
          countriesContext: this.state.countriesText,
        }),
        signal: controller.signal,
      })

      if (res.status === 429) {
        this.setState({ error: 'Bu ay token limitiniz doldu.' })
        return
      }
      if (!res.ok) {
        this.setState({
          error: `Hata (${res.status}): sunucudan yanıt alınamadı.`,
        })
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6)) as {
              type: string
              phase?: number
              section?: string
              text?: string
              message?: string
              id?: string
            }

            if (event.type === 'phase_start' && event.phase) {
              this.setState({ currentPhase: event.phase })
            } else if (event.type === 'section_start' && event.section) {
              const key = event.section
              this.setState({
                streamingSection: key,
                sections: {
                  ...this.state.sections,
                  [key]: {
                    title: sectionTitles[key] ?? key,
                    text: '',
                    phase: (sectionPhases[key] ?? 1) as 1 | 2 | 3 | 4,
                  },
                },
              })
            } else if (event.type === 'chunk' && event.section && event.text) {
              const key = event.section
              const chunk = event.text
              const existing = this.state.sections[key]
              this.setState({
                sections: {
                  ...this.state.sections,
                  [key]: {
                    title: existing?.title ?? sectionTitles[key] ?? key,
                    phase: (existing?.phase ?? sectionPhases[key] ?? 1) as 1 | 2 | 3 | 4,
                    text: (existing?.text ?? '') + chunk,
                  },
                },
              })
            } else if (event.type === 'section_done') {
              this.setState({
                streamingSection: undefined,
                completedCount: this.state.completedCount + 1,
              })
            } else if (event.type === 'saved' && event.id) {
              this.setState({ savedReportId: event.id })
            } else if (event.type === 'done') {
              this.setState({ step: 'done' })
            } else if (event.type === 'error' && event.message) {
              this.setState({ error: event.message })
            }
          } catch {
            // skip
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      this.setState({ error: `Bağlantı hatası: ${(err as Error).message}` })
    } finally {
      if (this.currentController === controller) {
        this.currentController = null
      }
      this.setState({ isLoading: false })
    }
  }
}

let _streamer: ReportStreamer | null = null

export function getReportStreamer(): ReportStreamer {
  if (typeof window === 'undefined') {
    // SSR — short-lived dummy. Component will re-hydrate on client mount.
    return new ReportStreamer()
  }
  if (!_streamer) {
    _streamer = new ReportStreamer()
  }
  return _streamer
}
