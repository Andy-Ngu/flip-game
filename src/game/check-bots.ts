import { botDecide, botPickTarget } from "./bot";
import { Card, BotLevel, Player } from "./types";
import { botStep, Game, isBotTurn, newGame, nextRound, PlayerSetup, act } from "./session";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failures++;
}

const num = (value: number): Card => ({ kind: "number", value });
const shield: Card = { kind: "action", action: "shield" };
const mk = (id: string, hand: Card[] = [], bot?: BotLevel, totalScore = 0): Player =>
  ({ id, name: id, hand, totalScore, status: "playing", ...(bot ? { bot } : {}) });

console.log("--- Hit or stay ---");
check("a bot with no cards hits", botDecide([mk("A", [], "hard")], 0) === "hit");
check("easy stays at 15", botDecide([mk("A", [num(12), num(3)], "easy")], 0) === "stay");
check("easy hits below 15", botDecide([mk("A", [num(12)], "easy")], 0) === "hit");
check("medium keeps going at 29", botDecide([mk("A", [num(12), num(10), num(7)], "medium")], 0) === "hit");
check("medium stays at 30", botDecide([mk("A", [num(12), num(10), num(8)], "medium")], 0) === "stay");
check("hard plays safe with one low card", botDecide([mk("A", [num(2)], "hard")], 0) === "hit");
check("hard stays on a big hand of common numbers",
  botDecide([mk("A", [num(12), num(11), num(10), num(9)], "hard")], 0) === "stay");
const risky = [mk("A", [num(12), num(11), num(10)], "hard")];
const withSecond = [mk("A", [num(12), num(11), num(10), shield], "hard")];
check("hard stays on 12, 11, 10 with no safety net", botDecide(risky, 0) === "stay");
check("hard keeps hitting that same hand while holding a Shield", botDecide(withSecond, 0) === "hit");

console.log("\n--- Choosing targets ---");
const table = [mk("Me", [num(5)], "hard", 50), mk("Leader", [num(2)], undefined, 150), mk("Behind", [num(9)], undefined, 10)];
check("Time Out goes to the leader with the weak row", botPickTarget(table, 0, "timeOut", [0, 1, 2]) === 1);
const strong = [mk("Me", [num(12), num(11), num(10)], "hard", 50), mk("Leader", [num(2)], undefined, 150)];
check("Time Out yourself to lock in a strong row", botPickTarget(strong, 0, "timeOut", [0, 1]) === 0);
check("a spare Shield goes to the player furthest behind", botPickTarget(table, 0, "shield", [1, 2]) === 2);
const flip = [mk("Me", [], "hard"), mk("Full", [num(1), num(2), num(3), num(4), num(5)]), mk("Loaded", [num(12), num(11), num(10)])];
check("Draw Three avoids a player close to Seven Stack", botPickTarget(flip, 0, "drawThree", [0, 1, 2]) === 2);
check("with one legal option it takes it", botPickTarget(flip, 0, "timeOut", [0]) === 0);

console.log("\n--- Bots in the game loop ---");
let g = newGame([{ name: "You" }, { name: "Bot", bot: "hard" }]);
check("a human seat has no bot level", g.round.players[0].bot === undefined);
check("a bot seat is flagged", g.round.players[1].bot === "hard");
check("plain names still work", newGame(["A", "B", "C"]).round.players.every((p) => p.bot === undefined));
check("botStep does nothing on a human's turn",
  (() => { const h = newGame(["A", "B"]); return h.pending !== null || botStep(h) === h; })());

// Run complete all-bot games, one move at a time, as the screen would.
function playAllBots(levels: BotLevel[]): { game: Game; cardsOk: boolean; onlyBotsActed: boolean } {
  const setup: PlayerSetup[] = levels.map((bot, i) => ({ name: `${bot}${i}`, bot }));
  let game = newGame(setup);
  let cardsOk = true, onlyBotsActed = true, steps = 0;
  while (game.phase !== "gameOver" && steps++ < 20000) {
    if (game.phase === "roundOver") game = nextRound(game);
    else {
      if (!isBotTurn(game)) onlyBotsActed = false;
      game = botStep(game);
    }
    const total = game.round.deck.drawPile.length + game.round.deck.discardPile.length +
      game.round.players.reduce((s, p) => s + p.hand.length, 0);
    if (total !== 94) cardsOk = false;
  }
  return { game, cardsOk, onlyBotsActed };
}

let allEnded = true, allCards = true, allBots = true;
const mixes: BotLevel[][] = [["hard", "easy", "medium"], ["medium", "medium", "hard", "easy"], ["easy", "easy", "hard"], ["hard", "hard", "hard", "hard", "medium"]];
for (let n = 0; n < 200; n++) {
  const r = playAllBots(mixes[n % mixes.length]);
  if (r.game.phase !== "gameOver" || r.game.winners.length !== 1) allEnded = false;
  if (!r.cardsOk) allCards = false;
  if (!r.onlyBotsActed) allBots = false;
}
check("200 all-bot games end with exactly one winner", allEnded);
check("94 cards accounted for after every bot move", allCards);
check("the loop only ever asked bots to act", allBots);

// ---------- tournament ----------
console.log("\n--- Tournament: easy vs medium vs hard ---");
const wins: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
const seatings: BotLevel[][] = [["easy", "hard", "medium"], ["hard", "medium", "easy"], ["medium", "easy", "hard"]];
const GAMES_PER_SEATING = 1000;
for (const seating of seatings) {
  for (let n = 0; n < GAMES_PER_SEATING; n++) {
    const r = playAllBots(seating);
    wins[r.game.winners[0].bot as string]++;
  }
}
const total = GAMES_PER_SEATING * seatings.length;
for (const level of ["easy", "medium", "hard"]) {
  console.log(`${level.padEnd(9)} won ${wins[level]} of ${total} games (${((100 * wins[level]) / total).toFixed(1)}%)`);
}
check("hard wins more than its fair third", wins.hard > total / 3);

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
