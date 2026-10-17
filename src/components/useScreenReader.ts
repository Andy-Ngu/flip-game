import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

// Is a screen reader (TalkBack, VoiceOver) turned on? Boards that move on by themselves wait for a tap
// instead when it is, so there is time to hear the whole board.
export function useScreenReader(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isScreenReaderEnabled()
      .then((value) => live && setOn(value))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener("screenReaderChanged", setOn);
    return () => {
      live = false;
      sub.remove();
    };
  }, []);
  return on;
}
