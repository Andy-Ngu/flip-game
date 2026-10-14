import { addSeat, defaultSeats, MAX_SEATS, MIN_SEATS, removeSeat, Seat, seatProblem, toSetup, updateSeat } from "./seats";
import { botStep, isBotTurn, newGame } from "./session";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failures++;
}

let seats = defaultSeats();
check("default table has one human and two computers",
  seats.length === 3 && seats.filter((s) => s.kind === "human").length === 1);
check("the default table is valid", seatProblem(seats) === null);

seats = addSeat(seats);
check("adding a player gives a medium computer", seats.length === 4 && seats[3].kind === "medium");
check("the new player gets an unused name", new Set(seats.map((s) => s.name)).size === 4);
while (seats.length < MAX_SEATS) seats = addSeat(seats);
check("you can fill the table to the maximum", seats.length === MAX_SEATS);
check("all names are different at a full table", new Set(seats.map((s) => s.name)).size === MAX_SEATS);
check("adding past the maximum does nothing", addSeat(seats).length === MAX_SEATS);

seats = removeSeat(seats, 1);
check("removing a player works", seats.length === MAX_SEATS - 1 && !seats.some((s) => s.name === "Robo"));
let small = defaultSeats();
check("you can't remove below the minimum", removeSeat(small, 0).length === MIN_SEATS);

small = updateSeat(small, 1, { kind: "easy" });
check("changing a level changes only that seat", small[1].kind === "easy" && small[2].kind === "medium" && small[0].kind === "human");
check("changing one seat doesn't alter the original list", defaultSeats()[1].kind === "hard");

check("an empty name is a problem", seatProblem(updateSeat(small, 0, { name: "   " })) !== null);
check("duplicate names are a problem", seatProblem(updateSeat(small, 1, { name: "you" })) !== null);
check("duplicates are caught ignoring spaces and case", seatProblem(updateSeat(small, 1, { name: " YOU " })) !== null);

const setup = toSetup([{ name: " Sam ", kind: "human" }, { name: "Robo", kind: "hard" }, { name: "Cleo", kind: "easy" }] as Seat[]);
check("a human has no bot level", setup[0].name === "Sam" && setup[0].bot === undefined && !("bot" in setup[0]));
check("computers keep their level", setup[1].bot === "hard" && setup[2].bot === "easy");

// From the setup screen all the way into a running game.
let g = newGame(toSetup(addSeat(defaultSeats())));
check("a game starts with the chosen number of players", g.round.players.length === 4);
check("bots are flagged in the game", g.round.players.filter((p) => p.bot).length === 3);
let moves = 0;
while (isBotTurn(g) && moves++ < 50) g = botStep(g);
check("bots take their turns until it is the human's turn", !isBotTurn(g));

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
