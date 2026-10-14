import { scoreHand } from "./scoring";
import { act, chooseTarget, Game, newGame, nextRound } from "./session";
import { Card, Player } from "./types";

let failures = 0;
function check(name: string, ok: boolean) {
    console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
    if (!ok) failures++;
}

// ---------- builders ----------
const num = (value: number): Card => ({ kind: "number", value });
const freeze: Card = { kind: "action", action: "freeze" };
const flipThree: Card = { kind: "action", action: "flipThree" };
const secondChance: Card = { kind: "action", action: "secondChance" };
const mk = (id: string, hand: Card[] = [], status: Player["status"] = "playing"): Player =>
({ id, name: id, hand, totalScore: 0, status });
const gameWith = (players: Player[], drawPile: Card[]): Game => ({
    round: { players, deck: { drawPile, discardPile: [] } },
    dealer: 0, current: 0, phase: "playing", winners: [], pending: null, choices: [], resume: null,
});

console.log("--- Choosing targets ---");
let g = act(gameWith([mk("A", [num(1)]), mk("B"), mk("C")], [freeze, num(9)]), "hit");
check("drawing Freeze pauses and asks", g.pending?.card === "freeze");
check("all active players can be chosen", JSON.stringify(g.pending?.options) === "[0,1,2]");
check("nothing has changed while paused", g.round.players[1].status === "playing" && g.round.deck.drawPile.length === 2);
check("hit and stay are ignored while paused", act(g, "hit") === g);
check("an illegal choice is ignored", chooseTarget(g, 7) === g);
g = chooseTarget(g, 2);
check("the chosen player is frozen", g.round.players[2].status === "frozen");
check("the game moves on to the next player", g.pending === null && g.current === 1);

g = act(gameWith([mk("A", [num(1)]), mk("B", [], "stayed")], [freeze]), "hit");
check("with one legal target it doesn't ask", g.pending === null && g.round.players[0].status === "frozen");

g = act(gameWith([mk("A", [num(1)]), mk("B"), mk("C")], [flipThree, freeze, num(4), num(5), num(6)]), "hit");
check("Flip Three asks for its target", g.pending?.card === "flipThree");
g = chooseTarget(g, 1);
check("a Freeze revealed inside it asks a second question", g.pending?.card === "freeze" && g.choices.length === 1);
g = chooseTarget(g, 2);
check("both choices were applied", g.round.players[2].status === "frozen" &&
    g.round.players[1].hand.filter((c) => c.kind === "number").length === 2);

console.log("\n--- Second Chance ---");
g = act(gameWith([mk("A", [secondChance]), mk("B"), mk("C")], [secondChance, num(2)]), "hit");
check("a spare Second Chance asks who gets it", g.pending?.card === "secondChance");
check("the holder is not an option", JSON.stringify(g.pending?.options) === "[1,2]");
g = chooseTarget(g, 2);
check("the chosen player now holds it", g.round.players[2].hand.length === 1);
check("no card was lost", g.round.deck.discardPile.length === 0);

g = act(gameWith([mk("A", [secondChance]), mk("B", [secondChance], "stayed")], [secondChance]), "hit");
check("with nobody eligible it is discarded", g.pending === null && g.round.deck.discardPile.length === 1);

console.log("\n--- Ties at 200+ ---");
function shuffleForTest(): Card[] {
    return Array.from({ length: 40 }, (_, k) => num((k % 12) + 1));
}
const roundOverWith = (a: number, b: number): Game => ({
    round: {
        players: [{ ...mk("A", [], "stayed"), totalScore: a }, { ...mk("B", [], "stayed"), totalScore: b }],
        deck: { drawPile: shuffleForTest(), discardPile: [] },
    },
    dealer: 0, current: -1, phase: "roundOver", winners: [], pending: null, choices: [], resume: null,
});
check("a single winner ends the game", nextRound(roundOverWith(210, 150)).phase === "gameOver");
check("the highest total wins", nextRound(roundOverWith(210, 230)).winners[0].id === "B");
const tied = nextRound(roundOverWith(210, 210));
check("an exact tie does not end the game", tied.phase !== "gameOver");
check("a tie deals another round to everyone", tied.round.players.length === 2 && tied.round.players.every((p) => p.totalScore === 210));
check("nobody over 200 keeps the game going", nextRound(roundOverWith(150, 120)).phase !== "gameOver");

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
console.log("Questions asked across all games:", questions);
console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);