import { LilitaOne_400Regular } from "@expo-google-fonts/lilita-one";
import { Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black } from "@expo-google-fonts/nunito";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "../components/AppContext";
import { FONT, NORMAL } from "../components/theme";

// The app is a single screen (src/app/index.tsx) that switches between the title, the table and the
// other screens itself, so there is no tab bar and no header.
//
// This file sets up what every screen needs before it can be drawn:
//   - the two fonts (Lilita One for titles and numbers, Nunito for everything else),
//   - the safe-area measurements (room for the camera cut-out and the phone's navigation bar),
//   - the saved settings and the look worked out from them (AppProvider).
export default function RootLayout() {
  // The names on the left are the ones the rest of the app uses (see FONT in components/theme.ts).
  const [fontsReady, fontError] = useFonts({
    [FONT.display]: LilitaOne_400Regular,
    [FONT.semi]: Nunito_600SemiBold,
    [FONT.bold]: Nunito_700Bold,
    [FONT.extra]: Nunito_800ExtraBold,
    [FONT.black]: Nunito_900Black,
  });

  // Until the fonts are ready, show the same flat navy as the phone's own splash screen, so nothing
  // flickers. If the fonts fail to load (very unlikely) the app carries on with the phone's own font.
  if (!fontsReady && !fontError) {
    return <View style={{ flex: 1, backgroundColor: NORMAL.bg }} />;
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        {/* Every screen is dark, so the status bar (clock, battery) is drawn light. */}
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, animation: "none", contentStyle: { backgroundColor: NORMAL.bg } }} />
      </AppProvider>
    </SafeAreaProvider>
  );
}
