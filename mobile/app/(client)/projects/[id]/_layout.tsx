import { Stack } from 'expo-router';

export default function ProjectDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="review" />
    </Stack>
  );
}
