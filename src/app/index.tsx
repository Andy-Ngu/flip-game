import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import GameScreen from "../components/GameScreen";
import { HowToPlay } from "../components/HowToPlay";
import SetupScreen from "../components/SetupScreen";
import TitleScreen from "../components/TitleScreen";
import { PlayerSetup } from "../game/session";

// Three screens: the title, then set up the table, then play. The rules open over the title.
// `seats` is null until the game starts.
export default function Home() {
  const [showTitle, setShowTitle] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [seats, setSeats] = useState<PlayerSetup[] | null>(null);

  // Every screen is dark, so the status bar (clock, battery) is light.
  return (
    <>
      <StatusBar style="light" />
      {showTitle ? (
        <TitleScreen onPlay={() => setShowTitle(false)} onRules={() => setShowRules(true)} />
      ) : seats === null ? (
        <SetupScreen onStart={setSeats} />
      ) : (
        <GameScreen seats={seats} onQuit={() => setSeats(null)} />
      )}
      {showRules && <HowToPlay onClose={() => setShowRules(false)} />}
    </>
  );
}
