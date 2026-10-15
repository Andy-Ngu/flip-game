import { Card } from "./types";

// What a card looks like, worked out from the card itself. Kept free of any
// React Native code so it can be tested like the rest of the game.
export type Face = {
  corner: string | null; // small text in the top-left and bottom-right corners (number cards only)
  center: string;        // large text in the middle (also the fallback label when an icon is drawn)
  title: string | null;  // small caption under the middle (action and modifier cards)
  bg: string;            // card paper color
  accent: string;        // text and outline color
  icon: "pause" | "shield" | null; // action cards that are drawn with shapes instead of a text symbol
  underline: boolean;    // 6 and 9 are underlined, so they can be told apart when a card is upside down
};

// Number cards run from cool to hot, so a glance tells you how risky a number is:
// the high numbers are the most common ones in the deck and the likeliest to bust you.
const TIERS = [
  { upTo: 3, bg: "#E3F4EE", accent: "#1F8A70" },  // 0-3  cool green
  { upTo: 6, bg: "#E6EEFB", accent: "#2F5FC4" },  // 4-6  blue
  { upTo: 9, bg: "#FBEBD9", accent: "#C2570F" },  // 7-9  orange
  { upTo: 12, bg: "#FBE1E1", accent: "#C0262D" }, // 10-12 red
];

export function faceFor(card: Card): Face {
  if (card.kind === "number") {
    const tier = TIERS.find((t) => card.value <= t.upTo) ?? TIERS[TIERS.length - 1];
    return { corner: String(card.value), center: String(card.value), title: null, bg: tier.bg, accent: tier.accent, icon: null, underline: card.value === 6 || card.value === 9 };
  }
  if (card.kind === "action") {
    switch (card.action) {
      case "timeOut":
        return { corner: null, center: "II", title: "TIME OUT", bg: "#DDF1FB", accent: "#1B77B8", icon: "pause", underline: false };
      case "drawThree":
        return { corner: null, center: "↻", title: "DRAW 3", bg: "#EBE0FA", accent: "#6A3FB5", icon: null, underline: false };
      case "shield":
        return { corner: null, center: "S", title: "SHIELD", bg: "#E0F5E1", accent: "#2E8B3E", icon: "shield", underline: false };
    }
  }
  const text = card.multiplier === 2 ? "×2" : `+${card.bonus}`;
  return { corner: null, center: text, title: card.multiplier === 2 ? "DOUBLE" : "BONUS", bg: "#FFF3C4", accent: "#9A6B00", icon: null, underline: false };
}

// A stable key for each card, so React can tell cards apart even as a hand
// changes shape. The engine keeps the same card objects, so object identity works.
const ids = new WeakMap<object, number>();
let nextId = 1;
export function cardKey(card: Card): number {
  let id = ids.get(card);
  if (id === undefined) {
    id = nextId++;
    ids.set(card, id);
  }
  return id;
}
