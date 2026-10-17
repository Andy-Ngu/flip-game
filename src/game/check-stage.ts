import { stageInfo } from "./stageInfo";
import { act, timeUp } from "./session";
import { drawThree, gameFrom, mk, num, shield, timeOut } from "./testkit";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failures++;
}

const hand = (...v: number[]) => v.map(num);

console.log("--- Your turn ---");
let g = gameFrom([mk("Me", hand(3, 7)), mk("Fizz", hand(5)), mk("Robo", hand(9))], [num(1), num(2), num(4)], { current: 0 });
let s = stageInfo(g, 0);
check("on your turn the stage says so and the buttons work", s.mood === "turn" && s.title === "YOUR TURN" && s.canAct && !s.mustChoose && s.sub === "" && s.short === "");

console.log("\n--- Waiting for someone else ---");
g = { ...g, current: 1 };
s = stageInfo(g, 0);
check("while Fizz plays, you see your hand and who is up", s.mood === "waiting" && s.title === "YOUR HAND" && s.sub === "Fizz is up" && !s.canAct);
check("the short version just says you are waiting", s.short === "Waiting");

console.log("\n--- A card that needs a player picked ---");
const pickGame = act(gameFrom([mk("Me", hand(3)), mk("Fizz", hand(5)), mk("Robo", hand(9))], [timeOut, num(1)], { current: 0 }), "hit");
check("the game is waiting for you to pick", pickGame.pending !== null && pickGame.pending.actor === 0);
s = stageInfo(pickGame, 0);
check("your stage says it is your turn but the buttons stay off", s.mood === "turn" && s.mustChoose && !s.canAct);
const botPick = act(gameFrom([mk("Me", hand(3)), mk("Fizz", hand(5)), mk("Robo", hand(9))], [num(1)], { current: 1 }), "hit");
const fizzPicks = { ...botPick, pending: { actor: 1, card: "drawThree" as const, options: [0, 1, 2] } };
check("when someone else is choosing, you are told", stageInfo(fizzPicks, 0).sub === "Fizz is choosing a player");

console.log("\n--- What became of you ---");
const players = (me: ReturnType<typeof mk>) => gameFrom([me, mk("Fizz", hand(5)), mk("Robo", hand(9))], [num(1)], { current: 1 });
s = stageInfo(players(mk("Me", hand(3, 7, 7), "busted")), 0);
check("busted", s.mood === "bust" && s.title === "BUSTED" && s.sub === "This round scores 0" && !s.canAct && s.short === "Scores 0");
s = stageInfo(players(mk("Me", hand(3, 7), "stayed")), 0);
check("stayed shows what you banked", s.mood === "stayed" && s.sub === "Banked 10" && s.short === "Banked 10");
s = stageInfo(players(mk("Me", [...hand(4, 6), drawThree], "timedOut", { timedOutBy: 1 })), 0);
check("timed out says by whom and what you keep", s.mood === "out" && s.sub === "Out by Fizz · keeps 10" && s.short === "Keeps 10");
s = stageInfo(players(mk("Me", hand(4), "timedOut", { timedOutBy: 0 })), 0);
check("timing yourself out is not blamed on anyone", s.sub === "Out for the round · keeps 4");

console.log("\n--- Between rounds ---");
s = stageInfo({ ...g, phase: "roundOver", current: -1 }, 0);
check("when the round is over the stage says so", s.mood === "over" && s.title === "ROUND OVER" && !s.canAct);

console.log("\n--- The clock running out ---");
const clockGame = gameFrom([mk("Me", hand(3, 7)), mk("Fizz", hand(5)), mk("Robo", hand(9))], [num(1)], { current: 0 });
const out = timeUp(clockGame, () => 0);
check("after the clock runs out you have stayed", stageInfo(out, 0).mood === "stayed");
check("a shield in hand does not change anything", stageInfo(gameFrom([mk("Me", [num(2), shield]), mk("Fizz", hand(5))], [num(1)], { current: 0 }), 0).canAct);

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
