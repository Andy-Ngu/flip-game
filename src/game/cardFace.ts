import { Card } from "./types";

// What a card looks like, worked out from the card itself. Kept free of any
// React Native code so it can be tested like the rest of the game.
export type Face = {
  corner: string | null; // small text in the top-left and bottom-right corners (number cards only)
  center: string;        // large text in the middle (also the fallback label when an icon is drawn)
  top: string | null;    // small caption at the top (action and modifier cards): ACTION, BONUS or MODIFIER
  title: string | null;  // small caption at the bottom (action and modifier cards): the card's name
  bg: string;            // card paper color
  ink: string;           // text and icon color
  outline: string;       // border color
  thick: boolean;        // a thick border (the high contrast look)
  icon: "shield" | "clock" | "three" | null; // action cards that are drawn with shapes instead of a text symbol
  underline: boolean;    // 6 and 9 are underlined, so they can be told apart when a card is upside down
};

// Number cards run from cool to hot, so a glance tells you how risky a number is: the high numbers
// are the most common ones in the deck and the likeliest to bust you. Each number gets its own step
// inside its colour: lighter is lower, deeper is higher. [paper, ink]. Every pair has a text
// contrast of at least 4.5 to 1 (the card tests check it).
const SHADES: [string, string][] = [
  ["#EAF8F2", "#177560"], ["#D8F1E6", "#146A56"], ["#C6EADB", "#11604D"], ["#B4E3CF", "#0E5543"], // 0-3 green
  ["#E8F0FC", "#2F5FC4"], ["#CEDEF7", "#234AA7"], ["#B5CBF2", "#17368A"],                         // 4-6 blue
  ["#FCEEDD", "#A94A0A"], ["#F9DCBB", "#933F08"], ["#F5C998", "#7D3405"],                         // 7-9 orange
  ["#FCE6E6", "#C0262D"], ["#F7CCCC", "#9F1A22"], ["#F2B1B1", "#7E0F16"],                         // 10-12 red
];

// The colour family of a number, used for the thick outline in high contrast.
const FAMILIES = ["#177560", "#2F5FC4", "#A94A0A", "#C0262D"];
export const familyOf = (value: number): number => Math.min(3, Math.floor(Math.max(0, value - 1) / 3));

const WHITE = "#FFFFFF";
const BLACK = "#000000";

type Look = { bg: string; ink: string };

// Action and bonus cards keep one look each. The Shield green and the Bonus gold are a touch deeper than
// in the first sketches, so their small captions also reach a contrast of 4.5 to 1.
const ACTION_LOOK: Record<"timeOut" | "drawThree" | "shield", Look> = {
  timeOut: { bg: "#E1F0FC", ink: "#2468A8" },
  drawThree: { bg: "#F1E6FB", ink: "#7A3FB0" },
  shield: { bg: "#E0F5E1", ink: "#287A36" },
};
const BONUS_LOOK: Look = { bg: "#FFF3C4", ink: "#906400" };
const DOUBLE_LOOK: Look = { bg: "#FFE3C2", ink: "#9A4B00" };

// With high contrast on, the shading steps are dropped: every card is plain white with black
// writing and a thick outline in its own colour.
function styled(look: Look, highContrast: boolean, outlineForHighContrast: string): Pick<Face, "bg" | "ink" | "outline" | "thick"> {
  return highContrast
    ? { bg: WHITE, ink: BLACK, outline: outlineForHighContrast, thick: true }
    : { bg: look.bg, ink: look.ink, outline: look.ink, thick: false };
}

export function faceFor(card: Card, highContrast = false): Face {
  if (card.kind === "number") {
    const value = Math.max(0, Math.min(12, card.value));
    const [bg, ink] = SHADES[value];
    return {
      corner: String(card.value), center: String(card.value), top: null, title: null,
      ...styled({ bg, ink }, highContrast, FAMILIES[familyOf(value)]),
      icon: null, underline: card.value === 6 || card.value === 9,
    };
  }
  if (card.kind === "action") {
    const look = ACTION_LOOK[card.action];
    const text = {
      timeOut: { center: "II", title: "TIME OUT", icon: "clock" as const },
      drawThree: { center: "3", title: "DRAW THREE", icon: "three" as const },
      shield: { center: "S", title: "SHIELD", icon: "shield" as const },
    }[card.action];
    return {
      corner: null, center: text.center, top: "ACTION", title: text.title,
      ...styled(look, highContrast, look.ink), icon: text.icon, underline: false,
    };
  }
  const double = card.multiplier === 2;
  const look = double ? DOUBLE_LOOK : BONUS_LOOK;
  return {
    corner: null, center: double ? "×2" : `+${card.bonus}`, top: double ? "MODIFIER" : "BONUS",
    title: double ? "DOUBLE SCORE" : "BONUS",
    ...styled(look, highContrast, look.ink), icon: null, underline: false,
  };
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
