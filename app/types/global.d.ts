export {}

declare global {
  interface Window {
    __CASTAFIORE_YOMITAN_DEBUG__?: boolean
  }
}

declare module 'react-native-vector-icons/FontAwesome' {
  import type { ComponentType } from 'react'

  const Icon: ComponentType<any>

  export default Icon
}
