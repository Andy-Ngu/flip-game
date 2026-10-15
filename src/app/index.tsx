import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { View } from "react-native";
import GameScreen from "../components/GameScreen";
import { HowToPlay } from "../components/HowToPlay";
import SetupScreen from "../components/SetupScreen";
import { theme } from "../components/theme";
import TitleScreen from "../components/TitleScreen";
import { useSettings } from "../components/useSettings";
import { Seat, toSetup } from "../game/seats";
import { PlayerSetup } from "../game/session";

// Three screens: the title, then set up the table, then play. The rules open over the title.
// Settings (haptics, the players) are saved on the phone and loaded when the app opens.
export default function Home() {
  const { settings, loaded, update } = useSettings();
  const [showTitle, setShowTitle] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [players, setPlayers] = useState<PlayerSetup[] | null>(null); // null until the game starts

  function start(seats: Seat[]) {
    update({ seats });            // remember this table for next time
    setPlayers(toSetup(seats));
  }

  // Wait for the saved settings (a fraction of a second) so the setup screen
  // opens with last time's players instead of flashing the defaults.
  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <StatusBar style="light" />
      </View>
    );
  }

  // Every screen is dark, so the status bar (clock, battery) is light.
  return (
    <>
      <StatusBar style="light" />
      {showTitle ? (
        <TitleScreen onPlay={() => setShowTitle(false)} onRules={() => setShowRules(true)} />
      ) : players === null ? (
        <SetupScreen initialSeats={settings.seats} onStart={start} />
      ) : (
        <GameScreen
          seats={players}
          hapticsOn={settings.haptics}
          onHapticsChange={(on) => update({ haptics: on })}
          soundOn={settings.sound}
          onSoundChange={(on) => update({ sound: on })}
          onQuit={() => setPlayers(null)}
        />
      )}
      {showRules && <HowToPlay onClose={() => setShowRules(false)} />}
    </>
  );
}
