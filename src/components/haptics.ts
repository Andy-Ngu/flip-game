import * as Haptics from "expo-haptics";
import { Feel } from "../game/events";

// Haptics can silently do nothing (Low Power Mode, unsupported device, web),
// and a failed buzz must never break the game, so every call swallows errors.
function run(promise: Promise<void>) {
  promise.catch(() => {});
}

export function playFeel(feel: Feel | null) {
  if (feel === null) return;
  try {
    switch (feel) {
      case "tick":
        run(Haptics.selectionAsync());
        break;
      case "light":
        run(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
        break;
      case "medium":
        run(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
        break;
      case "heavy":
        run(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
        break;
      case "success":
        run(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
        break;
      case "warning":
        run(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
        break;
      case "error":
        run(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
        break;
    }
  } catch {
    // ignore
  }
}
