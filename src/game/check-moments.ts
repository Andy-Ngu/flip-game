import { bustOdds, oddsLevel } from "./odds";
import { leaderOf, MIN_CROWN_POINTS, nearMargin, nearTarget, oneCardAway, projectedTotal } from "./moments";
import { ARRIVE_GAP_MS, arriveMs, NEXT_ROUND_MS, PLAYED_MS, RESHUFFLE_MS, SHIELD_MS, TOAST_MS } from "./momentTimes";
import { mk, num, shield } from "./testkit";
import { DeckState } from "./types";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failures++;
}

const hand = (...values: number[]) => values.map(num);

console.log("--- Who is winning right now ---");
check("projected total = banked points + this round's cards", projectedTotal(mk("A", hand(5, 7), "playing", { totalScore: 30 })) === 42);
check("a bust keeps only the banked points", projectedTotal(mk("A", hand(5, 5), "busted", { totalScore: 30 })) === 30);

let players = [
  mk("A", hand(10), "playing", { totalScore: 50 }),
  mk("B", hand(3), "playing", { totalScore: 80 }),
  mk("C", hand(12), "stayed", { totalScore: 60 }),
];
check("B has 83, C has 72, A has 60, so B leads", leaderOf(players) === 1);

players = [mk("A", hand(5), "playing", { totalScore: 40 }), mk("B", hand(5), "playing", { totalScore: 40 })];
check("a tie at the top means no crown", leaderOf(players) === null);

players = [mk("A", hand(5), "playing", { totalScore: 40 }), mk("B", hand(4), "playing", { totalScore: 40 }), mk("C", hand(5), "playing", { totalScore: 40 })];
check("a tie for first between two of three means no crown", leaderOf(players) === null);

players = [mk("A", hand(5), "playing", { totalScore: 10 }), mk("B", hand(1), "playing", { totalScore: 0 })];
check("a lead of only a few points gets no crown", leaderOf(players) === null && 15 < MIN_CROWN_POINTS);

players = [mk("A", hand(), "playing", { totalScore: MIN_CROWN_POINTS }), mk("B", hand(), "playing", { totalScore: 3 })];
check("a lead of exactly the minimum gets the crown", leaderOf(players) === 0);

players = [mk("A", hand(5, 5), "busted", { totalScore: 60 }), mk("B", hand(9), "playing", { totalScore: 55 })];
check("busting in the lead gives the crown away", leaderOf(players) === 1);

console.log("\n--- Nearly at the target ---");
check("the margin is a tenth of the target", nearMargin(150) === 15 && nearMargin(200) === 20 && nearMargin(250) === 25);
check("exactly on the margin is nearly there", nearTarget(mk("A", [], "stayed", { totalScore: 180 }), 200));
check("one point short of the margin is not", !nearTarget(mk("A", [], "stayed", { totalScore: 179 }), 200));
check("this round's cards count toward being close", nearTarget(mk("A", hand(12, 9), "playing", { totalScore: 160 }), 200));
check("the margin follows the target", nearTarget(mk("A", [], "stayed", { totalScore: 135 }), 150) && !nearTarget(mk("A", [], "stayed", { totalScore: 135 }), 200));
check("a player who is past the target is also nearly there", nearTarget(mk("A", [], "stayed", { totalScore: 230 }), 200));
check("a bust drops the round's points, so the glow can go", !nearTarget(mk("A", hand(12, 12), "busted", { totalScore: 170 }), 200));

console.log("\n--- One card away from a Seven Stack ---");
check("six different numbers and still playing", oneCardAway(mk("A", hand(1, 2, 3, 4, 5, 6))));
check("five is not close enough", !oneCardAway(mk("A", hand(1, 2, 3, 4, 5))));
check("a seventh number already makes the stack", !oneCardAway(mk("A", hand(1, 2, 3, 4, 5, 6, 7))));
check("a player who stayed has stopped, so no pulse", !oneCardAway(mk("A", hand(1, 2, 3, 4, 5, 6), "stayed")));
check("a bust has no pulse", !oneCardAway(mk("A", hand(1, 2, 3, 4, 5, 6), "busted")));
check("action cards do not count as numbers", oneCardAway(mk("A", [...hand(1, 2, 3, 4, 5, 6), shield])));
check("Shields among five numbers do not make six", !oneCardAway(mk("A", [...hand(1, 2, 3, 4, 5), shield, shield])));

console.log("\n--- Bust odds ---");
const deck = (draw: ReturnType<typeof hand>, discard: ReturnType<typeof hand> = []): DeckState => ({ drawPile: draw, discardPile: discard });

let o = bustOdds(mk("A", hand(5, 8)), deck(hand(5, 8, 1, 2)));
check("two of four cards would bust you: 50%", o.percent === 50 && o.dangerous === 2 && o.cardsLeft === 4);
check("no Shield, no shield icon", o.shield === false);

o = bustOdds(mk("A", hand(5)), deck(hand(1, 2, 3)));
check("nothing dangerous: 0%", o.percent === 0 && o.dangerous === 0);

o = bustOdds(mk("A", hand(5)), deck(hand(5, 5, 5)));
check("everything dangerous: 100%", o.percent === 100);

o = bustOdds(mk("A", hand(5)), deck(hand(5, 1, 1)));
check("one in three rounds to 33%", o.percent === 33);

o = bustOdds(mk("A", hand(5)), deck(hand(5, 1, 1, 1, 1, 1, 1)));
check("one in seven rounds to 14%", o.percent === 14);

o = bustOdds(mk("A", [...hand(5), shield]), deck(hand(5, 1)));
check("a held Shield is reported, so the screen can show the green shield", o.shield === true && o.percent === 50);

o = bustOdds(mk("A", hand(5)), deck([shield, num(2)]));
check("action cards in the pile are never dangerous", o.dangerous === 0 && o.percent === 0);

o = bustOdds(mk("A", [...hand(5), shield]), deck([shield, num(2)]));
check("a spare Shield is passed on, not a bust, even if you already hold one", o.dangerous === 0);

o = bustOdds(mk("A", hand(5)), deck([], hand(5, 1, 2, 3)));
check("with the draw pile empty it looks at the discard pile that will be reshuffled", o.cardsLeft === 4 && o.percent === 25);

o = bustOdds(mk("A", hand(5)), deck([], []));
check("with nothing anywhere it says 0% rather than dividing by zero", o.percent === 0 && o.cardsLeft === 0);

console.log("\n--- The colour of the odds bar ---");
check("under 15% is low, 15 to 39 medium, 40 and up high", oddsLevel(0) === "low" && oddsLevel(14) === "low" && oddsLevel(15) === "medium" && oddsLevel(39) === "medium" && oddsLevel(40) === "high" && oddsLevel(100) === "high");

console.log("\n--- How long messages stay ---");
check("Deck Empty stays 2.5 seconds, as asked", RESHUFFLE_MS === 2500);
check("Shield blocked stays long enough to read (3 seconds or more)", SHIELD_MS >= 3000);
check("a small message stays between 3.5 and 6 seconds", TOAST_MS >= 3500 && TOAST_MS <= 6000);
check("the next round starts by itself after 10 seconds", NEXT_ROUND_MS === 10000);
check("\"played on you\" stays long enough to read three short lines (3 to 5 seconds)", PLAYED_MS >= 3000 && PLAYED_MS <= 5000);

console.log("\n--- Cards that arrive one by one ---");
check("a gap of about a second lets each card fly in and settle before the next (0.7 to 1.2 seconds)", ARRIVE_GAP_MS >= 700 && ARRIVE_GAP_MS <= 1200);
check("no cards, no waiting", arriveMs(0) === 0 && arriveMs(-2) === 0);
check("each extra card adds one gap", arriveMs(3) - arriveMs(2) === ARRIVE_GAP_MS && arriveMs(2) - arriveMs(1) === ARRIVE_GAP_MS);
check("three cards take longer than the sound of one flick, so the computers wait for the last", arriveMs(3) > 2 * ARRIVE_GAP_MS);

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
