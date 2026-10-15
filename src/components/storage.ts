import AsyncStorage from "@react-native-async-storage/async-storage";
import { defaultSettings, parseSettings, serializeSettings, Settings, SETTINGS_KEY } from "../game/settings";

// Saving is a convenience, never a requirement: if the phone's storage fails, the app
// still works with the defaults, so both functions swallow errors.
export async function loadSettings(): Promise<Settings> {
  try {
    return parseSettings(await AsyncStorage.getItem(SETTINGS_KEY));
  } catch {
    return defaultSettings();
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, serializeSettings(settings));
  } catch {
    // ignore
  }
}
