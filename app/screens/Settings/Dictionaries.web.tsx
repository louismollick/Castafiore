import React from 'react'
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/FontAwesome'

import Header from '~/components/Header'
import ButtonText from '~/components/settings/ButtonText'
import { useSettings, useSetSettings } from '~/contexts/settings'
import { useTheme } from '~/contexts/theme'
import {
  deleteDictionary,
  getInstalledDictionaries,
  importDictionaryZip,
} from '~/utils/yomitan'
import {
  moveDictionaryPreference,
  normalizeDictionaryPreferences,
} from '~/utils/yomitanPreferences'
import mainStyles from '~/styles/main'
import settingStyles from '~/styles/settings'
import size from '~/styles/size'
import type {
  DictionaryPreference,
  YomitanDictionarySummary,
} from '~/types/yomitan'

interface ActionButtonProps {
  icon: string
  label: string
  disabled?: boolean
  onPress: () => void
}

const ActionButton = ({
  icon,
  label,
  disabled = false,
  onPress,
}: ActionButtonProps) => {
  const theme = useTheme()
  const themedMainStyles = mainStyles as any

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ([themedMainStyles.opacity({ pressed, enable: !disabled }), {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: theme.primaryBack,
        opacity: disabled ? 0.5 : 1,
      }])}
    >
      <Icon name={icon} size={size.icon.tiny} color={theme.primaryTouch} />
      <Text style={{ color: theme.primaryText, fontSize: size.text.small }}>{label}</Text>
    </Pressable>
  )
}

const DictionariesSettings = () => {
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const settings = useSettings()
  const setSettings = useSetSettings()
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [installed, setInstalled] = React.useState<YomitanDictionarySummary[]>([])
  const [preferences, setPreferences] = React.useState<DictionaryPreference[]>([])
  const [statusText, setStatusText] = React.useState('Loading dictionaries...')
  const [lastError, setLastError] = React.useState('')
  const [isBusy, setIsBusy] = React.useState(false)
  const themedMainStyles = mainStyles as any
  const themedSettingStyles = settingStyles as any

  const persistPreferences = React.useCallback((nextPreferences: DictionaryPreference[]) => {
    setPreferences(nextPreferences)
    setSettings({
      ...settings,
      yomitanDictionaryPreferences: nextPreferences,
    })
  }, [setSettings, settings])

  const refreshDictionaries = React.useCallback(async () => {
    setIsBusy(true)
    setStatusText('Loading dictionaries...')

    try {
      const installedDictionaries = await getInstalledDictionaries()
      const normalized = normalizeDictionaryPreferences(
        installedDictionaries,
        settings.yomitanDictionaryPreferences,
      )

      setInstalled(installedDictionaries)
      setPreferences(normalized)
      if (JSON.stringify(normalized) !== JSON.stringify(settings.yomitanDictionaryPreferences)) {
        setSettings({
          ...settings,
          yomitanDictionaryPreferences: normalized,
        })
      }

      setStatusText(
        installedDictionaries.length
          ? `Loaded ${installedDictionaries.length} dictionaries.`
          : 'No dictionaries installed yet.',
      )
    } catch (_error) {
      setStatusText('Failed to load Yomitan dictionaries.')
    } finally {
      setIsBusy(false)
    }
  }, [setSettings, settings])

  React.useEffect(() => {
    refreshDictionaries()
  }, [refreshDictionaries])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : []
    if (!files.length) return

    setIsBusy(true)
    let imported = 0
    let failed = 0
    let firstError = ''

    for (const file of files) {
      setStatusText(`Importing ${file.name}...`)
      try {
        const archive = await file.arrayBuffer()
        await importDictionaryZip(archive, (progress) => {
          if (!progress.count) return
          const percentage = Math.round((progress.index / progress.count) * 100)
          setStatusText(`Importing ${file.name}... ${percentage}%`)
        })
        imported += 1
      } catch (error) {
        failed += 1
        const message = error instanceof Error ? error.message : String(error)
        if (!firstError) firstError = `${file.name}: ${message}`
        console.error(`Failed importing dictionary ${file.name}:`, error)
      }
    }

    event.target.value = ''
    await refreshDictionaries()

    if (failed === 0) {
      setLastError('')
      setStatusText(`Imported ${imported} dictionaries.`)
    } else {
      setLastError(firstError)
      setStatusText(`Imported ${imported}, failed ${failed}.`)
    }
  }

  const handleToggle = (title: string) => {
    persistPreferences(preferences.map((item) => (
      item.title === title
        ? { ...item, enabled: !item.enabled }
        : item
    )))
  }

  const handleMove = (index: number, direction: -1 | 1) => {
    const next = moveDictionaryPreference(preferences, index, index + direction)
    persistPreferences(next)
  }

  const handleDelete = async (title: string) => {
    setIsBusy(true)
    setStatusText(`Deleting ${title}...`)

    try {
      await deleteDictionary(title)
      await refreshDictionaries()
      setStatusText(`Deleted ${title}.`)
    } catch (_error) {
      setStatusText(`Failed to delete ${title}.`)
      setIsBusy(false)
    }
  }

  return (
    <>
      <ScrollView
        style={themedMainStyles.mainContainer(theme)}
        contentContainerStyle={themedMainStyles.contentMainContainer(insets)}
      >
        <Header title="Dictionaries" />
        <View style={themedSettingStyles.contentMainContainer}>
          <Text style={themedSettingStyles.titleContainer(theme)}>Import dictionaries</Text>
          <View style={themedSettingStyles.optionsContainer(theme)}>
            <ButtonText
              text={isBusy ? 'Working...' : 'Import dictionary ZIP files'}
              onPress={() => fileInputRef.current?.click()}
              disabled={isBusy}
            />
          </View>
          <Text style={themedSettingStyles.description(theme)}>
            Import Yomitan-compatible dictionary ZIP files. Multiple files are supported.
          </Text>

          <Text style={themedSettingStyles.titleContainer(theme)}>Recommended dictionaries</Text>
          <View style={themedSettingStyles.optionsContainer(theme)}>
            <ButtonText
              text="Download recommended dictionaries"
              onPress={() => {}}
              disabled
            />
          </View>
          <Text style={themedSettingStyles.description(theme)}>
            One-tap downloads are not enabled yet in this static web build. Use manual ZIP import for now.
          </Text>

          <Text style={themedSettingStyles.titleContainer(theme)}>Installed dictionaries</Text>
          <View style={themedSettingStyles.optionsContainer(theme)}>
            {preferences.length === 0 ? (
              <View style={[themedSettingStyles.optionItem(theme, true), {
                height: 'auto',
                minHeight: 80,
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingVertical: 15,
              }]}
              >
                <Text style={{ color: theme.primaryText, fontSize: size.text.medium, marginBottom: 4 }}>
                  No dictionaries installed.
                </Text>
                <Text style={{ color: theme.secondaryText, fontSize: size.text.small }}>
                  Import a Yomitan ZIP above, then manage the enabled list here.
                </Text>
              </View>
            ) : preferences.map((preference, index) => (
              <View
                key={preference.title}
                style={[themedSettingStyles.optionItem(theme, index === preferences.length - 1), {
                  height: 'auto',
                  minHeight: 88,
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  paddingVertical: 12,
                  paddingEnd: 0,
                }]}
              >
                <View style={{ width: '100%' }}>
                  <Text
                    numberOfLines={1}
                    style={{ color: theme.primaryText, fontSize: size.text.medium, fontWeight: 'bold', marginBottom: 8 }}
                  >
                    {preference.title}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    <ActionButton
                      icon={preference.enabled ? 'toggle-on' : 'toggle-off'}
                      label={preference.enabled ? 'Enabled' : 'Disabled'}
                      onPress={() => handleToggle(preference.title)}
                    />
                    <ActionButton
                      icon="arrow-up"
                      label="Up"
                      disabled={index === 0}
                      onPress={() => handleMove(index, -1)}
                    />
                    <ActionButton
                      icon="arrow-down"
                      label="Down"
                      disabled={index === preferences.length - 1}
                      onPress={() => handleMove(index, 1)}
                    />
                    <ActionButton
                      icon="trash"
                      label="Delete"
                      disabled={isBusy}
                      onPress={() => handleDelete(preference.title)}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
          <Text style={themedSettingStyles.description(theme)}>{statusText}</Text>
          {lastError ? (
            <Text style={[themedSettingStyles.description(theme), {
              color: '#d96c6c',
              marginTop: -10,
            }]}
            >
              {lastError}
            </Text>
          ) : null}
        </View>
      </ScrollView>
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </>
  )
}

export default DictionariesSettings
