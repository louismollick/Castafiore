declare module '~/utils/yomitan' {
  import type {
    EnabledDictionaryMap,
    LookupResult,
    LyricToken,
    YomitanDictionarySummary,
    YomitanRenderer,
    YomitanRendererCreateOptions,
  } from '~/types/yomitan'

  export function isYomitanSupported(): boolean
  export function getInstalledDictionaries(): Promise<YomitanDictionarySummary[]>
  export function importDictionaryZip(
    archive: ArrayBuffer,
    onProgress?: (progress: { index: number, count: number, nextStep?: boolean }) => void,
  ): Promise<unknown>
  export function deleteDictionary(title: string): Promise<void>
  export function tokenizeLyricsLine(
    text: string,
    enabledDictionaryMap: EnabledDictionaryMap,
  ): Promise<LyricToken[]>
  export function lookupTerm(
    text: string,
    enabledDictionaryMap: EnabledDictionaryMap,
  ): Promise<LookupResult>
  export function createTermEntryRenderer(
    options?: YomitanRendererCreateOptions,
  ): YomitanRenderer
}
