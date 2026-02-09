import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/src/context/AuthContext';
import { WebSocketProvider } from '@/src/context/WebSocketContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <WebSocketProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="chat/[roomId]" options={{ headerShown: false }} />
            <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
            <Stack.Screen name="profile/portfolio" options={{ headerShown: false }} />
            <Stack.Screen name="profile/portfolio/add" options={{ headerShown: false }} />
            <Stack.Screen name="profile/settings" options={{ headerShown: false }} />
            <Stack.Screen name="profile/reviews" options={{ headerShown: false }} />
            <Stack.Screen name="profile/favorites" options={{ headerShown: false }} />
            <Stack.Screen name="jobs/[id]/index" options={{ headerShown: false }} />
            <Stack.Screen name="jobs/[id]/applications" options={{ headerShown: false }} />
            <Stack.Screen name="jobs/[id]/review" options={{ headerShown: false }} />
            <Stack.Screen name="masters/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="apply-job" options={{ headerShown: false }} />
            <Stack.Screen name="create-job" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
}
