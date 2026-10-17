import { Feel, streakFeel } from "./events";
import { hasSevenStack } from "./scoring";
import { drawSound, SoundName } from "./sounds";
import { Player } from "./types";

// The score counting that plays when you stay: your cards light up one after another, each adds its
// points to the round score, and the last one gets a bigger finish. This file works out WHAT happens
// and WHEN (so it can be tested); the table screen turns it into lifting cards, numbers and sounds.

export type CountKind = "number" | "double" | "bonus" | "stack";

export type CountStep = {
  kind: CountKind;
  cardIndex: number | null;   // which card in the hand lights up (null for the Seven Stack bonus, which is not one card)
  label: string;              // what flies up from the card: "+7", "×2", "+4", "+15"
  total: number;              // the round score once this step has been added
};

// The steps in the order the score is worked out: the number cards (left to right), then Double Score,
// then the bonus cards, then the Seven Stack. The last step's total is always the hand's score
// (the same as scoreHand). A busted hand scores nothing, so it has no steps.
export function countSteps(player: Player): CountStep[] {
  if (player.status === "busted") return [];
  const steps: CountStep[] = [];
  let total = 0;

  player.hand.forEach((card, i) => {
    if (card.kind !== "number") return;
    total += card.value;
    steps.push({ kind: "number", cardIndex: i, label: `+${card.value}`, total });
  });

  const doubleAt = player.hand.findIndex((c) => c.kind === "modifier" && c.multiplier === 2);
  if (doubleAt >= 0) {
    total *= 2;
    steps.push({ kind: "double", cardIndex: doubleAt, label: "×2", total });
  }

  player.hand.forEach((card, i) => {
    if (card.kind !== "modifier" || card.bonus <= 0) return;
    total += card.bonus;
    steps.push({ kind: "bonus", cardIndex: i, label: `+${card.bonus}`, total });
  });

  if (hasSevenStack(player)) {
    total += 15;
    steps.push({ kind: "stack", cardIndex: null, label: "+15", total });
  }
  return steps;
}

// ---------- timing ----------

// (Slowed down after feedback: at 340 ms a card the numbers went by too fast to read.)
export const COUNT_FIRST_MS = 450;    // a beat before the first card lights up, so the eye gets to the score box first
export const COUNT_STEP_MS = 520;     // between one card and the next: long enough to read each "+7" before the next arrives
export const COUNT_FINISH_MS = 450;   // the extra pause before the last card, so it feels like an arrival

// How long after the count starts step `index` happens (before the Game speed setting is applied).
export function stepTime(index: number, count: number): number {
  const lastExtra = count > 1 && index === count - 1 ? COUNT_FINISH_MS : 0;
  return COUNT_FIRST_MS + index * COUNT_STEP_MS + lastExtra;
}

// How long the whole count takes, including the moment after the last card.
export function countDuration(count: number): number {
  return count === 0 ? 0 : stepTime(count - 1, count) + COUNT_STEP_MS;
}

// ---------- how it sounds and feels ----------

// The note climbs a step with each card, exactly like the card flick climbs when you draw several in a row.
export function stepSound(index: number): SoundName {
  return drawSound(index + 1);
}

// The buzz gets firmer with each card, and the last card of a good score ends with a success buzz.
export function stepFeel(index: number, count: number, total: number): Feel {
  if (index === count - 1 && count > 1 && finishSize(total) !== "normal") return "success";
  return streakFeel(index + 1);
}

// How big the finish is: a bigger pop and glow for bigger scores.
export type Finish = "normal" | "big" | "huge";
export const BIG_SCORE = 25;
export const HUGE_SCORE = 45;

export function finishSize(total: number): Finish {
  return total >= HUGE_SCORE ? "huge" : total >= BIG_SCORE ? "big" : "normal";
}
