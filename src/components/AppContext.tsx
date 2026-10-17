import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { ReduceMotion, ReducedMotionConfig } from "react-native-reanimated";
import { GameSpeed } from "../game/pace";
import { defaultSettings, reduceMotionOn, Settings, TEXT_SCALE } from "../game/settings";
import { HIGH_CONTRAST, NORMAL, Palette } from "./theme";
import { useSettings } from "./useSettings";

// Everything a screen needs to know about how the player wants the app to look and behave,
// worked out from their saved settings (and the phone's own accessibility settings).
export type Ui = {
  colors: Palette;
  highContrast: boolean;
  scale: number;             // how much bigger text is drawn: 1, 1.2 or 1.4
  reduceMotion: boolean;     // no flying cards, floating, bouncing or confetti
  reduceFlashes: boolean;    // calm outlines instead of glows and flashes
  speed: GameSpeed;
  swapSides: boolean;        // HIT and STAY change places (HIT is on the left unless this is on)
  showBustOdds: boolean;
  hideChat: boolean;
  ignoreDoubleTaps: boolean;
  sound: boolean;
  vibration: boolean;
  turnAlertSound: boolean;
};

type App = {
  settings: Settings;
  update: (change: Partial<Settings>) => void;
  loaded: boolean;
  ui: Ui;
};

function makeUi(settings: Settings, phoneReducesMotion: boolean): Ui {
  return {
    colors: settings.highContrast ? HIGH_CONTRAST : NORMAL,
    highContrast: settings.highContrast,
    scale: TEXT_SCALE[settings.textSize],
    reduceMotion: reduceMotionOn(settings, phoneReducesMotion),
    reduceFlashes: settings.reduceFlashes,
    speed: settings.gameSpeed,
    swapSides: settings.swapSides,
    showBustOdds: settings.showBustOdds,
    hideChat: settings.hideChat,
    ignoreDoubleTaps: settings.ignoreDoubleTaps,
    sound: settings.sound,
    vibration: settings.vibration,
    turnAlertSound: settings.turnAlertSound,
  };
}

const Context = createContext<App>({
  settings: defaultSettings(),
  update: () => {},
  loaded: false,
  ui: makeUi(defaultSettings(), false),
});

// Wraps the whole app. Loads the saved settings and keeps them, and the look worked out from them,
// available to every screen.
export function AppProvider({ children }: { children: ReactNode }) {
  const { settings, loaded, update } = useSettings();
  const [phoneReducesMotion, setPhoneReducesMotion] = useState(false);

  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((on) => live && setPhoneReducesMotion(on))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setPhoneReducesMotion);
    return () => {
      live = false;
      sub.remove();
    };
  }, []);

  const value = useMemo<App>(
    () => ({ settings, update, loaded, ui: makeUi(settings, phoneReducesMotion) }),
    [settings, update, loaded, phoneReducesMotion]
  );
  // Reanimated follows the phone's Reduce motion setting by itself. Ours decides instead (the phone's setting
  // is the starting point, and the player can overrule it either way in Settings). So the override is only
  // needed when the two differ; when they agree Reanimated already does the right thing. (Mounting the
  // override all the time made Reanimated print "Reduced motion setting is overwritten" at every start.)
  const overrides = value.ui.reduceMotion !== phoneReducesMotion;
  return (
    <Context.Provider value={value}>
      {overrides ? <ReducedMotionConfig mode={value.ui.reduceMotion ? ReduceMotion.Always : ReduceMotion.Never} /> : null}
      {children}
    </Context.Provider>
  );
}

export const useApp = (): App => useContext(Context);
export const useUi = (): Ui => useContext(Context).ui;

// A component's styles, built from the current look. `make` is the function exported by the
// component's .styles.ts file; it runs again only when the look changes (high contrast, say).
export function useStyles<S>(make: (ui: Ui) => S): S {
  const ui = useUi();
  return useMemo(() => make(ui), [make, ui]);
}
