import { Stack } from "expo-router";

// The app is a single screen (src/app/index.tsx) that switches between the title,
// setup and game screens itself, so there is no tab bar and no header.
export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
