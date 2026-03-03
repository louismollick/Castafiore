import React from 'react'

import {
  createTermEntryRenderer,
} from '~/utils/yomitan'
import type {
  YomitanDictionarySummary,
  YomitanRenderer,
  YomitanTermDictionaryEntry,
} from '~/types/yomitan'

interface Props {
  entries: YomitanTermDictionaryEntry[]
  dictionaryInfo: YomitanDictionarySummary[]
}

const YomitanResults = ({ entries, dictionaryInfo }: Props) => {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const rendererRef = React.useRef<YomitanRenderer | null>(null)

  React.useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    const renderer = createTermEntryRenderer()
    rendererRef.current = renderer
    renderer.prepareHost(host, { theme: 'dark' })

    return () => {
      host.replaceChildren()
      renderer.destroy()
      rendererRef.current = null
    }
  }, [])

  React.useEffect(() => {
    const host = hostRef.current
    const renderer = rendererRef.current
    if (!host || !renderer) return

    const options = { theme: 'dark' } as const
    renderer.updateHost(host, options)
    const renderedEntries = renderer.renderTermEntries(entries, dictionaryInfo, options)
    host.replaceChildren(...renderedEntries.map((item) => item.entryNode))
  }, [entries, dictionaryInfo])

  return (
    <div
      ref={hostRef}
      style={{
        height: '100%',
        minHeight: 160,
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    />
  )
}

export default YomitanResults
