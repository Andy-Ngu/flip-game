import { GameEvent } from "./events";

// Every sound effect in the game (one file each in assets/sounds).
// draw2 to draw5 are the same card flick with a note that climbs: the more cards you have
// drawn in a row, the higher it goes.
export type SoundName =
  | "draw" | "draw2" | "draw3" | "draw4" | "draw5"
  | "deal" | "stay" | "bust" | "timeOut" | "shield" | "sevenStack" | "roundEnd" | "win"
  | "yourTurn" | "tick" | "shuffle" | "ask";

// A sound to play, and how many milliseconds from now to play it.
export type Cue = { sound: SoundName; at: number };

// Cards arrive one after another (Draw Three deals three), so each one gets its own flick.
export const CARD_GAP_MS = 130;
// The outcome of a draw (a bust, a Shield) lands just after the card does.
export const OUTCOME_LAG_MS = 160;
// When the deck is reshuffled first, the card follows the shuffle sound: the riffle is about a second
// long and ends with a thud, and the card is heard once the stack has landed.
export const RESHUFFLE_LAG_MS = 1100;
// Never queue more than this many flicks, so a long move doesn't turn into a machine gun.
const MAX_FLICKS = 4;

// The flick for the card you just drew, given how many cards you now hold.
// Card 1 is the plain flick; each card after it is a step higher, up to the fifth.
export function drawSound(count: number): SoundName {
  if (count <= 1) return "draw";
  if (count === 2) return "draw2";
  if (count === 3) return "draw3";
  if (count === 4) return "draw4";
  return "draw5";
}

// What should be heard for one batch of events? Like feelFor, but for the ears:
// the cards make their flick sounds first, then the single most important outcome.
// `me` is the seat of the person holding the phone.
// `gap` is the time between two flicks: slower than usual when the cards are shown arriving one by one.
export function soundsFor(events: GameEvent[], me: number, gap: number = CARD_GAP_MS): Cue[] {
  if (events.length === 0) return [];

  // Starting a round or a game: one dealing flurry, nothing else.
  if (events.some((e) => e.kind === "newRound")) return [{ sound: "deal", at: 0 }];

  // The end of the game: the fanfare if you won, otherwise the calmer round-end chime.
  const over = events.find((e) => e.kind === "gameOver");
  if (over && over.kind === "gameOver") {
    return [{ sound: over.winners.includes(me) ? "win" : "roundEnd", at: 0 }];
  }

  const cues: Cue[] = [];
  const shuffled = events.some((e) => e.kind === "reshuffle");
  const offset = shuffled ? RESHUFFLE_LAG_MS : 0;
  if (shuffled) cues.push({ sound: "shuffle", at: 0 });

  const drawn = events.filter((e) => e.kind === "card");
  const flicks = Math.min(drawn.length, MAX_FLICKS);
  for (let i = 0; i < flicks; i++) {
    const e = drawn[i];
    const sound = e.kind === "card" && e.player === me ? drawSound(e.count) : "draw";
    cues.push({ sound, at: offset + i * gap });
  }

  // The most important thing that happened, if anything: later in this list wins.
  const outcome: SoundName | null = events.some((e) => e.kind === "sevenStack") ? "sevenStack"
    : events.some((e) => e.kind === "bust") ? "bust"
    : events.some((e) => e.kind === "timedOut") ? "timeOut"
    : events.some((e) => e.kind === "saved") ? "shield"
    : events.some((e) => e.kind === "stay") ? "stay"
    : null;

  if (outcome !== null) {
    const after = flicks > 0 ? (flicks - 1) * gap + OUTCOME_LAG_MS : 0;
    cues.push({ sound: outcome, at: offset + after });
  }
  return cues;
}
