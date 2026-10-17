import {
  ADJECTIVES, CHARACTERS, COLORS, isCharacter, isColor, NOUNS, parseProfile, Profile, profileLook,
  profileName, randomProfile, rerollName, ROBOT, withCharacter, withColor,
} from "./profile";
import { emptyStats, GameResult, parseStats, recordGame, resultOf, winRate } from "./stats";
import { act, Game, nextRound } from "./session";
import { gameFrom, mk, num } from "./testkit";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failures++;
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

console.log("--- Characters and colours ---");
check("twelve characters, each with a word for its name", CHARACTERS.length === 12 && CHARACTERS.every((c) => NOUNS[c].length > 0));
check("the robot is not one of the characters you can pick", !isCharacter(ROBOT));
check("eight colours, all different", COLORS.length === 8 && new Set(COLORS).size === 8);
check("there are plenty of words for names", ADJECTIVES.length >= 20 && new Set(ADJECTIVES).size === ADJECTIVES.length);
check("every word is short and friendly to read", ADJECTIVES.every((a) => /^[A-Z][a-z]{2,7}$/.test(a)));

console.log("\n--- A profile ---");
const fox: Profile = { adjective: "Daring", character: "fox", color: COLORS[0] };
check("the name is the word plus the character", profileName(fox) === "Daring Fox");
check("picking another character keeps the word", profileName(withCharacter(fox, "owl")) === "Daring Owl");
check("the look is the character on the colour", same(profileLook(fox), { character: "fox", color: COLORS[0] }));
check("picking a colour changes only the colour", same(withColor(fox, COLORS[3]), { ...fox, color: COLORS[3] }));
check("an unknown colour is ignored", withColor(fox, "#123456") === fox);
let rerolls = true;
for (let i = 0; i < 200; i++) {
  const r = rerollName(fox, () => (i % 100) / 100);
  if (r.adjective === fox.adjective || r.character !== fox.character || r.color !== fox.color) rerolls = false;
}
check("New name always picks a different word and keeps the rest", rerolls);
check("New name works at both ends of the dice", rerollName(fox, () => 0).adjective !== "Daring" && rerollName(fox, () => 0.999999).adjective !== "Daring");

const seen = new Set<string>();
let allValid = true;
for (let i = 0; i < 300; i++) {
  const p = randomProfile();
  seen.add(profileName(p));
  if (!isCharacter(p.character) || !isColor(p.color) || !ADJECTIVES.includes(p.adjective as never)) allValid = false;
}
check("a random profile is always made of real parts", allValid);
check("random profiles vary", seen.size > 50);
check("the dice at their extremes still give a real profile", isCharacter(randomProfile(() => 0).character) && isCharacter(randomProfile(() => 0.9999999).character));

console.log("\n--- Reading a stored profile ---");
check("a good profile comes back unchanged", same(parseProfile(JSON.parse(JSON.stringify(fox))), fox));
check("nothing usable gives null", parseProfile(null) === null && parseProfile("fox") === null && parseProfile(5) === null && parseProfile({}) === null);
check("a missing part gives null", parseProfile({ adjective: "Daring", character: "fox" }) === null);

console.log("\n--- Your record ---");
const win: GameResult = { won: true, bestRound: 61, sevenStacks: 2, finalScore: 214 };
const loss: GameResult = { won: false, bestRound: 40, sevenStacks: 0, finalScore: 120 };
let s = recordGame(emptyStats(), win);
check("a win counts as a game and a win", s.games === 1 && s.wins === 1);
s = recordGame(s, loss);
check("a loss counts as a game only", s.games === 2 && s.wins === 1);
check("the best round and top score keep the highest", s.bestRound === 61 && s.topScore === 214);
check("Seven Stacks add up", s.sevenStacks === 2 && recordGame(s, win).sevenStacks === 4);
check("a smaller game does not lower a record", recordGame(s, { ...loss, bestRound: 10, finalScore: 90 }).bestRound === 61);
check("a new record replaces the old one", recordGame(s, { ...win, bestRound: 70, finalScore: 260 }).topScore === 260);
check("win rate is a whole percent", winRate(s) === 50 && winRate({ ...emptyStats(), games: 3, wins: 1 }) === 33 && winRate({ ...emptyStats(), games: 3, wins: 2 }) === 67);
check("win rate is 0 before the first game", winRate(emptyStats()) === 0);
check("recording does not change the old stats", (() => { const a = emptyStats(); recordGame(a, win); return a.games === 0; })());
check("a good record is read back", same(parseStats(JSON.parse(JSON.stringify(s))), s));
check("garbage gives an empty record", same(parseStats("x"), emptyStats()) && same(parseStats(null), emptyStats()));
check("a negative or silly number falls back", parseStats({ games: -1, wins: 1e12, bestRound: NaN }).bestRound === 0);
check("you cannot have more wins than games", (() => { const p = parseStats({ games: 2, wins: 9 }); return p.wins === 2; })());

console.log("\n--- Reading a finished game ---");
const six = [num(1), num(2), num(3), num(4), num(5), num(6)];
const rig = (): Game => gameFrom(
  [mk("Me", six, "playing", { totalScore: 190 }), mk("B", [num(9)], "stayed", { totalScore: 150, bot: "easy" }), mk("C", [num(2)], "stayed", { totalScore: 20, bot: "easy" })],
  [num(7), num(8)],
);
let g = act(rig(), "hit"); // a seventh number: Seven Stack and the round ends
check("the round ended with a Seven Stack", g.phase === "roundOver" && g.round.players[0].hand.length === 7);
check("an unfinished game has no result", resultOf(g, 0) === null);
g = nextRound(g);
check("this was the end of the game", g.phase === "gameOver" && g.winners[0].id === "Me");
const result = resultOf(g, 0)!;
check("it reads as a win", result.won && result.finalScore === 190 + 43);
check("the best round and the Seven Stack are counted", result.bestRound === 43 && result.sevenStacks === 1);
check("another player lost", resultOf(g, 1)!.won === false && resultOf(g, 1)!.sevenStacks === 0);
check("a seat that does not exist gives null", resultOf(g, 9) === null);

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
