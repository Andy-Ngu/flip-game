import { cardKey, faceFor } from "./cardFace";
import { CARD_W, handSlots } from "./handLayout";
import { createDeck } from "./deck";
import { describeCard } from "./describe";
import { Card } from "./types";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failures++;
}
const num = (value: number): Card => ({ kind: "number", value });

console.log("--- Card faces ---");
check("a number card shows its number", faceFor(num(10)).center === "10" && faceFor(num(10)).corner === "10");
check("zero is shown as 0", faceFor(num(0)).center === "0");
const tierColor = (v: number) => faceFor(num(v)).accent;
check("0 to 3 share a color", new Set([0, 1, 2, 3].map(tierColor)).size === 1);
check("4 to 6 share a color", new Set([4, 5, 6].map(tierColor)).size === 1);
check("7 to 9 share a color", new Set([7, 8, 9].map(tierColor)).size === 1);
check("10 to 12 share a color", new Set([10, 11, 12].map(tierColor)).size === 1);
check("the four number tiers are four different colors", new Set([0, 4, 7, 10].map(tierColor)).size === 4);
check("a +4 bonus reads +4", faceFor({ kind: "modifier", bonus: 4, multiplier: 1 }).center === "+4");
check("the double card reads ×2", faceFor({ kind: "modifier", bonus: 0, multiplier: 2 }).center === "×2");
check("timeOut has its own title", faceFor({ kind: "action", action: "timeOut" }).title === "TIME OUT");
check("draw three has its own title", faceFor({ kind: "action", action: "drawThree" }).title === "DRAW 3");
check("shield has its own title", faceFor({ kind: "action", action: "shield" }).title === "SHIELD");
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
check("every card in the deck has a face", deck.every((c) => { const f = faceFor(c); return f.center !== "" && f.corner !== "" && f.bg && f.accent; }));
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
check("the whole fan never tilts more than 12 degrees", handSlots(12, W).every((s) => Math.abs(s.rotate) <= 6.01));
check("describeCard still labels every card", deck.every((c) => describeCard(c).length > 0));

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
