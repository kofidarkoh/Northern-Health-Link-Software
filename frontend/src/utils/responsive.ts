import { useWindowDimensions } from 'react-native'

export const Layout = {
  maxContentWidth: 960,
  tabletMinWidth: 768,
  desktopMinWidth: 1024,
}

export function useResponsive() {
  const { width } = useWindowDimensions()
  return {
    width,
    isTablet: width >= Layout.tabletMinWidth,
    isDesktop: width >= Layout.desktopMinWidth,
    columns: width >= Layout.desktopMinWidth ? 3 : width >= Layout.tabletMinWidth ? 2 : 1,
    contentWidth: Math.min(width, Layout.maxContentWidth),
  }
}
