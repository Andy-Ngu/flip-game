import {
  cardHelpFor, exampleCard, HELP, HELP_KEYS, HelpKey, helpKeyFor, HOLD_HINT, isHelpKey, markSeen, nextHelp,
  nextHelpForCards, parseHelpSeen, TIPS, tipsFor,
} from "./cardHelp";
import { createDeck } from "./deck";
import { diffEvents, GameEvent } from "./events";
import { ChooseTarget, RoundState, takeTurn } from "./round";
import { isRoundOver } from "./rules";
import { scoreHand } from "./scoring";
import { act } from "./session";
import { drawThree, gameFrom, mk, num, shield, timeOut } from "./testkit";
import { Card } from "./types";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failures++;
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const double: Card = { kind: "modifier", bonus: 0, multiplier: 2 };
const bonus = (n: number): Card => ({ kind: "modifier", bonus: n, multiplier: 1 });
const sentences = (text: string) => (text.match(/[.!?](?=\s|$)/g) ?? []).length;
const deckOf = (...cards: Card[]) => ({ drawPile: cards, discardPile: [] });
const pickSeat = (seat: number): ChooseTarget => () => seat;
const state = (players: RoundState["players"], ...cards: Card[]): RoundState => ({ players, deck: deckOf(...cards) });
const isShield = (c: Card) => c.kind === "action" && c.action === "shield";

const cardEvent = (card: Card, player = 0): GameEvent => ({ kind: "card", player, card, count: 1 });
const stack: GameEvent = { kind: "sevenStack", player: 0 };

console.log("--- Which cards have help ---");
check("a number card has no help of its own", Array.from({ length: 13 }, (_, v) => num(v)).every((c) => helpKeyFor(c) === null));
check("Time Out, Draw Three and Shield each have their own", helpKeyFor(timeOut) === "timeOut" && helpKeyFor(drawThree) === "drawThree" && helpKeyFor(shield) === "shield");
check("Double Score is told apart from the Bonus cards", helpKeyFor(double) === "doubleScore" && [2, 4, 6, 8, 10].every((n) => helpKeyFor(bonus(n)) === "bonus"));
const deckKeys = new Set(createDeck().map(helpKeyFor).filter((k): k is HelpKey => k !== null));
check("a full deck uses every kind of help except the Seven Stack", deckKeys.size === 5 && HELP_KEYS.filter((k) => !deckKeys.has(k)).join() === "sevenStack");
check("every card in the deck either has help or is a number", createDeck().every((c) => (c.kind === "number") === (helpKeyFor(c) === null)));
check("isHelpKey accepts the six names and nothing else", HELP_KEYS.length === 6 && HELP_KEYS.every(isHelpKey) && !isHelpKey("banana") && !isHelpKey(5) && !isHelpKey(null));

console.log("\n--- The words ---");
check("every kind has a title, a pop-up line and a longer text", HELP_KEYS.every((k) => HELP[k].title.length > 0 && HELP[k].line.length > 0 && HELP[k].long.length > 0));
check("titles are in capitals", HELP_KEYS.every((k) => HELP[k].title === HELP[k].title.toUpperCase()));
check("the Shield line is the one on the mockup", HELP.shield.line === "Blocks your next duplicate. You can only hold one.");
check("the pop-up line is short", HELP_KEYS.every((k) => HELP[k].line.length <= 70));
check("the pop-up line is one or two sentences", HELP_KEYS.every((k) => sentences(HELP[k].line) >= 1 && sentences(HELP[k].line) <= 2));
check("the longer text is two or three sentences", HELP_KEYS.every((k) => sentences(HELP[k].long) >= 2 && sentences(HELP[k].long) <= 3));
check("the longer text says more than the line", HELP_KEYS.every((k) => HELP[k].long.length > HELP[k].line.length));
check("the reminder to press and hold is there", HOLD_HINT === "Press and hold any card to read about it.");

console.log("\n--- The words match the rules ---");
let s = takeTurn(state([mk("A", [num(5), shield]), mk("B", [num(3)])], num(5)), 0, "hit", pickSeat(1));
check("Shield: a duplicate does not bust you", s.players[0].status === "playing");
check("Shield: the Shield is used up", !s.players[0].hand.some(isShield));
check("Shield: the duplicate is thrown away, not added to your hand", s.players[0].hand.length === 1 && s.deck.discardPile.length === 2);
s = takeTurn(state([mk("A", [num(5)]), mk("B", [num(3)])], num(5)), 0, "hit", pickSeat(1));
check("Without a Shield the same duplicate busts you", s.players[0].status === "busted");
s = takeTurn(state([mk("A", [shield, num(2)]), mk("B", [num(3)])], shield), 0, "hit", pickSeat(1));
check("Shield: you only hold one; the second is passed to a player who has none", s.players[0].hand.filter(isShield).length === 1 && s.players[1].hand.some(isShield));

s = takeTurn(state([mk("A", [num(2)]), mk("B", [num(9), num(4)])], timeOut), 0, "hit", pickSeat(1));
check("Time Out: the player it is given to is out for the round", s.players[1].status === "timedOut");
check("Time Out: they keep their points", scoreHand(s.players[1]) === 13);
s = takeTurn(state([mk("A", [num(2)]), mk("B", [num(9)])], timeOut), 0, "hit", pickSeat(0));
check("Time Out: you can pick yourself", s.players[0].status === "timedOut");
let refused = false;
try {
  takeTurn(state([mk("A", [num(2)]), mk("B", [num(9)], "stayed")], timeOut), 0, "hit", pickSeat(1));
} catch {
  refused = true;
}
check("Time Out: a player who is already out of the round cannot be picked", refused);

s = takeTurn(state([mk("A", [num(2)]), mk("B", [num(9)])], drawThree, num(1), num(3), num(5), num(8)), 0, "hit", pickSeat(1));
check("Draw Three: the chosen player draws three cards, one after another", s.players[1].hand.filter((c) => c.kind === "number").length === 4 && s.deck.drawPile.length === 1);
s = takeTurn(state([mk("A", [num(2)]), mk("B", [num(5)])], drawThree, num(5), num(2), num(3)), 0, "hit", pickSeat(1));
check("Draw Three: it stops early if they bust", s.players[1].status === "busted" && s.deck.drawPile.length === 2);
s = takeTurn(state([mk("A", [num(2)]), mk("B", [1, 2, 3, 4, 5, 6].map(num))], drawThree, num(7), num(8), num(9)), 0, "hit", pickSeat(1));
check("Draw Three: it stops early if they make a Seven Stack", s.deck.drawPile.length === 2 && isRoundOver(s.players));

const withDouble = mk("A", [num(3), num(4), double, bonus(2)]);
check("Double Score doubles the numbers only, then a Bonus is added: (3 + 4) x 2 + 2", scoreHand(withDouble) === 16);
check("Bonus: it is kept as long as you do not bust", scoreHand(mk("A", [num(3), bonus(6)])) === 9 && scoreHand(mk("A", [num(3), num(3), bonus(6)], "busted")) === 0);
const sevenNumbers = [1, 2, 3, 4, 5, 6, 7].map(num);
check("Seven Stack: 7 different numbers add 15, and the 15 is not doubled", scoreHand(mk("A", [...sevenNumbers, double])) === 28 * 2 + 15);
check("Seven Stack: it ends the round", isRoundOver([mk("A", sevenNumbers), mk("B", [num(3)])]));
check("Seven Stack: six different numbers do not", !isRoundOver([mk("A", [1, 2, 3, 4, 5, 6].map(num)), mk("B", [num(3)])]));
check("Seven Stack: action cards and bonus cards do not count as numbers", !isRoundOver([mk("A", [...[1, 2, 3, 4, 5, 6].map(num), shield, bonus(4), double]), mk("B", [num(3)])]));

console.log("\n--- When the pop-up appears ---");
check("nothing happened, nothing to explain", nextHelp([], []) === null);
check("number cards, stays and busts explain nothing", nextHelp([cardEvent(num(7)), { kind: "stay", player: 1 }, { kind: "bust", player: 2 }, { kind: "newRound" }, { kind: "deckLow", left: 9 }], []) === null);
check("a Shield arriving explains Shield", nextHelp([cardEvent(shield)], []) === "shield");
check("it skips number cards to find the special one", nextHelp([cardEvent(num(3)), cardEvent(timeOut, 2)], []) === "timeOut");
check("a card in someone else's hand explains itself too", nextHelp([cardEvent(drawThree, 3)], []) === "drawThree");
check("Double Score and Bonus are told apart", nextHelp([cardEvent(double)], []) === "doubleScore" && nextHelp([cardEvent(bonus(8))], []) === "bonus");
check("it picks the first unseen one, in the order things happened", nextHelp([cardEvent(shield), cardEvent(drawThree)], []) === "shield");
check("a kind that was already explained is skipped", nextHelp([cardEvent(shield), cardEvent(drawThree)], ["shield"]) === "drawThree");
check("once everything in the move has been explained, there is nothing", nextHelp([cardEvent(shield), cardEvent(drawThree)], ["shield", "drawThree"]) === null);
check("a Seven Stack being made explains the Seven Stack", nextHelp([cardEvent(num(7)), stack], []) === "sevenStack");
check("...but only the first time", nextHelp([cardEvent(num(7)), stack], ["sevenStack"]) === null);
check("a card comes before the stack it completes", nextHelp([cardEvent(bonus(4)), stack], []) === "bonus");
check("the list it was given is not changed", (() => {
  const seen: HelpKey[] = ["shield"];
  nextHelp([cardEvent(timeOut)], seen);
  return same(seen, ["shield"]);
})());

console.log("\n--- With real moves ---");
function helpAfterHit(drawn: Card, hand: Card[] = [num(3)]): HelpKey | null {
  const before = gameFrom([mk("A", hand), mk("B", [num(4)])], [drawn, num(1)]);
  return nextHelp(diffEvents(before, act(before, "hit")), []);
}
check("drawing a number explains nothing", helpAfterHit(num(9)) === null);
check("drawing a Shield explains Shield", helpAfterHit(shield) === "shield");
check("drawing Double Score explains Double Score", helpAfterHit(double) === "doubleScore");
check("drawing a Bonus explains Bonus", helpAfterHit(bonus(10)) === "bonus");
check("drawing the seventh different number explains the Seven Stack", helpAfterHit(num(7), [1, 2, 3, 4, 5, 6].map(num)) === "sevenStack");
check("drawing a duplicate explains nothing (the bust speaks for itself)", helpAfterHit(num(3)) === null);

console.log("\n--- Cards lying on the table ---");
check("the first unseen special card in a hand", nextHelpForCards([num(3), shield, timeOut], []) === "shield");
check("...skipping the ones already explained", nextHelpForCards([num(3), shield, timeOut], ["shield"]) === "timeOut");
check("a hand of numbers explains nothing", nextHelpForCards([num(3), num(9)], []) === null);
check("nothing in the hand, nothing to explain", nextHelpForCards([], []) === null);

console.log("\n--- Remembering what was shown ---");
const before: HelpKey[] = ["shield"];
const after = markSeen(before, "timeOut");
check("marking adds the new kind at the end", same(after, ["shield", "timeOut"]));
check("the old list is left alone", same(before, ["shield"]) && after !== before);
check("marking something twice keeps one copy", same(markSeen(after, "shield"), ["shield", "timeOut"]));
check("a damaged list is cleaned up: unknown names, wrong types and repeats", same(parseHelpSeen(["bonus", "x", 3, "bonus", null, "shield"]), ["bonus", "shield"]));
check("something that is not a list means nothing shown", same(parseHelpSeen("shield"), []) && same(parseHelpSeen(undefined), []) && same(parseHelpSeen({}), []));

console.log("\n--- A picture to go with each pop-up ---");
check("every kind but the Seven Stack has an example card of its own kind", HELP_KEYS.filter((k) => k !== "sevenStack").every((k) => {
  const c = exampleCard(k);
  return c !== null && helpKeyFor(c) === k;
}));
check("the Seven Stack is not a card, so it has none", exampleCard("sevenStack") === null);

console.log("\n--- Press and hold on a card ---");
const deck = createDeck();
const copiesOf = (v: number) => deck.filter((c) => c.kind === "number" && c.value === v).length;
check("a number card is named and says what it is worth", cardHelpFor(num(7)).title === "NUMBER 7" && cardHelpFor(num(7)).long.includes("Worth 7 points."));
check("it says how many of that number the deck holds, counted from the deck", Array.from({ length: 11 }, (_, i) => i + 2).every((v) => cardHelpFor(num(v)).long.includes(`There are ${copiesOf(v)} of them in the deck.`)));
check("it mentions the Shield and the bust", cardHelpFor(num(9)).long.includes("bust") && cardHelpFor(num(9)).long.includes("Shield"));
check("the 0 and the 1 are the only ones in the deck, so they cannot bust you", [0, 1].every((v) => copiesOf(v) === 1 && cardHelpFor(num(v)).long.includes("can never bust you")));
check("one point is not 'points'", cardHelpFor(num(1)).long.startsWith("Worth 1 point.") && cardHelpFor(num(0)).long.startsWith("Worth 0 points."));
check("a Bonus card names its own points", cardHelpFor(bonus(6)).title === "BONUS +6" && cardHelpFor(bonus(6)).long.includes("adds 6 points"));
check("the action cards and Double Score use their shared text", [timeOut, drawThree, shield, double].every((c) => {
  const key = helpKeyFor(c)!;
  const text = cardHelpFor(c);
  return text.title === HELP[key].title && text.long === HELP[key].long;
}));
check("every one of the 94 cards in the deck has something to say", deck.every((c) => cardHelpFor(c).title.length > 0 && cardHelpFor(c).long.length > 0));

console.log("\n--- The first-game tips ---");
check("there are three tips: HIT, the Seven Stack and the bust odds, in that order", same(TIPS.map((t) => t.id), ["hit", "stack", "odds"]));
check("each has some text", TIPS.every((t) => t.text.length > 0));
check("the wording is the one on the mockup", TIPS[0].text === "Tap HIT to draw a card. Every new number adds to your score." && TIPS[1].text.startsWith("Collect 7 different numbers to make a Seven Stack."));
check("the Seven Stack tip is true: 7 different numbers add 15", TIPS[1].text.includes("adds 15 points") && scoreHand(mk("A", sevenNumbers)) === 28 + 15);
check("the bust odds tip is true: a duplicate busts you and scores 0", TIPS[2].text.includes("A duplicate busts you and scores 0.") && scoreHand(mk("A", [num(5), num(5)], "busted")) === 0);
check("with the bust odds shown you get all three", tipsFor(true).length === 3);
check("with the bust odds switched off the bar is not there, so that tip is left out", same(tipsFor(false).map((t) => t.id), ["hit", "stack"]));

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
