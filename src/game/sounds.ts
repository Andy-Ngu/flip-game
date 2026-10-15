import { GameEvent } from "./events";
import { Player } from "./types";

// Every sound effect in the game (one file each in assets/sounds).
export type SoundName =
  | "draw" | "deal" | "stay" | "bust" | "timeOut" | "shield" | "sevenStack" | "roundEnd" | "win";

// A sound to play, and how many milliseconds from now to play it.
export type Cue = { sound: SoundName; at: number };

// Cards arrive one after another (Draw Three deals three), so each one gets its own flick.
export const CARD_GAP_MS = 130;
// The outcome of a draw (a bust, a Shield) lands just after the card does.
export const OUTCOME_LAG_MS = 160;
// Never queue more than this many flicks, so a long move doesn't turn into a machine gun.
const MAX_FLICKS = 4;

// What should be heard for one batch of events? Like feelFor, but for the ears:
// the cards make their flick sounds first, then the single most important outcome.
export function soundsFor(events: GameEvent[], players: Player[]): Cue[] {
  if (events.length === 0) return [];

  // Starting a round or a game: one dealing flurry, nothing else.
  if (events.some((e) => e.kind === "newRound")) return [{ sound: "deal", at: 0 }];

  // The end of the game: the fanfare if a human won, otherwise the calmer round-end chime.
  const over = events.find((e) => e.kind === "gameOver");
  if (over && over.kind === "gameOver") {
    const humanWon = over.winners.some((i) => players[i]?.bot === undefined);
    return [{ sound: humanWon ? "win" : "roundEnd", at: 0 }];
  }

  const cues: Cue[] = [];
  const cards = events.filter((e) => e.kind === "card").length;
  const flicks = Math.min(cards, MAX_FLICKS);
  for (let i = 0; i < flicks; i++) cues.push({ sound: "draw", at: i * CARD_GAP_MS });

  // The most important thing that happened, if anything: later in this list wins.
  const outcome: SoundName | null = events.some((e) => e.kind === "sevenStack") ? "sevenStack"
    : events.some((e) => e.kind === "bust") ? "bust"
    : events.some((e) => e.kind === "timedOut") ? "timeOut"
    : events.some((e) => e.kind === "saved") ? "shield"
    : events.some((e) => e.kind === "stay") ? "stay"
    : null;

  if (outcome !== null) {
    const after = flicks > 0 ? (flicks - 1) * CARD_GAP_MS + OUTCOME_LAG_MS : 0;
    cues.push({ sound: outcome, at: after });
  }
  return cues;
}
