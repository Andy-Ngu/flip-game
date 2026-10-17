import { useEffect } from "react";
import { AccessibilityInfo } from "react-native";

// Says a sentence out loud, once, when a screen appears (only for people using a screen reader such as
// TalkBack; for everyone else nothing happens). The table underneath goes quiet while a board is open,
// so the board says what it is about.
export function useAnnounce(message: string) {
  useEffect(() => {
    if (!message) return;
    // A short wait lets the screen reader settle on the new screen first, or it would talk over itself.
    const id = setTimeout(() => AccessibilityInfo.announceForAccessibility(message), 500);
    return () => clearTimeout(id);
  }, [message]);
}
