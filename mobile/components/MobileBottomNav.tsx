import React, { useMemo } from 'react'
import { View, TouchableOpacity, Text, Platform } from 'react-native'
import { useRouter, usePathname, useSegments } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAppSelector } from '../hooks/redux'

// FIXED: Proper route typing
type ClientRoute = 
  | '/(client)/dashboard'
  | '/(client)/orders'
  | '/(client)/masters'
  | '/(client)/chat'
  | '/(client)/profile'

type MasterRoute = 
  | '/(master)/dashboard'
  | '/(master)/projects'
  | '/(master)/orders'
  | '/(master)/chat'
  | '/(master)/profile'

type AppRoute = ClientRoute | MasterRoute

// Icon mapping from BoxIcons to Ionicons
const iconMap: Record<string, string> = {
  'bx-home-alt-2': 'home-outline',
  'bxs-home-alt-2': 'home',
  'bx-folder': 'folder-outline', 
  'bxs-folder': 'folder',
  'bx-briefcase': 'briefcase-outline',
  'bxs-briefcase': 'briefcase',
  'bx-file': 'document-text-outline',
  'bxs-file': 'document-text',
  'bx-search': 'search',
  'bx-chat': 'chatbubbles-outline',
  'bxs-chat': 'chatbubbles',
  'bx-user': 'person-outline',
  'bxs-user': 'person',
}

// Safe hook wrapper to handle navigation context issues
function useSafeNavigation() {
  try {
    const router = useRouter()
    const pathname = usePathname() || ''
    const segments = useSegments() || []
    return { router, pathname, segments, isReady: true }
  } catch (error) {
    return { router: null, pathname: '', segments: [], isReady: false }
  }
}

const MobileBottomNav = React.memo(function MobileBottomNav() {
  const { user } = useAppSelector((state) => state.auth)
  const { router, pathname, isReady } = useSafeNavigation()
  
  // FIXED: Use uppercase role format
  const isMaster = user?.role === 'MASTER' || user?.role === 'ADMIN'
  
  // All hooks must be called before any conditional returns
  const navItems = useMemo(() => {
    if (isMaster) {
      return [
        { path: '/(master)/dashboard' as MasterRoute, icon: 'bx-home-alt-2', activeIcon: 'bxs-home-alt-2', label: 'Главная' },
        { path: '/(master)/projects' as MasterRoute, icon: 'bx-folder', activeIcon: 'bxs-folder', label: 'Проекты' },
        { path: '/(master)/orders' as MasterRoute, icon: 'bx-briefcase', activeIcon: 'bxs-briefcase', label: 'Вакансии', isCenter: true },
        { path: '/(master)/chat' as MasterRoute, icon: 'bx-chat', activeIcon: 'bxs-chat', label: 'Чаты' },
        { path: '/(master)/profile' as MasterRoute, icon: 'bx-user', activeIcon: 'bxs-user', label: 'Профиль' },
      ]
    }
    return [
      { path: '/(client)/dashboard' as ClientRoute, icon: 'bx-home-alt-2', activeIcon: 'bxs-home-alt-2', label: 'Главная' },
      { path: '/(client)/orders' as ClientRoute, icon: 'bx-file', activeIcon: 'bxs-file', label: 'Заказы' },
      { path: '/(client)/masters' as ClientRoute, icon: 'bx-search', activeIcon: 'bx-search', label: 'Мастера', isCenter: true },
      { path: '/(client)/chat' as ClientRoute, icon: 'bx-chat', activeIcon: 'bxs-chat', label: 'Чаты' },
      { path: '/(client)/profile' as ClientRoute, icon: 'bx-user', activeIcon: 'bxs-user', label: 'Профиль' },
    ]
  }, [isMaster])
  
  // Don't render if navigation context is not ready or no user
  if (!isReady || !router || !user) return null
  
  // Don't render in specific chat
  const isSpecificChatUrl = pathname?.match(/\/chat\/\d+/)
  if (isSpecificChatUrl) return null

  const handleNavigation = (path: AppRoute) => {
    if (router) {
      router.push(path) // FIXED: Removed 'as any'
    }
  }

  return (
    <View style={{
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
      paddingBottom: Platform.OS === 'ios' ? 34 : 8,
      paddingTop: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.06,
      shadowRadius: 24,
      elevation: 8,
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 64,
        paddingHorizontal: 8,
      }}>
        {navItems.map((item) => {
          // Determine if this nav item is active
          let active = false
          if (item.path.includes('/dashboard')) {
            active = pathname.includes('/dashboard')
          } else if (item.path.includes('/orders')) {
            active = pathname.includes('/orders')
          } else if (item.path.includes('/masters')) {
            active = pathname.includes('/masters')
          } else if (item.path.includes('/projects')) {
            active = pathname.includes('/projects')
          } else if (item.path.includes('/chat')) {
            active = pathname.includes('/chat')
          } else if (item.path.includes('/profile')) {
            active = pathname.includes('/profile')
          }
          
          // Center button (Вакансии/Мастера) - big and round
          if (item.isCenter) {
            return (
              <TouchableOpacity
                key={item.path}
                onPress={() => handleNavigation(item.path)}
                style={{
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginTop: -20,
                }}
                activeOpacity={0.95}
              >
                <View style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: active ? '#0165FB' : '#60A5FA', // primary-500 : primary-400
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: active ? '#0165FB' : '#60A5FA',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: active ? 0.4 : 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }}>
                  <Ionicons 
                    name={iconMap[active ? item.activeIcon : item.icon] as any} 
                    size={24} 
                    color="white" 
                  />
                </View>
                <Text style={{
                  fontSize: 10,
                  marginTop: 4,
                  fontWeight: '600',
                  color: active ? '#0165FB' : '#60A5FA', // primary-600 : primary-500
                }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )
          }
          
          // Regular nav items
          return (
            <TouchableOpacity
              key={item.path}
              onPress={() => handleNavigation(item.path)}
              style={{
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                height: '100%',
                paddingBottom: 4,
              }}
              activeOpacity={0.9}
            >
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 32,
                borderRadius: 16,
                backgroundColor: active ? '#0165FB' : 'transparent',
                transform: [{ scale: active ? 1.1 : 1 }],
                shadowColor: active ? '#0165FB' : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: active ? 0.3 : 0,
                shadowRadius: 4,
                elevation: active ? 4 : 0,
              }}>
                <Ionicons 
                  name={iconMap[active ? item.activeIcon : item.icon] as any} 
                  size={22} 
                  color={active ? 'white' : '#9CA3AF'} // white when active : gray-400
                />
              </View>
              <Text style={{
                fontSize: 10,
                fontWeight: '500',
                color: active ? '#0165FB' : '#9CA3AF', // primary-600 : gray-400
              }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
})

export default MobileBottomNav