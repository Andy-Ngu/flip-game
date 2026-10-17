import { createDeck, shuffle } from "./deck";
import { endRound, isRoundOver } from "./rules";
import { dealRound, playRound, randomTarget, RoundState, takeTurn } from "./round";
import { getWinners, scoreHand } from "./scoring";
import { Card, DeckState, Player } from "./types";

// ---------- tiny test helper ----------
let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}` +
    (ok ? "" : ` (got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)})`));
  if (!ok) failures++;
}

const ok = (name: string, condition: boolean) => check(name, condition, true);

// ---------- builders ----------
const num = (value: number): Card => ({ kind: "number", value });
const timeOut: Card = { kind: "action", action: "timeOut" };
const drawThree: Card = { kind: "action", action: "drawThree" };
const mk = (id: string, hand: Card[] = [], status: Player["status"] = "playing"): Player =>
  ({ id, name: id, hand, totalScore: 0, status });
const setup = (players: Player[], drawPile: Card[]): RoundState =>
  ({ players, deck: { drawPile, discardPile: [] } });
const numbersIn = (p: Player) => p.hand.filter((c) => c.kind === "number").length;
// A chooser that returns a fixed list of targets, one per action card played.
const picks = (...order: number[]) => () => order.shift() as number;

console.log("--- Time Out ---");
let s = takeTurn(setup([mk("A", [num(5)]), mk("B")], [timeOut, num(1)]), 0, "hit", picks(1));
check("Time Out puts the target out of the round", s.players[1].status, "timedOut");
check("the player who drew it is still playing", s.players[0].status, "playing");
check("Time Out card sits in front of the target", s.players[1].hand.length, 1);

s = takeTurn(setup([mk("A", [num(5)]), mk("B", [num(2)], "stayed")], [timeOut, num(1)]), 0, "hit", randomTarget);
check("only active player must time themselves out", s.players[0].status, "timedOut");

console.log("\n--- Draw Three ---");
s = takeTurn(setup([mk("A", [num(5)]), mk("B")], [drawThree, num(1), num(2), num(3), num(4)]), 0, "hit", picks(1));
check("target gets three number cards", numbersIn(s.players[1]), 3);
check("one card left in the draw pile", s.deck.drawPile.length, 1);

s = takeTurn(setup([mk("A", [num(5)]), mk("B", [num(2)])], [drawThree, num(2), num(5), num(6)]), 0, "hit", picks(1));
check("a duplicate busts the target", s.players[1].status, "busted");
check("flipping stops at the bust", s.deck.drawPile.length, 2);

s = takeTurn(setup([mk("A", [num(5)]), mk("B")], [drawThree, timeOut, num(1), num(2), num(9)]), 0, "hit", picks(1, 0));
check("Time Out revealed during Draw Three waits until after", numbersIn(s.players[1]), 2);
check("then it is played (on A, as chosen)", s.players[0].status, "timedOut");
check("the target is not timed out", s.players[1].status, "playing");

s = takeTurn(setup([mk("A", [num(5)]), mk("B", [num(1), num(2), num(3), num(4), num(5), num(6)])],
  [drawThree, num(7), num(8)]), 0, "hit", picks(1));
check("Seven Stack stops the flipping", s.deck.drawPile.length, 1);
check("Seven Stack ends the round", isRoundOver(s.players), true);

console.log("\n--- Dealing ---");
s = dealRound(setup([mk("A"), mk("B"), mk("C")], [num(1), num(2), num(3), num(4)]), 0, randomTarget);
check("each player is dealt one card", s.players.map((p) => p.hand.length), [1, 1, 1]);
check("dealing starts left of the dealer", s.players.map((p) => (p.hand[0] as { value: number }).value), [3, 1, 2]);

console.log("\n--- Nothing left to draw ---");
// Both piles empty: this can happen at a big table, where the players hold most of the 94 cards.
s = takeTurn(setup([mk("A", [num(5)]), mk("B", [num(3)]), mk("C", [num(2)], "busted")], []), 0, "hit", randomTarget);
ok("a hit with both piles empty ends the round instead of crashing", isRoundOver(s.players));
ok("everyone still playing banks what they have", s.players[0].status === "stayed" && s.players[1].status === "stayed");
ok("a busted player stays busted", s.players[2].status === "busted");
ok("nobody's points changed", scoreHand(s.players[0]) === 5 && scoreHand(s.players[1]) === 3);

s = takeTurn(setup([mk("A", [num(5)]), mk("B")], [drawThree, num(1)]), 0, "hit", picks(1));
ok("Draw Three stops when the cards run out", numbersIn(s.players[1]) === 1 && isRoundOver(s.players));

s = dealRound(setup([mk("A"), mk("B"), mk("C")], [num(1)]), 0, randomTarget);
ok("dealing stops when the cards run out", isRoundOver(s.players) && s.players[1].hand.length === 1);

s = takeTurn({ players: [mk("A", [num(5)]), mk("B", [num(3)])], deck: { drawPile: [], discardPile: [num(9)] } }, 0, "hit", randomTarget);
ok("an empty draw pile is refilled from the discard pile first", numbersIn(s.players[0]) === 2 && !isRoundOver(s.players));

// Small decks and many hungry players: every round must end, and no card may go missing.
// (Shields are left out: with a deck this small, a player who always hits and always has a Shield
// to burn could go round in circles, which can't happen with a real 94-card deck.)
let tinyOk = true, tinyEnded = true;
for (let n = 0; n < 300; n++) {
  const size = 8 + (n % 20);
  const cards = shuffle(createDeck().filter((c) => !(c.kind === "action" && c.action === "shield"))).slice(0, size);
  const players = Array.from({ length: 3 + (n % 6) }, (_, k) => mk(`P${k + 1}`));
  try {
    const played = playRound({ players, deck: { drawPile: cards, discardPile: [] } }, n % players.length, randomTarget, () => true);
    if (!isRoundOver(played.players)) tinyEnded = false;
    const total = played.deck.drawPile.length + played.deck.discardPile.length + played.players.reduce((t, p) => t + p.hand.length, 0);
    if (total !== size) tinyOk = false;
  } catch {
    tinyEnded = false;
  }
}
ok("300 rounds on tiny decks all end without an error", tinyEnded);
ok("no card goes missing when the deck runs out", tinyOk);

// ---------- stress test: many full games ----------
function simulateGame(playerCount: number) {
  let deck: DeckState = { drawPile: shuffle(createDeck()), discardPile: [] };
  let players = Array.from({ length: playerCount }, (_, k) => mk(`P${k + 1}`));
  let cardsOk = true;
  for (let round = 0; round < 200; round++) {
    const played = playRound({ players, deck }, round % playerCount, randomTarget, (p) => scoreHand(p) < 20);
    const ended = endRound(played.players, played.deck);
    players = ended.players;
    deck = ended.deck;
    if (deck.drawPile.length + deck.discardPile.length !== 94) cardsOk = false;
    const winners = getWinners(players);
    if (winners.length > 0) return { rounds: round + 1, winners, cardsOk };
  }
  return { rounds: 200, winners: [] as Player[], cardsOk };
}

console.log("\n--- 300 simulated games (3 to 8 players) ---");
let allCards = true, allFinished = true, totalRounds = 0;
for (let g = 0; g < 300; g++) {
  const r = simulateGame(3 + (g % 6));
  if (!r.cardsOk) allCards = false;
  if (r.winners.length === 0) allFinished = false;
  totalRounds += r.rounds;
}
check("all 94 cards accounted for after every round", allCards, true);
check("every game ended with a winner", allFinished, true);
console.log("Average rounds per game:", (totalRounds / 300).toFixed(1));

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
