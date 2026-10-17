import { cardKey, faceFor } from "./cardFace";
import { CARD_W, handSlots } from "./handLayout";
import { createDeck, DECK_SIZE } from "./deck";
import { describeCard, describeTile, STATUS_LABEL, tileStatus } from "./describe";
import { Card, Player } from "./types";
import { pointsText } from "./words";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failures++;
}
const num = (value: number): Card => ({ kind: "number", value });

console.log("--- Card faces ---");
check("a number card shows its number", faceFor(num(10)).center === "10" && faceFor(num(10)).corner === "10");
check("zero is shown as 0", faceFor(num(0)).center === "0");
const paper = (v: number) => faceFor(num(v)).bg;
const ink = (v: number) => faceFor(num(v)).ink;
const all13 = Array.from({ length: 13 }, (_, v) => v);
check("every number from 0 to 12 has its own paper shade", new Set(all13.map(paper)).size === 13);
check("every number from 0 to 12 has its own ink shade", new Set(all13.map(ink)).size === 13);
check("a card's outline is its ink colour", all13.every((v) => faceFor(num(v)).outline === ink(v) && !faceFor(num(v)).thick));

// Lighter is lower, deeper is higher, inside each colour family.
const lightness = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
};
const families = [[0, 1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]];
check("inside each colour the paper gets deeper as the number goes up",
  families.every((f) => f.every((v, i) => i === 0 || lightness(paper(v)) < lightness(paper(f[i - 1])))));
check("inside each colour the ink gets deeper as the number goes up",
  families.every((f) => f.every((v, i) => i === 0 || lightness(ink(v)) < lightness(ink(f[i - 1])))));

// Hue of a colour, to check the families really are four different colours.
const hue = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((x) => x / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
};
const hueSpread = (f: number[]) => Math.max(...f.map((v) => hue(ink(v)))) - Math.min(...f.map((v) => hue(ink(v))));
check("the numbers in one family are the same colour (hue within 25 degrees)", families.every((f) => hueSpread(f) < 25));
check("the four families are four clearly different colours",
  new Set(families.map((f) => Math.round(hue(ink(f[0])) / 40))).size === 4);

// Text contrast, as defined for web accessibility (WCAG): the ink must be easy to read on its paper.
const channel = (x: number) => { const c = x / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel(n >> 16) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
check("every number card is easy to read (contrast 4.5 to 1 or better)", all13.every((v) => contrast(paper(v), ink(v)) >= 4.5));
const others: Card[] = [
  { kind: "action", action: "timeOut" }, { kind: "action", action: "drawThree" }, { kind: "action", action: "shield" },
  { kind: "modifier", bonus: 4, multiplier: 1 }, { kind: "modifier", bonus: 0, multiplier: 2 },
];
check("so is every action and bonus card", others.every((c) => contrast(faceFor(c).bg, faceFor(c).ink) >= 4.5));

console.log("\n--- High contrast ---");
check("high contrast makes every number card white with black writing", all13.every((v) => {
  const f = faceFor(num(v), true);
  return f.bg === "#FFFFFF" && f.ink === "#000000";
}));
check("high contrast outlines are thick and in the family colour",
  all13.every((v) => faceFor(num(v), true).thick) &&
  new Set(families.map((f) => faceFor(num(f[0]), true).outline)).size === 4 &&
  families.every((f) => new Set(f.map((v) => faceFor(num(v), true).outline)).size === 1));
check("high contrast outlines are not the pale shades", all13.every((v) => contrast("#FFFFFF", faceFor(num(v), true).outline) >= 4.5));
check("action and bonus cards go white too", others.every((c) => faceFor(c, true).bg === "#FFFFFF" && faceFor(c, true).ink === "#000000" && faceFor(c, true).thick));
check("6 and 9 stay underlined in high contrast", faceFor(num(6), true).underline && faceFor(num(9), true).underline && !faceFor(num(8), true).underline);
console.log("\n--- Faces ---");
check("a +4 bonus reads +4", faceFor({ kind: "modifier", bonus: 4, multiplier: 1 }).center === "+4");
check("the double card reads ×2", faceFor({ kind: "modifier", bonus: 0, multiplier: 2 }).center === "×2" && faceFor({ kind: "modifier", bonus: 0, multiplier: 2 }).title === "DOUBLE SCORE");
check("timeOut has its own title", faceFor({ kind: "action", action: "timeOut" }).title === "TIME OUT" && faceFor({ kind: "action", action: "timeOut" }).icon === "clock");
check("draw three has its own title", faceFor({ kind: "action", action: "drawThree" }).title === "DRAW THREE" && faceFor({ kind: "action", action: "drawThree" }).icon === "three");
check("shield has its own title", faceFor({ kind: "action", action: "shield" }).title === "SHIELD" && faceFor({ kind: "action", action: "shield" }).icon === "shield");
check("action cards say ACTION on top and bonus cards say BONUS", faceFor({ kind: "action", action: "shield" }).top === "ACTION" && faceFor({ kind: "modifier", bonus: 2, multiplier: 1 }).top === "BONUS" && faceFor({ kind: "modifier", bonus: 0, multiplier: 2 }).top === "MODIFIER");
const deck = createDeck();
check("6 and 9 are underlined", faceFor(num(6)).underline && faceFor(num(9)).underline);
check("no other card is underlined", deck.every((c) => faceFor(c).underline === (c.kind === "number" && (c.value === 6 || c.value === 9))));
check("only number cards have corner marks", deck.every((c) => (faceFor(c).corner !== null) === (c.kind === "number")));
check("card labels use the new names",
  describeCard({ kind: "action", action: "timeOut" }) === "Action: Time Out" &&
  describeCard({ kind: "action", action: "drawThree" }) === "Action: Draw Three" &&
  describeCard({ kind: "action", action: "shield" }) === "Action: Shield" &&
  describeCard({ kind: "modifier", bonus: 4, multiplier: 1 }) === "Bonus +4" &&
  describeCard({ kind: "modifier", bonus: 0, multiplier: 2 }) === "Double Score");
check("every card in the deck has a face", deck.every((c) => { const f = faceFor(c); return f.center !== "" && f.corner !== "" && f.bg && f.ink && f.outline; }));
check("the three kinds of card look different",
  new Set([faceFor(num(5)).bg, faceFor({ kind: "action", action: "timeOut" }).bg, faceFor({ kind: "modifier", bonus: 2, multiplier: 1 }).bg]).size === 3);

console.log("\n--- Card keys ---");
const a = num(3), b = num(3);
check("the same card always gets the same key", cardKey(a) === cardKey(a));
check("two equal-looking cards get different keys", cardKey(a) !== cardKey(b));
check("every card in the deck has its own key", new Set(deck.map(cardKey)).size === deck.length);

console.log("\n--- Hand layout ---");
const W = 300;
check("no cards means no slots", handSlots(0, W).length === 0);
const one = handSlots(1, W);
check("a single card sits in the center, untilted", one.length === 1 && Math.abs(one[0].x - (W - CARD_W) / 2) < 0.01 && one[0].rotate === 0);
for (const n of [2, 3, 5, 7, 9, 12]) {
  const s = handSlots(n, W);
  check(`${n} cards all fit inside the hand`, s.every((x) => x.x >= -0.01 && x.x + CARD_W <= W + 0.01));
  check(`${n} cards go left to right`, s.every((x, i) => i === 0 || x.x > s[i - 1].x));
}
const three = handSlots(3, W);
check("the fan is symmetric", Math.abs(three[0].rotate + three[2].rotate) < 0.001 && three[1].rotate === 0);
check("the middle card sits highest in the arc", three[1].lift < three[0].lift && three[1].lift < three[2].lift);
const roomy = handSlots(3, 400);
check("with room to spare, cards don't overlap", roomy[1].x - roomy[0].x >= CARD_W);
const tight = handSlots(9, W);
check("when crowded, cards overlap", tight[1].x - tight[0].x < CARD_W);
check("the whole fan never tilts more than 16 degrees", handSlots(12, W).every((s) => Math.abs(s.rotate) <= 8.01));
const five = handSlots(5, 316, 68);
check("five cards in the mockup's hand: 62 px apart, leaning 4 degrees each, ends 12 px lower",
  five.every((s, i) => i === 0 || Math.abs(s.x - five[i - 1].x - 62) < 0.01) && five[0].rotate === -8 && five[4].rotate === 8 && Math.abs(five[0].lift - 12) < 0.01);
// A big hand does not sag over the bars under it: the ends are never more than 12 px lower than the middle.
check("a big hand sags no more than 12 px (13 cards were 36 px lower before)", [6, 8, 13, 20, 30].every((n) => Math.max(...handSlots(n, 316, 58).map((s) => s.lift)) <= 12.01));
check("the sag is the same on both sides and lowest in the middle", (() => {
  const s = handSlots(13, 316, 58);
  return s.every((x, i) => Math.abs(x.lift - s[12 - i].lift) < 0.001) && s[6].lift === 0 && s[0].lift > s[3].lift && s[3].lift > s[6].lift;
})());
check("small hands are drawn as they were: up to five cards sag by the old curve", [1, 2, 3, 4, 5].every((n) => {
  const mid = (n - 1) / 2;
  const arc = 3 * Math.min(1, 4 / Math.max(1, n - 1));
  return handSlots(n, 316, 68).every((s, i) => Math.abs(s.lift - (i - mid) * (i - mid) * arc) < 0.001);
}));
const small = handSlots(5, 300, 58);
check("smaller cards still fit and stay in order", small.every((x, i) => x.x >= -0.01 && x.x + 58 <= 300.01 && (i === 0 || x.x > small[i - 1].x)));
check("describeCard still labels every card", deck.every((c) => describeCard(c).length > 0));

check("the deck has the size the table says it has", createDeck().length === DECK_SIZE && DECK_SIZE === 94);

console.log("\n--- What a tile says ---");
const tilePlayer = (status: Player["status"], hand: Card[] = [num(9), num(5)]): Player => ({ id: "f", name: "Fizz", hand, totalScore: 177, status });
check("a player still in is on their turn or waiting", tileStatus(tilePlayer("playing"), true) === "turn" && tileStatus(tilePlayer("playing"), false) === "waiting");
check("stayed, busted and timed out override the turn", tileStatus(tilePlayer("stayed"), true) === "stayed" && tileStatus(tilePlayer("busted"), false) === "bust" && tileStatus(tilePlayer("timedOut"), false) === "out");
check("every status has a label", (["turn", "waiting", "stayed", "bust", "out"] as const).every((k) => STATUS_LABEL[k].length > 0));
check("the spoken summary names the player, status, points and cards",
  describeTile(tilePlayer("playing"), true) === "Fizz, their turn. 177 points in total, 14 this round. Number 9, Number 5.");
check("an empty hand is described", describeTile(tilePlayer("playing", []), false).endsWith("no cards yet."));
check("one point is a point, not 'points'", pointsText(1) === "1 point" && pointsText(0) === "0 points" && pointsText(15) === "15 points");
check("a tile with one point says so", describeTile({ ...tilePlayer("playing", []), totalScore: 1 }, false).includes("1 point in total"));

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
