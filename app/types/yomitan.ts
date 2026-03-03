import type { Summary, TermDictionaryEntry } from 'yomitan-core'
import type {
  RenderHostOptions,
  RenderedTermEntry,
  TermEntryRenderer,
  TermEntryRendererCreateOptions,
} from 'yomitan-core/render'

export interface DictionaryPreference {
  title: string
  enabled: boolean
}

export type EnabledDictionaryMap = Map<string, { index: number, priority: number }>

export interface LyricToken {
  text: string
  selectable: boolean
  reading?: string
  term?: string
  kind?: 'word' | 'punct' | 'space' | 'other'
}

export interface LyricLineWithTokens {
  time: number
  text: string
  tokens: LyricToken[]
}

export interface LookupResult {
  entries: TermDictionaryEntry[]
  originalTextLength: number
}

export type YomitanDictionarySummary = Summary
export type YomitanTermDictionaryEntry = TermDictionaryEntry
export type YomitanRenderOptions = RenderHostOptions
export type YomitanRenderedTermEntry = RenderedTermEntry
export type YomitanRenderer = TermEntryRenderer
export type YomitanRendererCreateOptions = TermEntryRendererCreateOptions
