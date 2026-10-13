import { createDeck, shuffle } from "./deck";
import { describeCard } from "./describe";
import { drawCard, endRound, hit, isRoundOver, stay } from "./rules";
import { getWinners, scoreHand } from "./scoring";
import { Card, DeckState, Player } from "./types";

// ---------- tiny test helpers ----------
let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    console.log(`${ok ? "PASS" : "FAIL"}: ${name}` +
        (ok ? "" : ` (got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)})`));
    if (!ok) failures++;
}
function throws(fn: () => unknown): boolean {
    try { fn(); return false; } catch { return true; }
}

// ---------- card and player builders ----------
const num = (value: number): Card => ({ kind: "number", value });
const bonus = (b: number): Card => ({ kind: "modifier", bonus: b, multiplier: 1 });
const x2: Card = { kind: "modifier", bonus: 0, multiplier: 2 };
const secondChance: Card = { kind: "action", action: "secondChance" };

function makePlayer(
    id: string,
    hand: Card[] = [],
    status: Player["status"] = "stayed",
    totalScore = 0
): Player {
    return { id, name: id, hand, totalScore, status };
}
const score = (hand: Card[], status: Player["status"] = "stayed") =>
    scoreHand(makePlayer("t", hand, status));

// ---------- deck ----------
console.log("--- Deck ---");
check("deck has 94 cards", createDeck().length, 94);
check("shuffle keeps 94 cards", shuffle(createDeck()).length, 94);
check("describeCard shows x2", describeCard(x2), "Score x2");

// ---------- scoring (examples from the rulebook) ----------
console.log("\n--- Scoring ---");
const base = [num(3), num(11), num(5), num(7), num(10)];
check("3+11+5+7+10 = 36", score(base), 36);
check("with x2 = 72", score([...base, x2]), 72);
check("with +10 = 46", score([...base, bonus(10)]), 46);
check("seven unique = 64", score([...base, num(9), num(4)]), 64);
check("11+5+12 with +4 = 32", score([num(11), num(5), num(12), bonus(4)]), 32);
check("x2 first, then +10 = 82", score([...base, x2, bonus(10)]), 82);
check("busted scores 0", score(base, "busted"), 0);

// ---------- hit, bust, Second Chance, stay ----------
console.log("\n--- Rules ---");
const busted = hit(makePlayer("a", [num(7)], "playing"), num(7));
check("duplicate busts", busted.player.status, "busted");

const saved = hit(makePlayer("b", [num(7), secondChance], "playing"), num(7));
check("Second Chance saves the player", saved.player.status, "playing");
check("hand keeps only the 7", saved.player.hand, [num(7)]);
check("Second Chance and duplicate discarded", saved.discarded.length, 2);

check("can't stay with no cards", throws(() => stay(makePlayer("c", [], "playing"))), true);

// ---------- deck reshuffle ----------
console.log("\n--- Reshuffle ---");
const empty: DeckState = { drawPile: [], discardPile: [num(1), num(2), num(3)] };
const drawn = drawCard(empty);
check("reshuffled discards into the draw pile", drawn.deck.drawPile.length, 2);
check("discard pile is now empty", drawn.deck.discardPile.length, 0);

// ---------- winners ----------
console.log("\n--- Winners ---");
const w = (a: number, b: number) =>
    getWinners([makePlayer("x", [], "playing", a), makePlayer("y", [], "playing", b)]);
check("nobody at 200 yet", w(190, 150).length, 0);
check("highest score wins", w(210, 230).map((p) => p.id), ["y"]);
check("exact tie returns both", w(210, 210).length, 2);

// ---------- full simulated games ----------
// Three players who stay once they hold 4 cards. The deck persists between
// rounds, and the card count must be 94 after every round.
function simulateGame() {
    let deck: DeckState = { drawPile: shuffle(createDeck()), discardPile: [] };
    let players: Player[] = ["Ann", "Ben", "Cat"].map((n) => makePlayer(n, [], "playing"));
    let cardsOk = true;

    for (let round = 1; round <= 200; round++) {
        while (!isRoundOver(players)) {
            for (let i = 0; i < players.length; i++) {
                if (players[i].status !== "playing") continue;
                const draw = drawCard(deck);
                const result = hit(players[i], draw.card);
                let p = result.player;
                if (p.status === "playing" && p.hand.length >= 4) p = stay(p);
                players = players.map((q, j) => (j === i ? p : q));
                deck = {
                    drawPile: draw.deck.drawPile,
                    discardPile: [...draw.deck.discardPile, ...result.discarded],
                };
                if (isRoundOver(players)) break;
            }
        }
        const ended = endRound(players, deck);
        players = ended.players;
        deck = ended.deck;
        if (deck.drawPile.length + deck.discardPile.length !== 94) cardsOk = false;

        const winners = getWinners(players);
        if (winners.length > 0) return { round, winners, cardsOk };
    }
    return { round: 200, winners: [] as Player[], cardsOk };
}

console.log("\n--- Simulated games ---");
for (let g = 1; g <= 3; g++) {
    const r = simulateGame();
    console.log(
        `Game ${g}: ended after ${r.round} rounds. Winner: ` +
        r.winners.map((p) => `${p.name} (${p.totalScore})`).join(", ")
    );
    check(`game ${g} kept all 94 cards every round`, r.cardsOk, true);
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);