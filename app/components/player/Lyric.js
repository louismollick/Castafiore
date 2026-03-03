import React from 'react'
import { Text, FlatList, Pressable } from 'react-native'
import { useTranslation } from 'react-i18next'

import { useTheme } from '~/contexts/theme'
import { useConfig } from '~/contexts/config'
import { useSettings } from '~/contexts/settings'
import { getApi } from '~/utils/api'
import { parseLrc } from '~/utils/lrc'
import {
	buildEnabledDictionaryMap,
	normalizeDictionaryPreferences,
} from '~/utils/yomitanPreferences'
import {
	getInstalledDictionaries,
	isYomitanSupported,
	lookupTerm,
	tokenizeLyricsLine,
} from '~/utils/yomitan'
import Player from '~/utils/player'
import YomitanDrawer from '~/components/player/YomitanDrawer'
import AsyncStorage from '@react-native-async-storage/async-storage'

const japaneseTokenPattern = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff々〆ヵヶー]+/g

const buildSingleTokenLine = (line, selectable = false) => ({
	...line,
	tokens: [{
		text: line.text.length ? line.text : '...',
		selectable,
		kind: selectable ? 'word' : 'other',
	}]
})

const fallbackTokenizeLine = (line) => {
	const text = line.text.length ? line.text : '...'
	const tokens = []
	const pattern = new RegExp(japaneseTokenPattern)
	let cursor = 0
	let match = pattern.exec(text)

	while (match) {
		if (match.index > cursor) {
			tokens.push({
				text: text.slice(cursor, match.index),
				selectable: false,
				kind: 'other',
			})
		}

		tokens.push({
			text: match[0],
			selectable: true,
			term: match[0],
			kind: 'word',
		})

		cursor = match.index + match[0].length
		match = pattern.exec(text)
	}

	if (cursor < text.length) {
		tokens.push({
			text: text.slice(cursor),
			selectable: false,
			kind: 'other',
		})
	}

	if (!tokens.length) return buildSingleTokenLine({ ...line, text }, false)

	return {
		...line,
		text,
		tokens,
	}
}

const Lyric = ({ song, style, color = null, sizeText = 23 }) => {
	const { t } = useTranslation()
	const [indexCurrent, setIndex] = React.useState(0)
	const [rawLyrics, setRawLyrics] = React.useState([])
	const [lyrics, setLyrics] = React.useState([])
	const [isLayout, setIsLayout] = React.useState(false)
	const [installedDictionaries, setInstalledDictionaries] = React.useState([])
	const [selectedToken, setSelectedToken] = React.useState({ key: null, text: '' })
	const [drawerState, setDrawerState] = React.useState({
		visible: false,
		loading: false,
		error: '',
		entries: [],
		emptyTitle: '',
		emptyDescription: '',
		showManageAction: false,
	})
	const config = useConfig()
	const settings = useSettings()
	const refScroll = React.useRef(null)
	const lookupRequestRef = React.useRef(0)
	const theme = useTheme()
	const time = Player.updateTime()
	const yomitanSupported = React.useMemo(() => isYomitanSupported(), [])

	const closeDrawer = React.useCallback(() => {
		lookupRequestRef.current += 1
		setSelectedToken({ key: null, text: '' })
		setDrawerState({
			visible: false,
			loading: false,
			error: '',
			entries: [],
			emptyTitle: '',
			emptyDescription: '',
			showManageAction: false,
		})
	}, [])

	React.useEffect(() => {
		closeDrawer()
		setRawLyrics([])
		setLyrics([buildSingleTokenLine({ time: 0, text: t('Loading lyrics...') })])
		getLyrics()
	}, [song.songInfo?.id])

	React.useEffect(() => {
		let isActive = true

		const prepareLyrics = async () => {
			if (!rawLyrics.length) return

			const baseLyrics = rawLyrics.map((line) => ({
				...line,
				text: line?.text?.length ? line.text : '...',
			}))

			if (!yomitanSupported) {
				if (!isActive) return
				setInstalledDictionaries([])
				setLyrics(baseLyrics.map((line) => buildSingleTokenLine(line)))
				return
			}

			try {
				const dictionaries = await getInstalledDictionaries()
				if (!isActive) return
				setInstalledDictionaries(dictionaries)

				const preferences = normalizeDictionaryPreferences(
					dictionaries,
					settings.yomitanDictionaryPreferences,
				)
				const enabledDictionaryMap = buildEnabledDictionaryMap(preferences)

				const preparedLyrics = await Promise.all(baseLyrics.map(async (line) => {
					if (!enabledDictionaryMap.size) {
						return fallbackTokenizeLine(line)
					}

					try {
						const tokens = await tokenizeLyricsLine(line.text, enabledDictionaryMap)
						if (tokens.length) {
							return {
								...line,
								tokens,
							}
						}
					} catch {
						return fallbackTokenizeLine(line)
					}

					return fallbackTokenizeLine(line)
				}))

				if (!isActive) return
				setLyrics(preparedLyrics)
			} catch {
				if (!isActive) return
				setInstalledDictionaries([])
				setLyrics(baseLyrics.map((line) => fallbackTokenizeLine(line)))
			}
		}

		prepareLyrics()

		return () => {
			isActive = false
		}
	}, [rawLyrics, settings.yomitanDictionaryPreferences, yomitanSupported])

	const getLyrics = () => {
		AsyncStorage.getItem(`lyrics/${song.songInfo.id}`)
			.then(res => {
				if (res) {
					const ly = JSON.parse(res)
					setIsLayout(true)
					setRawLyrics(ly?.length ? ly : [{ time: 0, text: t('No lyrics found') }])
				} else {
					getNavidromeLyrics()
				}
			})
	}

	React.useEffect(() => {
		if (lyrics.length == 0) return
		let index = lyrics.findIndex(ly => ly.time > time.position) - 1
		if (index === -1) index = 0
		if (index === -2) index = lyrics.length - 1
		if (index < 0) return
		if (index !== indexCurrent) {
			setIndex(index)
		}
	}, [time.position, lyrics])

	React.useEffect(() => {
		if (!isLayout) return
		refScroll.current.scrollToIndex({ index: indexCurrent, animated: true, viewOffset: 0, viewPosition: 0.5 })
	}, [indexCurrent, isLayout])

	const getNavidromeLyrics = () => {
		getApi(config, 'getLyricsBySongId', { id: song.songInfo.id })
			.then(res => {
				const ly = res.lyricsList?.structuredLyrics?.[0]?.line?.map(ly => ({
					time: ly.start / 1000,
					text: ly.value.length ? ly.value : '...'
				})) || []
				if (ly.length == 0) { // If not found
					return getLrcLibLyrics()
				}
				ly.sort((a, b) => a.time - b.time)
				setRawLyrics(ly)
				AsyncStorage.setItem(`lyrics/${song.songInfo.id}`, JSON.stringify(ly))
			})
			.catch(() => { // If not found
				getLrcLibLyrics()
			})
	}

	const getLrcLibLyrics = () => {
		const params = {
			track_name: song.songInfo.title,
			artist_name: song.songInfo.artist,
			album_name: song.songInfo.album,
			duration: song.songInfo.duration
		}
		fetch('https://lrclib.net/api/get?' + Object.keys(params).map((key) => `${key}=${encodeURIComponent(params[key])}`).join('&'), {
			headers: { 'Lrclib-Client': 'Castafiore' }
		})
			.then(res => res.json())
			.then(res => {
				const ly = parseLrc(res.syncedLyrics || '')
				const nextLyrics = ly.length ? ly : [{ time: 0, text: t('No lyrics found') }]
				setRawLyrics(nextLyrics)
				AsyncStorage.setItem(`lyrics/${song.songInfo.id}`, JSON.stringify(nextLyrics))
			})
			.catch(() => {
				setRawLyrics([{ time: 0, text: t('No lyrics found') }])
			})
	}

	const openTokenDrawer = async (token, tokenKey) => {
		const requestId = lookupRequestRef.current + 1
		lookupRequestRef.current = requestId
		setSelectedToken({ key: tokenKey, text: token.text })
		setDrawerState({
			visible: true,
			loading: true,
			error: '',
			entries: [],
			emptyTitle: '',
			emptyDescription: '',
			showManageAction: false,
		})

		try {
			const dictionaries = installedDictionaries.length
				? installedDictionaries
				: await getInstalledDictionaries()

			if (requestId !== lookupRequestRef.current) return

			setInstalledDictionaries(dictionaries)

			if (!dictionaries.length) {
				setDrawerState({
					visible: true,
					loading: false,
					error: '',
					entries: [],
					emptyTitle: 'No dictionaries installed',
					emptyDescription: 'Import a Yomitan dictionary ZIP in Settings to enable lookups.',
					showManageAction: true,
				})
				return
			}

			const preferences = normalizeDictionaryPreferences(
				dictionaries,
				settings.yomitanDictionaryPreferences,
			)
			const enabledDictionaryMap = buildEnabledDictionaryMap(preferences)

			if (!enabledDictionaryMap.size) {
				setDrawerState({
					visible: true,
					loading: false,
					error: '',
					entries: [],
					emptyTitle: 'All dictionaries are disabled',
					emptyDescription: 'Enable at least one dictionary in Settings to run lookups.',
					showManageAction: true,
				})
				return
			}

			const result = await lookupTerm(token.text, enabledDictionaryMap)
			if (requestId !== lookupRequestRef.current) return

			if (!result.entries.length) {
				setDrawerState({
					visible: true,
					loading: false,
					error: '',
					entries: [],
					emptyTitle: 'No results found',
					emptyDescription: `No dictionary entries matched "${token.text}".`,
					showManageAction: false,
				})
				return
			}

			setDrawerState({
				visible: true,
				loading: false,
				error: '',
				entries: result.entries,
				emptyTitle: '',
				emptyDescription: '',
				showManageAction: false,
			})
		} catch {
			if (requestId !== lookupRequestRef.current) return

			setDrawerState({
				visible: true,
				loading: false,
				error: 'Failed to look up this word.',
				entries: [],
				emptyTitle: '',
				emptyDescription: '',
				showManageAction: false,
			})
		}
	}

	return (
		<>
			<FlatList
				ref={refScroll}
				style={[style, { borderRadius: null }]}
				contentContainerStyle={{ gap: 30 }}
				showsVerticalScrollIndicator={false}
				onScrollToIndexFailed={() => { }}
				initialNumToRender={lyrics.length}
				data={lyrics}
				onLayout={() => setIsLayout(true)}
				keyExtractor={(item, index) => `${item.time}-${index}`}
				renderItem={({ item, index }) => {
					const lineColor = index === indexCurrent
						? color?.active || theme.primaryText
						: color?.inactive || theme.secondaryText

					return (
						<Pressable
							onPress={() => {
								Player.setPosition(item.time)
							}}
						>
							<Text
								style={{
									color: lineColor,
									fontSize: sizeText,
									textAlign: 'center',
								}}>
								{(item.tokens || []).map((token, tokenIndex) => {
									const tokenKey = `${index}-${tokenIndex}`
									const isSelected = drawerState.visible && selectedToken.key === tokenKey

									return (
										<Text
											key={tokenKey}
											onPress={token.selectable ? (event) => {
												event?.stopPropagation?.()
												openTokenDrawer(token, tokenKey)
											} : undefined}
											style={token.selectable ? {
												color: isSelected ? theme.primaryTouch : lineColor,
												textDecorationLine: isSelected ? 'underline' : 'none',
											} : undefined}
										>
											{token.text.length ? token.text : '...'}
										</Text>
									)
								})}
							</Text>
						</Pressable>
					)
				}}
			/>
			<YomitanDrawer
				visible={drawerState.visible}
				selectedText={selectedToken.text}
				loading={drawerState.loading}
				error={drawerState.error}
				entries={drawerState.entries}
				dictionaries={installedDictionaries}
				emptyTitle={drawerState.emptyTitle}
				emptyDescription={drawerState.emptyDescription}
				showManageAction={drawerState.showManageAction}
				onClose={closeDrawer}
			/>
		</>
	)
}

export default Lyric
