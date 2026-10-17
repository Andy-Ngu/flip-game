import { useEffect, useRef } from "react";
import { BackHandler } from "react-native";

// Android's back button. While `enabled`, a press calls `handler` instead of leaving the app.
// The handler returns true when it dealt with the press; false lets the press go on to the next screen.
export function useBackButton(enabled: boolean, handler: () => boolean) {
  const latest = useRef(handler);
  latest.current = handler;
  useEffect(() => {
    if (!enabled) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => latest.current());
    return () => sub.remove();
  }, [enabled]);
}
