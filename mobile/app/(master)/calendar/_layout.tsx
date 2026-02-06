import { Stack } from 'expo-router';

export default function CalendarLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="connect" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="sync" />
    </Stack>
  );
}
