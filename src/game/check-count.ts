import {
  BIG_SCORE, COUNT_FINISH_MS, COUNT_FIRST_MS, COUNT_STEP_MS, countDuration, countSteps, finishSize, HUGE_SCORE, stepFeel, stepSound, stepTime,
} from "./countSteps";
import { scoreHand } from "./scoring";
import { mk, num, shield, timeOut } from "./testkit";
import { Card } from "./types";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failures++;
}

const hand = (...values: number[]) => values.map(num);
const bonus = (n: number): Card => ({ kind: "modifier", bonus: n, multiplier: 1 });
const double: Card = { kind: "modifier", bonus: 0, multiplier: 2 };

console.log("--- The steps of a count ---");
let steps = countSteps(mk("A", [num(3), num(7), num(11), double, bonus(4)], "stayed"));
check("numbers first, then Double Score, then the bonus (the example from the mockup)", steps.map((s) => s.label).join(" ") === "+3 +7 +11 ×2 +4");
check("the running total goes 3, 10, 21, 42, 46", steps.map((s) => s.total).join(" ") === "3 10 21 42 46");
check("each step names the card that lights up", steps.map((s) => s.cardIndex).join(" ") === "0 1 2 3 4");

steps = countSteps(mk("A", [double, num(5), shield, num(2), bonus(6)], "stayed"));
check("the order follows the score, not the order the cards were drawn", steps.map((s) => s.kind).join(" ") === "number number double bonus");
check("each step points at the right card in the hand", steps.map((s) => s.cardIndex).join(" ") === "1 3 0 4");
check("action cards never light up", !steps.some((s) => s.cardIndex === 2));

steps = countSteps(mk("A", hand(1, 2, 3, 4, 5, 6, 7), "stayed"));
check("a Seven Stack ends with +15, which belongs to no single card", steps.length === 8 && steps[7].kind === "stack" && steps[7].cardIndex === null && steps[7].label === "+15");
check("...and the total includes it", steps[7].total === 28 + 15);

check("a busted hand has nothing to count", countSteps(mk("A", hand(4, 4), "busted")).length === 0);
check("an empty hand has nothing to count", countSteps(mk("A", [], "stayed")).length === 0);
check("a hand of action cards only has nothing to count", countSteps(mk("A", [shield, timeOut], "stayed")).length === 0);

console.log("\n--- The last total is always the real score ---");
const hands: Card[][] = [
  hand(5), hand(12, 11), [num(0), num(1)], [num(6), double], [num(6), bonus(10)], [num(6), double, bonus(10)],
  [bonus(2), double, num(9), num(8)], [...hand(1, 2, 3, 4, 5, 6, 7), double, bonus(10)], [shield, num(3), timeOut, bonus(8)],
  hand(12, 12, 12), [num(0), num(0)], [double], [bonus(4), bonus(6)], [...hand(0, 1, 2, 3, 4, 5, 6), shield],
];
check("for every hand, the last step's total equals scoreHand", hands.every((h) => {
  const p = mk("A", h, "stayed");
  const s = countSteps(p);
  return (s.length === 0 ? 0 : s[s.length - 1].total) === scoreHand(p);
}));
check("a still-playing hand counts the same way", (() => {
  const p = mk("A", [num(4), double], "playing");
  const s = countSteps(p);
  return s[s.length - 1].total === scoreHand(p);
})());
check("totals never go down", hands.every((h) => {
  const s = countSteps(mk("A", h, "stayed"));
  return s.every((x, i) => i === 0 || x.total >= s[i - 1].total);
}));

console.log("\n--- Timing ---");
check("the first card waits a short beat", stepTime(0, 5) === COUNT_FIRST_MS);
check("cards are one step apart", stepTime(2, 5) - stepTime(1, 5) === COUNT_STEP_MS);
check("the last card waits a little longer", stepTime(4, 5) - stepTime(3, 5) === COUNT_STEP_MS + COUNT_FINISH_MS);
check("a single card has no extra wait", stepTime(0, 1) === COUNT_FIRST_MS);
check("the count lasts until just after the last card", countDuration(5) === stepTime(4, 5) + COUNT_STEP_MS);
check("nothing to count means no time", countDuration(0) === 0);
check("each number stays long enough to read (at least half a second apart)", COUNT_STEP_MS >= 500);
check("a full seven card hand is counted in under six seconds", countDuration(8) / 1000 < 6);

console.log("\n--- Sound and buzz ---");
check("the note climbs with each card, up to the fifth", [0, 1, 2, 3, 4, 5, 9].map(stepSound).join(" ") === "draw draw2 draw3 draw4 draw5 draw5 draw5");
check("the buzz gets firmer", stepFeel(0, 8, 10) === "tick" && stepFeel(2, 8, 10) === "light" && stepFeel(4, 8, 10) === "medium");
check("a good score ends with a success buzz", stepFeel(4, 5, 46) === "success");
check("a small score ends quietly", stepFeel(2, 3, 12) === "light");
check("a single small card is just a tick", stepFeel(0, 1, 7) === "tick");

console.log("\n--- Bigger finish for bigger scores ---");
check("under the big mark is normal", finishSize(BIG_SCORE - 1) === "normal" && finishSize(0) === "normal");
check("the big mark is big", finishSize(BIG_SCORE) === "big" && finishSize(HUGE_SCORE - 1) === "big");
check("the huge mark is huge", finishSize(HUGE_SCORE) === "huge" && finishSize(90) === "huge");

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
