import { act, chooseTarget, Game, isBotSeat, newGame, nextRound, PlayerSetup, settleDeal } from "./session";
import { scoreHand } from "./scoring";
import { Card, Player } from "./types";
import { gameFrom } from "./testkit";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failures++;
}

// ---------- builders ----------
const num = (value: number): Card => ({ kind: "number", value });
const timeOut: Card = { kind: "action", action: "timeOut" };
const drawThree: Card = { kind: "action", action: "drawThree" };
const shield: Card = { kind: "action", action: "shield" };
const mk = (id: string, hand: Card[] = [], status: Player["status"] = "playing"): Player =>
  ({ id, name: id, hand, totalScore: 0, status });
const gameWith = (players: Player[], drawPile: Card[]): Game => gameFrom(players, drawPile);

console.log("--- Choosing targets ---");
let g = act(gameWith([mk("A", [num(1)]), mk("B"), mk("C")], [timeOut, num(9)]), "hit");
check("drawing Time Out pauses and asks", g.pending?.card === "timeOut");
check("all active players can be chosen", JSON.stringify(g.pending?.options) === "[0,1,2]");
check("nothing has changed while paused", g.round.players[1].status === "playing" && g.round.deck.drawPile.length === 2);
check("hit and stay are ignored while paused", act(g, "hit") === g);
check("an illegal choice is ignored", chooseTarget(g, 7) === g);
g = chooseTarget(g, 2);
check("the chosen player is timed out", g.round.players[2].status === "timedOut");
check("the game moves on to the next player", g.pending === null && g.current === 1);

g = act(gameWith([mk("A", [num(1)]), mk("B", [], "stayed")], [timeOut]), "hit");
check("with one legal target it doesn't ask", g.pending === null && g.round.players[0].status === "timedOut");

g = act(gameWith([mk("A", [num(1)]), mk("B"), mk("C")], [drawThree, timeOut, num(4), num(5), num(6)]), "hit");
check("Draw Three asks for its target", g.pending?.card === "drawThree");
g = chooseTarget(g, 1);
check("a Time Out revealed inside it asks a second question", g.pending?.card === "timeOut" && g.choices.length === 1);
g = chooseTarget(g, 2);
check("both choices were applied", g.round.players[2].status === "timedOut" &&
  g.round.players[1].hand.filter((c) => c.kind === "number").length === 2);

console.log("\n--- Shield ---");
g = act(gameWith([mk("A", [shield]), mk("B"), mk("C")], [shield, num(2)]), "hit");
check("a spare Shield asks who gets it", g.pending?.card === "shield");
check("the holder is not an option", JSON.stringify(g.pending?.options) === "[1,2]");
g = chooseTarget(g, 2);
check("the chosen player now holds it", g.round.players[2].hand.length === 1);
check("no card was lost", g.round.deck.discardPile.length === 0);

g = act(gameWith([mk("A", [shield]), mk("B", [shield], "stayed")], [shield]), "hit");
check("with nobody eligible it is discarded", g.pending === null && g.round.deck.discardPile.length === 1);

console.log("\n--- Ties at 200+ ---");
const roundOverWith = (a: number, b: number): Game => gameFrom(
  [{ ...mk("A", [], "stayed"), totalScore: a }, { ...mk("B", [], "stayed"), totalScore: b }],
  shuffleForTest(),
  { current: -1, phase: "roundOver" },
);
function shuffleForTest(): Card[] {
  return Array.from({ length: 40 }, (_, k) => num((k % 12) + 1));
}
check("a single winner ends the game", nextRound(roundOverWith(210, 150)).phase === "gameOver");
check("the highest total wins", nextRound(roundOverWith(210, 230)).winners[0].id === "B");
const tied = nextRound(roundOverWith(210, 210));
check("an exact tie does not end the game", tied.phase !== "gameOver");
check("a tie deals another round to everyone", tied.round.players.length === 2 && tied.round.players.every((p) => p.totalScore === 210));
check("nobody over 200 keeps the game going", nextRound(roundOverWith(150, 120)).phase !== "gameOver");
check("199 is not enough to win", nextRound(roundOverWith(199, 100)).phase !== "gameOver");
check("exactly 200 wins", nextRound(roundOverWith(200, 100)).phase === "gameOver");

console.log("\n--- Reshuffling in the middle of a turn ---");
// The draw pile is empty, so the first draw reshuffles the discard pile. A paused move is
// re-run from the start after each answer, so the reshuffle has to come out the same
// every time. Otherwise the cards change between the question and the answer.
let reshuffleCrashed = false, reshuffleStable = true, reshuffleQuestions = 0;
for (let n = 0; n < 300; n++) {
  const discard = [drawThree, drawThree, timeOut, timeOut, shield, num(2), num(3), num(4), num(5), num(6), num(7), num(8)];
  let game = gameWith([mk("A", [num(1)]), mk("B"), mk("C"), mk("D")], []);
  game.round.deck = { drawPile: [], discardPile: discard, seed: n };
  try {
    game = act(game, "hit");
    while (game.pending) {
      reshuffleQuestions++;
      const o = game.pending.options;
      const pick = o[o.length - 1];
      const first = chooseTarget(game, pick), second = chooseTarget(game, pick);
      if (JSON.stringify(first.round) !== JSON.stringify(second.round)) reshuffleStable = false;
      game = first;
    }
  } catch {
    reshuffleCrashed = true;
  }
}
check("answering questions after a reshuffle never crashes", !reshuffleCrashed);
check("re-running a paused move gives the same cards", reshuffleStable);
check("the reshuffle test really asked questions", reshuffleQuestions > 100);

// ---------- stress test: whole games where every question gets answered ----------
let allGamesEnded = true, allCardsKept = true, turnsAlwaysValid = true, questions = 0;
function settle(game: Game): Game {
  while (game.pending) {
    questions++;
    const o = game.pending.options;
    game = chooseTarget(game, o[Math.floor(Math.random() * o.length)]);
  }
  return game;
}
for (let n = 0; n < 300; n++) {
  let game: Game = settle(newGame(["Ann", "Ben", "Cat", "Dee", "Eve"].slice(0, 3 + (n % 3))));
  let steps = 0;
  while (game.phase !== "gameOver" && steps++ < 5000) {
    if (game.phase === "playing") {
      if (game.round.players[game.current]?.status !== "playing") turnsAlwaysValid = false;
      const me = game.round.players[game.current];
      game = settle(act(game, me.hand.length === 0 || scoreHand(me) < 20 ? "hit" : "stay"));
    } else {
      game = settle(nextRound(game));
    }
    const total = game.round.deck.drawPile.length + game.round.deck.discardPile.length +
      game.round.players.reduce((s, p) => s + p.hand.length, 0);
    if (total !== 94) allCardsKept = false;
  }
  if (game.phase !== "gameOver" || game.winners.length === 0) allGamesEnded = false;
}
console.log("\n--- 300 full games ---");
check("every game played to a winner", allGamesEnded);
check("it is always an active player's turn", turnsAlwaysValid);
check("94 cards accounted for after every step", allCardsKept);

console.log("\n--- The target and the record ---");
{
  const rigged = (target: number, total: number) => gameFrom(
    [mk("A", [num(10), num(5)], "playing"), mk("B", [num(9)], "stayed"), mk("C", [num(2)], "stayed")],
    [num(8)],
    { target },
  );
  const withTotal = (g: Game, total: number): Game => ({ ...g, round: { ...g.round, players: g.round.players.map((p, i) => (i === 0 ? { ...p, totalScore: total } : p)) } });

  // Player A stays with 15 round points on top of a banked total.
  const finishRound = (g: Game): Game => {
    let x = act(g, "stay");           // A stays, then B and C are already out
    return x;
  };
  const at150 = nextRound(finishRound(withTotal(rigged(150, 0), 140)));
  check("with a target of 150, 155 points wins", at150.phase === "gameOver" && at150.winners[0].id === "A");
  const at200 = nextRound(finishRound(withTotal(rigged(200, 0), 140)));
  check("with a target of 200, 155 points does not win yet", at200.phase === "playing" && at200.roundNo === 2);
  const at250 = nextRound(finishRound(withTotal(rigged(250, 0), 236)));
  check("with a target of 250, 251 points wins", at250.phase === "gameOver");
  check("the target survives from round to round", at200.target === 200 && nextRound(finishRound(withTotal(rigged(150, 0), 100))).target === 150);
  check("the round number counts up", at200.roundNo === 2 && newGame(["A", "B", "C"]).roundNo === 1);
  check("a new game plays to 200 unless told otherwise", newGame(["A", "B", "C"]).target === 200 && newGame(["A", "B", "C"], { target: 150 }).target === 150);

  // Seven Stacks and best rounds are remembered for each player.
  const six = [num(1), num(2), num(3), num(4), num(5), num(6)];
  const stackGame = gameFrom([mk("A", six), mk("B", [num(9)], "stayed"), mk("C", [num(2)], "stayed")], [num(7)]);
  const stacked = act(stackGame, "hit");
  check("nothing is counted until the round is banked", stacked.stacks[0] === 0 && stacked.best[0].points === 0);
  const banked = nextRound(stacked);
  check("a Seven Stack is counted for the player who made it", banked.stacks[0] === 1 && banked.stacks[1] === 0 && banked.stacks[2] === 0);
  check("their best round is that round, marked as a Seven Stack", banked.best[0].points === 28 + 15 && banked.best[0].sevenStack === true);
  check("another player's best round is their own", banked.best[1].points === 9 && banked.best[1].sevenStack === false);
  check("the counts have one entry per player", banked.stacks.length === 3 && banked.best.length === 3 && banked.quiet.length === 3 && banked.cover.length === 3);
}

console.log("\n--- Questions asked while dealing ---");
{
  // Somebody is sometimes dealt a Time Out or a Draw Three. The computer players answer at once, so the
  // table is dealt in one go; a question for you is left for you.
  const seats: PlayerSetup[] = [
    { name: "Me" }, { name: "Fizz", bot: "easy" }, { name: "Robo", bot: "medium" }, { name: "Zed", bot: "hard" }, { name: "Kit", bot: "medium" },
  ];
  let botAsked = 0, botLeft = 0, youAsked = 0, dealtAll = true, noNote = true, keepsNote = true, steady = true, kept94 = true, botsFirst = true;
  for (let n = 0; n < 600; n++) {
    const raw = newGame(seats);
    const settled = settleDeal(raw);
    if (raw.pending && isBotSeat(raw, raw.pending.actor)) {
      botAsked++;
      if (settleDeal({ ...raw, note: "Time ran out" }).note !== "Time ran out") keepsNote = false;
    }
    if (settled.pending && isBotSeat(settled, settled.pending.actor)) botLeft++;
    if (settled.pending && settled.pending.actor === 0) youAsked++;
    // (A player who was dealt a Time Out and gave it away may hold no card yet: that is the rules, not a half-dealt table.)
    if (!settled.pending && settled.round.deck.drawPile.length + settled.round.deck.discardPile.length === 94) dealtAll = false;
    if (settled.note !== undefined) noNote = false;
    if (settleDeal(settled) !== settled) steady = false;
    const total = settled.round.deck.drawPile.length + settled.round.deck.discardPile.length +
      settled.round.players.reduce((s, p) => s + p.hand.length, 0);
    if (total !== 94) kept94 = false;
    // When you are asked, answering never leaves a computer player's deal question waiting.
    if (settled.pending && settled.pending.actor === 0) {
      const o = settled.pending.options;
      const after = settleDeal(chooseTarget(settled, o[o.length - 1]));
      if (after.pending && after.resume?.kind === "deal" && isBotSeat(after, after.pending.actor)) botsFirst = false;
    }
  }
  check("the test really saw computer players being asked", botAsked > 20);
  check("a computer player's question is answered at once", botLeft === 0);
  check("a question for you is left for you", youAsked > 5);
  check("a settled deal has really been dealt (cards left the deck)", dealtAll);
  check("settling adds no note of its own", noNote);
  check("the note the game came with is kept", keepsNote);
  check("settling twice changes nothing", steady);
  check("94 cards accounted for after settling", kept94);
  check("answering your question settles the rest of the deal too", botsFirst);

  // A question in the middle of a round is not a deal question: it is left alone.
  const mid = act(gameFrom([mk("A", [num(1)]), mk("B"), mk("C")], [timeOut, num(9)]), "hit");
  check("a question in the middle of a round is not touched", mid.pending !== null && settleDeal(mid) === mid);
}

console.log("Questions asked across all games:", questions);
console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
