import { Stack } from 'expo-router';

export default function OrderDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="applications" />
      <Stack.Screen name="edit" />
    </Stack>
  );
}
