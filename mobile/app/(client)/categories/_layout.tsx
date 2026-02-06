import { Stack } from 'expo-router';

export default function CategoriesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="detail" />
      <Stack.Screen name="skill-selection" />
    </Stack>
  );
}
