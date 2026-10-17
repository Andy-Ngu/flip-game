import { HelpKey, parseHelpSeen } from "./cardHelp";
import { ClockSeconds, DEFAULT_CLOCK, isClockSeconds } from "./clock";
import { DEFAULT_SPEED, GameSpeed, isGameSpeed } from "./pace";
import { parseProfile, Profile } from "./profile";
import { DEFAULT_TABLE, parseTable, TableSetup } from "./seats";
import { emptyStats, parseStats, Stats } from "./stats";

// Text size: how much bigger names, scores and labels are drawn.
export type TextSize = "normal" | "large" | "largest";
export const TEXT_SIZES: TextSize[] = ["normal", "large", "largest"];
export const TEXT_SCALE: Record<TextSize, number> = { normal: 1, large: 1.2, largest: 1.4 };

// What the app remembers between launches: the player's choices, who they are, and their record.
export type Settings = {
  // Sound and touch
  sound: boolean;            // sound effects
  vibration: boolean;
  turnAlertSound: boolean;   // the chime when your turn starts, and the tick in the last five seconds
  // Text and colour
  textSize: TextSize;
  highContrast: boolean;
  // Motion
  reduceMotion: boolean | null; // null = not chosen yet, so follow the phone's own setting
  reduceFlashes: boolean;
  // Pace
  turnClock: ClockSeconds;   // the clock a new table starts with
  gameSpeed: GameSpeed;
  ignoreDoubleTaps: boolean;
  // Game
  showBustOdds: boolean;
  swapSides: boolean;        // HIT and STAY change places (HIT is on the left unless this is on)
  hideChat: boolean;
  // You
  table: TableSetup;         // the last table that was made
  profile: Profile | null;   // null until the player has picked a character
  since: number | null;      // when the profile was made (milliseconds since 1970)
  stats: Stats;
  tipsDone: boolean;         // the first-game tips have been shown (or skipped)
  helpSeen: HelpKey[];       // the special cards whose first-time pop-up has been shown (see cardHelp.ts)
};

// The key is still "v1" from the first version of the app. The saved text is read field by field,
// so older saves keep working and nothing is lost when new settings are added.
export const SETTINGS_KEY = "stack-seven/settings/v1";

export function defaultSettings(): Settings {
  return {
    sound: true,
    vibration: true,
    turnAlertSound: true,
    textSize: "normal",
    highContrast: false,
    reduceMotion: null,
    reduceFlashes: false,
    turnClock: DEFAULT_CLOCK,
    gameSpeed: DEFAULT_SPEED,
    ignoreDoubleTaps: true,
    showBustOdds: true,
    swapSides: false,
    hideChat: false,
    table: { ...DEFAULT_TABLE },
    profile: null,
    since: null,
    stats: emptyStats(),
    tipsDone: false,
    helpSeen: [],
  };
}

// Reduce motion is on if the player chose so, or if they have not chosen and their phone says so.
export function reduceMotionOn(settings: Settings, phoneSaysReduce: boolean): boolean {
  return settings.reduceMotion ?? phoneSaysReduce;
}

const bool = (x: unknown, fallback: boolean): boolean => (typeof x === "boolean" ? x : fallback);

// Turn whatever was stored into settings the app can trust. Stored text can be missing,
// cut off, from an older version, or hand-edited, and none of that may crash the app.
// Each field is checked on its own: anything unusable falls back to its default.
export function parseSettings(raw: string | null): Settings {
  const fallback = defaultSettings();
  if (raw === null) return fallback;

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return fallback;
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) return fallback;
  const d = data as Record<string, unknown>;

  return {
    sound: bool(d.sound, fallback.sound),
    // The first version called this "haptics".
    vibration: bool(d.vibration, bool(d.haptics, fallback.vibration)),
    turnAlertSound: bool(d.turnAlertSound, fallback.turnAlertSound),
    textSize: TEXT_SIZES.includes(d.textSize as TextSize) ? (d.textSize as TextSize) : fallback.textSize,
    highContrast: bool(d.highContrast, fallback.highContrast),
    reduceMotion: typeof d.reduceMotion === "boolean" ? d.reduceMotion : null,
    reduceFlashes: bool(d.reduceFlashes, fallback.reduceFlashes),
    turnClock: isClockSeconds(d.turnClock) ? d.turnClock : fallback.turnClock,
    gameSpeed: isGameSpeed(d.gameSpeed) ? d.gameSpeed : fallback.gameSpeed,
    ignoreDoubleTaps: bool(d.ignoreDoubleTaps, fallback.ignoreDoubleTaps),
    showBustOdds: bool(d.showBustOdds, fallback.showBustOdds),
    swapSides: bool(d.swapSides, fallback.swapSides),
    hideChat: bool(d.hideChat, fallback.hideChat),
    table: parseTable(d.table),
    profile: parseProfile(d.profile),
    since: typeof d.since === "number" && Number.isFinite(d.since) && d.since > 0 ? d.since : null,
    stats: parseStats(d.stats),
    tipsDone: bool(d.tipsDone, fallback.tipsDone),
    helpSeen: parseHelpSeen(d.helpSeen),
  };
}

export function serializeSettings(settings: Settings): string {
  return JSON.stringify(settings);
}

// "Delete my profile and data": the player's identity and record go, their preferences stay.
// The tips and the card pop-ups start over too, as they would for a brand new player.
export function deleteProfile(settings: Settings): Settings {
  return { ...settings, profile: null, since: null, stats: emptyStats(), tipsDone: false, helpSeen: [], table: { ...DEFAULT_TABLE } };
}
