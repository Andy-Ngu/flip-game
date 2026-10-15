import { MAX_SEATS, defaultSeats, Seat, seatProblem } from "./seats";

// What the app remembers between launches.
export type Settings = {
  haptics: boolean;   // vibration on or off
  sound: boolean;     // sound effects on or off
  seats: Seat[];      // the players from the last game that was started
};

export const SETTINGS_KEY = "stack-seven/settings/v1";

export function defaultSettings(): Settings {
  return { haptics: true, sound: true, seats: defaultSeats() };
}

const KINDS = ["human", "easy", "medium", "hard"];

function isSeat(x: unknown): x is Seat {
  if (typeof x !== "object" || x === null) return false;
  const s = x as Record<string, unknown>;
  return typeof s.name === "string" && typeof s.kind === "string" && KINDS.includes(s.kind);
}

// Turn whatever was stored into settings the app can trust. Stored text can be missing,
// cut off, from an older version, or hand-edited, and none of that may crash the app or
// start a game that the setup screen would not allow. Anything unusable falls back to the default.
export function parseSettings(raw: string | null): Settings {
  const fallback = defaultSettings();
  if (raw === null) return fallback;

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return fallback;
  }
  if (typeof data !== "object" || data === null) return fallback;
  const d = data as Record<string, unknown>;

  const haptics = typeof d.haptics === "boolean" ? d.haptics : fallback.haptics;

  const sound = typeof d.sound === "boolean" ? d.sound : fallback.sound;

  let seats = fallback.seats;
  if (Array.isArray(d.seats) && d.seats.length <= MAX_SEATS && d.seats.every(isSeat)) {
    const candidate = d.seats.map((s) => ({ name: s.name, kind: s.kind }));
    if (seatProblem(candidate) === null) seats = candidate;
  }

  return { haptics, sound, seats };
}

export function serializeSettings(settings: Settings): string {
  return JSON.stringify(settings);
}
