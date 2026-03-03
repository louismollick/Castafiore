import type {
  DictionaryPreference,
  EnabledDictionaryMap,
  YomitanDictionarySummary,
} from '~/types/yomitan'

export const normalizeDictionaryPreferences = (
  installedDictionaries: Array<string | YomitanDictionarySummary>,
  existingPreferences: DictionaryPreference[] = [],
): DictionaryPreference[] => {
  const titles = installedDictionaries.map((item) => typeof item === 'string' ? item : item.title)
  const uniqueTitles = [...new Set(titles)]
  const preferenceMap = new Map(existingPreferences.map((item) => [item.title, item]))

  return uniqueTitles.map((title) => ({
    title,
    enabled: preferenceMap.get(title)?.enabled ?? true,
  }))
}

export const buildEnabledDictionaryMap = (
  preferences: DictionaryPreference[] = [],
): EnabledDictionaryMap => {
  const map: EnabledDictionaryMap = new Map()
  let enabledIndex = 0

  preferences.forEach((item) => {
    if (!item.enabled) return
    map.set(item.title, {
      index: enabledIndex,
      priority: 0,
    })
    enabledIndex += 1
  })

  return map
}

export const moveDictionaryPreference = (
  preferences: DictionaryPreference[],
  fromIndex: number,
  toIndex: number,
): DictionaryPreference[] => {
  if (
    fromIndex < 0
    || toIndex < 0
    || fromIndex >= preferences.length
    || toIndex >= preferences.length
    || fromIndex === toIndex
  ) {
    return preferences
  }

  const next = [...preferences]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}
