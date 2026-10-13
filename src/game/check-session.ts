import { scoreHand } from "./scoring";
import { act, Game, newGame, nextRound } from "./session";

let failures = 0;
function check(name: string, ok: boolean) {
    console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
    if (!ok) failures++;
}

let g = newGame(["Ann", "Ben", "Cat"]);
check("a new game starts in the playing phase (or round over after the deal)", g.phase === "playing" || g.phase === "roundOver");

let allGamesEnded = true, allCardsKept = true, turnsAlwaysValid = true;
for (let n = 0; n < 200; n++) {
    let game: Game = newGame(["Ann", "Ben", "Cat", "Dee"].slice(0, 3 + (n % 2)));
    let steps = 0;
    while (game.phase !== "gameOver" && steps++ < 5000) {
        if (game.phase === "playing") {
            if (game.round.players[game.current]?.status !== "playing") turnsAlwaysValid = false;
            const me = game.round.players[game.current];
            game = act(game, me.hand.length === 0 || scoreHand(me) < 20 ? "hit" : "stay");
        } else {
            game = nextRound(game);
        }
        const total = game.round.deck.drawPile.length + game.round.deck.discardPile.length +
            game.round.players.reduce((s, p) => s + p.hand.length, 0);
        if (total !== 94) allCardsKept = false;
    }
    if (game.phase !== "gameOver" || game.winners.length === 0) allGamesEnded = false;
}
check("200 games played to a winner through act/nextRound", allGamesEnded);
check("it is always an active player's turn", turnsAlwaysValid);
check("94 cards accounted for after every single step", allCardsKept);
console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);