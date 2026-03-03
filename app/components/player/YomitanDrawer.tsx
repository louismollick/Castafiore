import React from 'react'
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/FontAwesome'

import { useTheme } from '~/contexts/theme'
import YomitanResults from '~/components/player/YomitanResults'
import ButtonText from '~/components/settings/ButtonText'
import mainStyles from '~/styles/main'
import size from '~/styles/size'
import type {
  YomitanDictionarySummary,
  YomitanTermDictionaryEntry,
} from '~/types/yomitan'

interface Props {
  visible: boolean
  selectedText: string
  loading: boolean
  error: string
  entries: YomitanTermDictionaryEntry[]
  dictionaries: YomitanDictionarySummary[]
  emptyTitle?: string
  emptyDescription?: string
  showManageAction?: boolean
  onClose: () => void
}

const YomitanDrawer = ({
  visible,
  selectedText,
  loading,
  error,
  entries,
  dictionaries,
  emptyTitle,
  emptyDescription,
  showManageAction = false,
  onClose,
}: Props) => {
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const navigation = useNavigation()
  const { height } = useWindowDimensions()
  const slide = React.useRef(new Animated.Value(320)).current
  const shouldAnimate = React.useRef(false)

  const drawerHeight = Math.max(260, Math.min(height * 0.7, height - 80))
  const bodyHeight = Math.max(180, drawerHeight - 108)

  React.useEffect(() => {
    if (!visible) {
      slide.setValue(320)
      return
    }

    shouldAnimate.current = true
  }, [slide, visible])

  const onLayout = (event: { nativeEvent: { layout: { height: number } } }) => {
    if (!shouldAnimate.current) return
    shouldAnimate.current = false

    slide.setValue(event.nativeEvent.layout.height)
    Animated.timing(slide, {
      toValue: 0,
      duration: 150,
      useNativeDriver: Platform.OS !== 'web',
    }).start()
  }

  const openDictionaries = () => {
    onClose();
    (navigation as any).navigate('SettingsStack', {
      screen: 'Settings/Dictionaries',
    })
  }

  const renderBody = () => {
    if (loading) {
      return (
        <View style={{ height: bodyHeight, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: theme.secondaryText, fontSize: size.text.medium, textAlign: 'center' }}>
            Loading dictionary results...
          </Text>
        </View>
      )
    }

    if (error) {
      return (
        <View style={{ height: bodyHeight, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: theme.secondaryText, fontSize: size.text.medium, textAlign: 'center' }}>
            {error}
          </Text>
        </View>
      )
    }

    if (emptyTitle || entries.length === 0) {
      return (
        <ScrollView
          style={{ height: bodyHeight }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20 }}
        >
          <Text style={{
            color: theme.primaryText,
            fontSize: size.text.large,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 10,
          }}
          >
            {emptyTitle || 'No results found'}
          </Text>
          <Text style={{
            color: theme.secondaryText,
            fontSize: size.text.medium,
            textAlign: 'center',
            marginBottom: showManageAction ? 12 : 0,
          }}
          >
            {emptyDescription || 'No dictionary entries matched this word.'}
          </Text>
          {showManageAction ? (
            <ButtonText text="Manage dictionaries" onPress={openDictionaries} />
          ) : null}
        </ScrollView>
      )
    }

    return (
      <View style={{ height: bodyHeight }}>
        <YomitanResults entries={entries} dictionaryInfo={dictionaries} />
      </View>
    )
  }

  if (!visible) return null

  return (
    <Modal
      transparent
      visible={visible}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <Animated.View
          onLayout={onLayout}
          style={{
            width: '100%',
            maxHeight: drawerHeight,
            paddingTop: 15,
            paddingBottom: insets.bottom > 15 ? insets.bottom : 15,
            backgroundColor: theme.secondaryBack,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            transform: [{ translateY: slide }],
          }}
        >
          <View
            style={{
              paddingHorizontal: 20,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: theme.tertiaryBack,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.secondaryText, fontSize: size.text.small, marginBottom: 3 }}>
                Dictionary
              </Text>
              <Text
                numberOfLines={1}
                style={{ color: theme.primaryText, fontSize: size.text.large, fontWeight: 'bold' }}
              >
                {selectedText || 'Word lookup'}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ([(mainStyles.opacity as any)({ pressed }), { padding: 6 }])}
            >
              <Icon name="close" size={size.icon.tiny} color={theme.secondaryText} />
            </Pressable>
          </View>
          {renderBody()}
        </Animated.View>
      </View>
    </Modal>
  )
}

export default YomitanDrawer
