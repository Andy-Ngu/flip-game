import { createDeck } from "./deck";
import { GameEvent } from "./events";
import { ActionCard, Card, ModifierCard } from "./types";
import { pointsText } from "./words";

// Card help: the short pop-up shown the first time each kind of special card turns up, the longer
// text you get by pressing and holding any card, and the three first-game tips. All the words live
// here (not in the screens) so the tests can check them against the rules.

// ---------- what gets a one-time explanation ----------

// Plain number cards never do: everybody knows what a 7 is. Everything else is explained once.
export const HELP_KEYS = ["timeOut", "drawThree", "shield", "doubleScore", "bonus", "sevenStack"] as const;
export type HelpKey = (typeof HELP_KEYS)[number];

export function isHelpKey(x: unknown): x is HelpKey {
  return typeof x === "string" && (HELP_KEYS as readonly string[]).includes(x);
}

export type HelpText = {
  title: string;   // the name, in capitals, as it is shown on the pop-up and the sheet
  line: string;    // one or two short sentences for the pop-up
  long: string;    // two or three sentences for press and hold
};

export const HELP: Record<HelpKey, HelpText> = {
  shield: {
    title: "SHIELD",
    line: "Blocks your next duplicate. You can only hold one.",
    long:
      "A Shield protects you from one duplicate. If you draw a number you already have, the Shield is used up and the duplicate is thrown away, so you do not bust. " +
      "You can only hold one Shield at a time, so a second one is passed to a player who has none.",
  },
  timeOut: {
    title: "TIME OUT",
    line: "Freezes a player for the rest of the round. They keep their points.",
    long:
      "When you draw Time Out, you pick a player who is still in the round, and you can pick yourself. " +
      "That player is out until the next round and cannot draw any more cards. " +
      "They keep the points they already have, because only a bust scores 0.",
  },
  drawThree: {
    title: "DRAW THREE",
    line: "Pick a player. They draw three cards.",
    long:
      "When you draw Draw Three, you pick a player who is still in the round, and you can pick yourself. " +
      "They must draw three cards, one after another, but it stops early if they bust or make a Seven Stack. " +
      "If they reveal a Time Out or another Draw Three on the way, it is played after the three cards.",
  },
  doubleScore: {
    title: "DOUBLE SCORE",
    line: "Doubles your number cards. Bonus cards are added after.",
    long:
      "Double Score doubles the total of your number cards. " +
      "Bonus cards and the 15 for a Seven Stack are added after the doubling, so they are never doubled. " +
      "A bust still scores 0.",
  },
  bonus: {
    title: "BONUS",
    line: "Adds extra points to your round. You keep them unless you bust.",
    long:
      "A Bonus card adds its points to your score for the round, on top of your number cards. " +
      "If you also have a Double Score, the bonus is added after the doubling. " +
      "If you bust, the whole round scores 0, bonus included.",
  },
  sevenStack: {
    title: "SEVEN STACK",
    line: "Seven different numbers ends the round and adds 15 points.",
    long:
      "Collect seven different numbers in one round to make a Seven Stack. " +
      "The round ends right away and you get 15 extra points on top of your cards. " +
      "Action cards and bonus cards do not count as numbers.",
  },
};

// The pop-up also reminds you that every card can be held down for more.
export const HOLD_HINT = "Press and hold any card to read about it.";

// ---------- which cards and events explain themselves ----------

// Which explanation a special card (anything but a number) belongs to.
function keyOfSpecial(card: ActionCard | ModifierCard): HelpKey {
  if (card.kind === "action") return card.action;
  return card.multiplier === 2 ? "doubleScore" : "bonus";
}

// Number cards have no help of their own, so they give null.
export function helpKeyFor(card: Card): HelpKey | null {
  return card.kind === "number" ? null : keyOfSpecial(card);
}

// The first thing in these events that the player has not had explained yet, or null.
// A card that arrives in a hand explains itself; so does a Seven Stack being completed.
export function nextHelp(events: readonly GameEvent[], seen: readonly HelpKey[]): HelpKey | null {
  for (const e of events) {
    const key: HelpKey | null = e.kind === "card" ? helpKeyFor(e.card) : e.kind === "sevenStack" ? "sevenStack" : null;
    if (key !== null && !seen.includes(key)) return key;
  }
  return null;
}

// The same for cards that are simply lying on the table (the first cards dealt in a round do not
// come with events, so the screen can look at the hands instead).
export function nextHelpForCards(cards: readonly Card[], seen: readonly HelpKey[]): HelpKey | null {
  for (const card of cards) {
    const key = helpKeyFor(card);
    if (key !== null && !seen.includes(key)) return key;
  }
  return null;
}

// The list of things already explained, with one more added. The old list is left alone.
export function markSeen(seen: readonly HelpKey[], key: HelpKey): HelpKey[] {
  return seen.includes(key) ? [...seen] : [...seen, key];
}

// Whatever was stored, as a list the app can trust: only known keys, each one once.
// Anything that is not a list means nothing has been seen yet.
export function parseHelpSeen(raw: unknown): HelpKey[] {
  if (!Array.isArray(raw)) return [];
  const result: HelpKey[] = [];
  for (const item of raw) {
    if (isHelpKey(item) && !result.includes(item)) result.push(item);
  }
  return result;
}

// A card to draw next to a pop-up. A real card can be passed to the screen; this is for when only
// the kind is known. The Seven Stack is not a card, so it has none.
export function exampleCard(key: HelpKey): Card | null {
  switch (key) {
    case "timeOut": return { kind: "action", action: "timeOut" };
    case "drawThree": return { kind: "action", action: "drawThree" };
    case "shield": return { kind: "action", action: "shield" };
    case "doubleScore": return { kind: "modifier", bonus: 0, multiplier: 2 };
    case "bonus": return { kind: "modifier", bonus: 4, multiplier: 1 };
    case "sevenStack": return null;
  }
}

// ---------- press and hold on any card ----------

// What to say about one particular card: the title and the longer text. Special cards use the
// texts above (a Bonus names its points); a number card says what it is worth and how many of it
// the deck holds, counted from the real deck so it can never be out of date.
export function cardHelpFor(card: Card): { title: string; long: string } {
  if (card.kind === "number") {
    const copies = createDeck().filter((c) => c.kind === "number" && c.value === card.value).length;
    const worth = pointsText(card.value);
    const long =
      copies === 1
        ? `Worth ${worth}. It is the only ${card.value} in the deck, so it can never bust you. It still counts as one of the seven different numbers for a Seven Stack.`
        : `Worth ${worth}. Draw the same number again and you bust, so the round scores 0, unless you hold a Shield. There are ${copies} of them in the deck.`;
    return { title: `NUMBER ${card.value}`, long };
  }
  if (card.kind === "modifier" && card.multiplier !== 2) {
    return {
      title: `BONUS +${card.bonus}`,
      long:
        `This Bonus card adds ${card.bonus} points to your score for the round, on top of your number cards. ` +
        "If you also have a Double Score, the bonus is added after the doubling. " +
        "If you bust, the whole round scores 0, bonus included.",
    };
  }
  const text = HELP[keyOfSpecial(card)];
  return { title: text.title, long: text.long };
}

// ---------- the first-game tips ----------

export type TipId = "hit" | "stack" | "odds";
export type Tip = { id: TipId; text: string };

// Three tips, shown once, in your first game. Each one points at a part of the table.
export const TIPS: readonly Tip[] = [
  { id: "hit", text: "Tap HIT to draw a card. Every new number adds to your score." },
  { id: "stack", text: "Collect 7 different numbers to make a Seven Stack. It ends the round and adds 15 points." },
  { id: "odds", text: "Bust odds show the chance your next card is a number you already have. A duplicate busts you and scores 0." },
];

// The tips to show. With "Show bust odds" switched off there is no bust odds bar to point at,
// so that tip is left out.
export function tipsFor(showBustOdds: boolean): Tip[] {
  return TIPS.filter((t) => showBustOdds || t.id !== "odds");
}
