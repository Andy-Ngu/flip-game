import { breakdown, breakdownSpeech, SEVEN_STACK_POINTS } from "./breakdown";
import { createDeck, seededRandom, shuffle } from "./deck";
import { hasSevenStack, scoreHand } from "./scoring";
import { drawThree, mk, num, shield, timeOut } from "./testkit";
import { Card, Player } from "./types";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failures++;
}

const hand = (...values: number[]): Card[] => values.map(num);
const bonus = (n: number): Card => ({ kind: "modifier", bonus: n, multiplier: 1 });
const double: Card = { kind: "modifier", bonus: 0, multiplier: 2 };

console.log("--- The hand from the Clarity mockup: 3, 7, 11, Double Score and a +4 Bonus ---");
let p = mk("A", [...hand(3, 7, 11), double, bonus(4)]);
let b = breakdown(p);
check("it shows four lines: numbers, double, bonus and the total", b.lines.length === 4);
check("numbers: 3 + 7 + 11 = 21", b.lines[0].label === "Numbers 3 + 7 + 11" && b.lines[0].value === "21" && b.lines[0].kind === "number");
check("Double Score doubles the numbers only: × 2 = 42", b.lines[1].label === "Double Score doubles numbers only" && b.lines[1].value === "× 2 = 42" && b.lines[1].kind === "double");
check("the Bonus is added after, and never doubled: + 4", b.lines[2].label === "Bonus card" && b.lines[2].value === "+ 4" && b.lines[2].kind === "bonus");
check("you would bank 46", b.lines[3].label === "If you stay, you bank" && b.lines[3].value === "46" && b.lines[3].kind === "total" && b.total === 46);
check("46 is what the real scoring gives too", scoreHand(p) === 46);
check("the small note is the usual one", b.note === "A bust scores 0. Seven different numbers adds 15 more.");

console.log("\n--- Plain hands ---");
b = breakdown(mk("A", hand(7)));
check("one number says Number 7, not Numbers 7", b.lines[0].label === "Number 7" && b.lines[0].value === "7" && b.total === 7);
b = breakdown(mk("A", hand(0)));
check("the 0 card is a number worth 0", b.lines[0].label === "Number 0" && b.total === 0);
b = breakdown(mk("A", []));
check("an empty hand says there are no numbers yet", b.lines[0].label === "No numbers yet" && b.lines[0].value === "0" && b.total === 0 && b.lines.length === 2);
b = breakdown(mk("A", [shield, timeOut, drawThree]));
check("action cards score nothing and add no line", b.lines.length === 2 && b.lines[0].label === "No numbers yet" && b.total === 0);
b = breakdown(mk("A", [...hand(5), shield]));
check("a Shield among the numbers changes nothing", b.total === 5 && b.lines.length === 2);

console.log("\n--- Double Score and Bonus cards ---");
b = breakdown(mk("A", [...hand(5), bonus(10), double]));
check("5 doubled is 10, then + 10 makes 20 (the bonus is not doubled)", b.total === 20 && b.lines[1].value === "× 2 = 10" && b.lines[2].value === "+ 10");
b = breakdown(mk("A", [double]));
check("Double Score on its own doubles nothing: × 2 = 0", b.lines[1].value === "× 2 = 0" && b.total === 0);
b = breakdown(mk("A", [...hand(2), bonus(4), bonus(6)]));
check("two Bonus cards share one line", b.lines.length === 3 && b.lines[1].label === "Bonus cards +4 +6" && b.lines[1].value === "+ 10" && b.total === 12);
b = breakdown(mk("A", [bonus(8)]));
check("a Bonus card alone still counts", b.total === 8 && b.lines[1].label === "Bonus card");

console.log("\n--- Seven Stack ---");
p = mk("A", hand(1, 2, 3, 4, 5, 6, 7));
b = breakdown(p);
check("seven different numbers add 15 on their own line", b.total === 28 + SEVEN_STACK_POINTS && b.lines[1].label === "Seven different numbers" && b.lines[1].value === "+ 15" && b.lines[1].kind === "stack");
check("the Seven Stack note says it ends the round", b.note === "A Seven Stack ends the round for everyone.");
b = breakdown(mk("A", [...hand(1, 2, 3, 4, 5, 6, 7), double, bonus(4)]));
check("a stack with Double Score and a Bonus: 28 doubled = 56, + 4, + 15 = 75", b.total === 75 && b.lines.map((l) => l.kind).join() === "number,double,bonus,stack,total");
check("the 15 is never doubled", scoreHand(mk("A", [...hand(1, 2, 3, 4, 5, 6, 7), double])) === 71 && breakdown(mk("A", [...hand(1, 2, 3, 4, 5, 6, 7), double])).total === 71);
b = breakdown(mk("A", hand(1, 2, 3, 4, 5, 6)));
check("six different numbers is not a stack yet", !hasSevenStack(mk("A", hand(1, 2, 3, 4, 5, 6))) && b.lines.every((l) => l.kind !== "stack"));

console.log("\n--- A bust ---");
p = mk("A", hand(3, 7, 7), "busted");
b = breakdown(p);
check("a bust scores 0", b.total === 0 && scoreHand(p) === 0);
check("it names the card that did it", b.lines[0].label === "You drew a second 7" && b.lines[0].value === "Bust" && b.lines[0].kind === "bust");
check("and the last line says this round scores 0", b.lines.length === 2 && b.lines[1].label === "This round scores" && b.lines[1].value === "0" && b.lines[1].kind === "total");
check("the note says the total score is safe", b.note.includes("Your total score stays as it was"));
b = breakdown(mk("A", hand(3), "busted"));
check("a bust with no visible duplicate still reads well", b.lines[0].label === "You drew a number you already had");
b = breakdown(mk("A", [...hand(4, 9, 9), shield, double], "busted"));
check("a busted hand with extra cards still scores 0", b.total === 0 && b.lines.length === 2 && b.lines[0].label === "You drew a second 9");

console.log("\n--- Where you are in the round ---");
b = breakdown(mk("A", hand(5, 6), "stayed"));
check("after staying it says what you banked", b.lines[b.lines.length - 1].label === "You banked" && b.total === 11 && b.note === "You stayed, so these points are safe.");
b = breakdown(mk("A", [...hand(5, 6), timeOut], "timedOut"));
check("after a Time Out you keep your points", b.lines[b.lines.length - 1].label === "Timed out, you keep" && b.total === 11 && b.note === "A Time Out stops you drawing, but you keep your points.");
b = breakdown(mk("A", hand(5, 6), "playing"));
check("while playing it says what you would bank", b.lines[b.lines.length - 1].label === "If you stay, you bank");

console.log("\n--- Read aloud ---");
const speech = breakdownSpeech(breakdown(mk("A", [...hand(3, 7, 11), double, bonus(4)])));
check("it starts with the title and names every line", speech.startsWith("How your round scores. Numbers 3 + 7 + 11, 21.") && speech.includes("Double Score doubles numbers only, times 2 equals 42") && speech.includes("Bonus card, plus 4") && speech.includes("If you stay, you bank, 46"));
check("it ends with the note", speech.endsWith("Seven different numbers adds 15 more."));

console.log("\n--- 4000 hands, dealt from real decks, always agree with scoreHand ---");
const random = seededRandom(7);
const statuses: Player["status"][] = ["playing", "stayed", "busted", "timedOut"];
let agree = 0;
let shapes = 0;
let stacks = 0;
let doubles = 0;
let busts = 0;
const trials = 4000;
for (let i = 0; i < trials; i++) {
  const deck = shuffle(createDeck(), random);
  const size = Math.floor(random() * 12); // 0 to 11 cards
  const cards = deck.slice(0, size);
  const status = statuses[Math.floor(random() * statuses.length)];
  const player = mk("P", cards, status);
  const result = breakdown(player);
  if (result.total === scoreHand(player)) agree++;

  // The shape of the lines follows the cards.
  const kinds = result.lines.map((l) => l.kind);
  const last = result.lines[result.lines.length - 1];
  const hasDouble = cards.some((c) => c.kind === "modifier" && c.multiplier === 2);
  const stack = hasSevenStack(player);
  const ok =
    last.kind === "total" &&
    last.value === String(result.total) &&
    result.lines.every((l) => l.label.length > 0 && l.value.length > 0) &&
    result.note.length > 0 &&
    (status === "busted"
      ? kinds.join() === "bust,total"
      : kinds[0] === "number" &&
        kinds.filter((k) => k === "number").length === 1 &&
        kinds.includes("double") === hasDouble &&
        kinds.includes("stack") === stack &&
        kinds.filter((k) => k === "bonus").length <= 1 &&
        kinds.filter((k) => k === "total").length === 1);
  if (ok) shapes++;
  if (stack && status !== "busted") stacks++;
  if (hasDouble && status !== "busted") doubles++;
  if (status === "busted") busts++;
}
check(`the total matches scoreHand in all ${trials} hands`, agree === trials);
check(`every hand has a well-formed set of lines`, shapes === trials);
check("the sweep really did cover Double Score, Seven Stacks and busts", doubles > 50 && busts > 500);
console.log(`(seven stacks seen: ${stacks}, doubles seen: ${doubles}, busts seen: ${busts})`);

console.log("\n--- Hands with many cards, built by hand so a Seven Stack is certain ---");
let sevenStacks = 0;
let sevenAgree = 0;
for (let extra = 0; extra < 40; extra++) {
  const base = hand(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12).slice(0, 7 + (extra % 7));
  const cards: Card[] = [...base];
  if (extra % 2 === 0) cards.push(double);
  if (extra % 3 === 0) cards.push(bonus(2 + (extra % 5) * 2));
  if (extra % 4 === 0) cards.push(shield);
  const player = mk("S", cards, extra % 5 === 0 ? "stayed" : "playing");
  sevenStacks++;
  if (breakdown(player).total === scoreHand(player) && breakdown(player).lines.some((l) => l.kind === "stack")) sevenAgree++;
}
check("every Seven Stack hand shows the +15 line and agrees with scoreHand", sevenAgree === sevenStacks);

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
