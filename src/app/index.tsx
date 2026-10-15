import { useState } from "react";
import GameScreen from "../components/GameScreen";
import SetupScreen from "../components/SetupScreen";
import TitleScreen from "../components/TitleScreen";
import { PlayerSetup } from "../game/session";

// Three screens: the title, then set up the table, then play.
// `seats` is null until the game starts.
export default function Home() {
  const [showTitle, setShowTitle] = useState(true);
  const [seats, setSeats] = useState<PlayerSetup[] | null>(null);

  if (showTitle) {
    return <TitleScreen onPlay={() => setShowTitle(false)} />;
  }
  if (seats === null) {
    return <SetupScreen onStart={setSeats} />;
  }
  return <GameScreen seats={seats} onQuit={() => setSeats(null)} />;
}
