import { useState } from "react";
import GameScreen from "../components/GameScreen";
import SetupScreen from "../components/SetupScreen";
import { PlayerSetup } from "../game/session";

// Two screens: set up the table, then play. `seats` is null until the game starts.
export default function Home() {
  const [seats, setSeats] = useState<PlayerSetup[] | null>(null);

  if (seats === null) {
    return <SetupScreen onStart={setSeats} />;
  }
  return <GameScreen seats={seats} onQuit={() => setSeats(null)} />;
}
