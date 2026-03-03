import React from 'react'
import { ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import Header from '~/components/Header'
import { useTheme } from '~/contexts/theme'
import mainStyles from '~/styles/main'
import settingStyles from '~/styles/settings'
import size from '~/styles/size'

const DictionariesSettings = () => {
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const themedMainStyles = mainStyles as any
  const themedSettingStyles = settingStyles as any

  return (
    <ScrollView
      style={themedMainStyles.mainContainer(theme)}
      contentContainerStyle={themedMainStyles.contentMainContainer(insets)}
    >
      <Header title="Dictionaries" />
      <View style={themedSettingStyles.contentMainContainer}>
        <View style={themedSettingStyles.optionsContainer(theme)}>
          <View style={[themedSettingStyles.optionItem(theme, true), {
            height: 'auto',
            minHeight: 90,
            paddingVertical: 16,
            alignItems: 'flex-start',
            justifyContent: 'center',
          }]}
          >
            <Text style={{ color: theme.primaryText, fontSize: size.text.medium, marginBottom: 4 }}>
              Yomitan dictionaries are web-only for now.
            </Text>
            <Text style={{ color: theme.secondaryText, fontSize: size.text.small }}>
              The current implementation depends on browser IndexedDB and is not available on Android yet.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

export default DictionariesSettings
