import type {
  LookupResult,
  LyricToken,
  YomitanDictionarySummary,
  YomitanRenderer,
  YomitanRendererCreateOptions,
} from '~/types/yomitan'

export const isYomitanSupported = () => false

export const getInstalledDictionaries = async (): Promise<YomitanDictionarySummary[]> => {
  return []
}

export const importDictionaryZip = async (_archive: ArrayBuffer) => {
  throw new Error('Yomitan dictionary import is only supported on web')
}

export const deleteDictionary = async (_title: string): Promise<void> => {
  throw new Error('Yomitan dictionary deletion is only supported on web')
}

export const tokenizeLyricsLine = async (
  _text: string,
): Promise<LyricToken[]> => {
  return []
}

export const lookupTerm = async (
  _text: string,
): Promise<LookupResult> => {
  return {
    entries: [],
    originalTextLength: 0,
  }
}

export const createTermEntryRenderer = (
  _options?: YomitanRendererCreateOptions,
): YomitanRenderer => {
  throw new Error('Yomitan rendering is only supported on web')
}
