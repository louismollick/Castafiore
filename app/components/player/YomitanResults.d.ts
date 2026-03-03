declare module '~/components/player/YomitanResults' {
  import type React from 'react'
  import type {
    YomitanDictionarySummary,
    YomitanTermDictionaryEntry,
  } from '~/types/yomitan'

  interface Props {
    entries: YomitanTermDictionaryEntry[]
    dictionaryInfo: YomitanDictionarySummary[]
  }

  const YomitanResults: (props: Props) => React.ReactElement | null

  export default YomitanResults
}
