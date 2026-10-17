import { useEffect, useState } from "react";
import { AppState } from "react-native";

// Is the app on the screen? False while the player has switched to another app or locked the phone.
// A game against the computer stops while this is false, so nothing happens behind your back.
export function useAppActive(): boolean {
  const [active, setActive] = useState(AppState.currentState === "active");
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => setActive(state === "active"));
    return () => sub.remove();
  }, []);
  return active;
}
