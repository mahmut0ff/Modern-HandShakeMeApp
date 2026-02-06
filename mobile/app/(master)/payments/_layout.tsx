import { Stack } from 'expo-router';

export default function PaymentsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="escrow" />
      <Stack.Screen name="history" />
      <Stack.Screen name="holds" />
    </Stack>
  );
}
