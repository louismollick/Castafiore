import type {
  ParseTextResultItem,
  Summary,
  TermDictionaryEntry,
  YomitanCore as YomitanCoreType,
} from 'yomitan-core'
import type { createTermEntryRenderer as CreateCoreTermEntryRenderer } from 'yomitan-core/render'

import type {
  EnabledDictionaryMap,
  LookupResult,
  LyricToken,
  YomitanDictionarySummary,
  YomitanRenderer,
  YomitanRendererCreateOptions,
} from '~/types/yomitan'

let corePromise: Promise<YomitanCoreType> | null = null
let renderModule: null | {
  createTermEntryRenderer: typeof CreateCoreTermEntryRenderer
} = null

declare const require: (id: string) => any

const toFindTermDictionaryMap = (enabledDictionaryMap: EnabledDictionaryMap) => {
  const map = new Map<string, {
    index: number
    alias: string
    allowSecondarySearches: boolean
    partsOfSpeechFilter: boolean
    useDeinflections: boolean
  }>()

  for (const [name, { index }] of enabledDictionaryMap.entries()) {
    map.set(name, {
      index,
      alias: name,
      allowSecondarySearches: false,
      partsOfSpeechFilter: true,
      useDeinflections: true,
    })
  }

  return map
}

const createToken = (
  text: string,
  selectable: boolean,
  reading = '',
): LyricToken => {
  if (!text.length) {
    return {
      text,
      selectable: false,
      kind: 'other',
    }
  }

  if (/^\s+$/.test(text)) {
    return {
      text,
      selectable: false,
      kind: 'space',
    }
  }

  if (/^[\p{P}\p{S}]+$/u.test(text)) {
    return {
      text,
      selectable: false,
      kind: 'punct',
    }
  }

  return {
    text,
    reading,
    term: text,
    selectable,
    kind: selectable ? 'word' : 'other',
  }
}

const getCoreInstance = async (): Promise<YomitanCoreType> => {
  if (!corePromise) {
    corePromise = (async () => {
      const module = require('yomitan-core') as typeof import('yomitan-core')
      const YomitanCore = module.default
      const core = new YomitanCore({
        databaseName: 'castafiore-yomitan',
        initLanguage: true,
      })
      await core.initialize()
      return core
    })()
  }

  return await corePromise
}

export const isYomitanSupported = () => true

export const getInstalledDictionaries = async (): Promise<YomitanDictionarySummary[]> => {
  const core = await getCoreInstance()
  const dictionaries = await core.getDictionaryInfo()
  return [...(dictionaries as Summary[])].sort((a, b) => b.importDate - a.importDate)
}

export const importDictionaryZip = async (
  archive: ArrayBuffer,
  onProgress?: (progress: { index: number, count: number, nextStep?: boolean }) => void,
) => {
  const core = await getCoreInstance()
  return await core.importDictionary(archive, {
    onProgress,
    // Use the importer bypass sentinel so dictionaries with a minimumYomitanVersion
    // do not fail against the library's default placeholder version.
    yomitanVersion: '0.0.0.0',
  })
}

export const deleteDictionary = async (title: string): Promise<void> => {
  const core = await getCoreInstance()
  await core.deleteDictionary(title)
}

export const tokenizeLyricsLine = async (
  text: string,
  enabledDictionaryMap: EnabledDictionaryMap,
): Promise<LyricToken[]> => {
  if (!text.length || enabledDictionaryMap.size === 0) return []

  const core = await getCoreInstance()
  const parsed = await core.parseText(text, {
    language: 'ja',
    enabledDictionaryMap: toFindTermDictionaryMap(enabledDictionaryMap),
    scanLength: 10,
    searchResolution: 'letter',
    removeNonJapaneseCharacters: false,
    deinflect: true,
    textReplacements: [null],
  }) as ParseTextResultItem[]

  const tokens: LyricToken[] = []

  for (const parseResult of parsed) {
    const lines = parseResult.content || []
    for (const line of lines) {
      for (const segment of line) {
        if (!segment.text) continue

        tokens.push(createToken(
          segment.text,
          Array.isArray(segment.headwords) && segment.headwords.length > 0,
          segment.reading || '',
        ))
      }
    }
  }

  return tokens
}

export const lookupTerm = async (
  text: string,
  enabledDictionaryMap: EnabledDictionaryMap,
): Promise<LookupResult> => {
  const core = await getCoreInstance()

  return await core.findTerms(text, {
    mode: 'group',
    language: 'ja',
    enabledDictionaryMap: toFindTermDictionaryMap(enabledDictionaryMap),
    options: {
      matchType: 'exact',
      deinflect: true,
      removeNonJapaneseCharacters: false,
      searchResolution: 'letter',
    },
  }) as { entries: TermDictionaryEntry[], originalTextLength: number }
}

export const createTermEntryRenderer = (
  options?: YomitanRendererCreateOptions,
): YomitanRenderer => {
  if (!renderModule) {
    renderModule = require('yomitan-core/render') as typeof import('yomitan-core/render')
  }

  return renderModule.createTermEntryRenderer(options)
}
