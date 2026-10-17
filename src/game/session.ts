import { endRound, isRoundOver } from "./rules";
import { ChooseTarget, dealRound, RoundState, takeTurn, TargetedKind } from "./round";
import { createDeck, shuffle } from "./deck";
import { DEFAULT_TARGET, getWinners, hasSevenStack, scoreHand } from "./scoring";
import { botDecide, botPickTarget } from "./bot";
import { AUTO_STAY_LIMIT } from "./clock";
import { BotLevel, Look, Player } from "./types";

export type Phase = "playing" | "roundOver" | "gameOver";

// The game is waiting for a human to pick a player.
export type Pending = {
  actor: number;          // who received the card
  card: TargetedKind;     // timeOut, drawThree or shield
  options: number[];      // players that can be chosen
};

// What was happening when the game paused.
type Resume = { kind: "deal" } | { kind: "turn"; decision: "hit" | "stay" };

// A seat at the table. Leave out `bot` for a human.
export type PlayerSetup = { name: string; bot?: BotLevel; look?: Look };

// A player's best round so far in this game, for the "I won" card.
export type BestRound = { points: number; sevenStack: boolean };

export type Game = {
  round: RoundState;   // players + deck. While paused this is the state BEFORE the move.
  dealer: number;
  current: number;     // whose turn it is (-1 when none)
  phase: Phase;
  winners: Player[];
  pending: Pending | null;
  choices: number[];   // choices made so far for the move in progress
  resume: Resume | null;
  note?: string;       // what just happened, for the screen to show
  target: number;      // the score that wins the game (150, 200 or 250)
  roundNo: number;     // 1 for the first round
  quiet: number[];     // per player: turns in a row where the clock ran out
  cover: boolean[];    // per player: a computer is playing this human's seat
  best: BestRound[];   // per player: their best round so far
  stacks: number[];    // per player: how many Seven Stacks they have made so far
};

// Thrown by the chooser when it needs an answer the player hasn't given yet.
class NeedTarget extends Error {
  constructor(public need: Pending) {
    super("Waiting for the player to choose a target");
  }
}

// Answers from `choices` in order. With only one legal option it answers by itself.
function makeChooser(choices: number[]): ChooseTarget {
  let k = 0;
  return (_players, actor, card, options) => {
    if (options.length === 1) return options[0];
    if (k < choices.length) return choices[k++];
    throw new NeedTarget({ actor, card, options });
  };
}

function nextActive(players: Player[], from: number): number {
  const n = players.length;
  for (let k = 1; k <= n; k++) {
    const i = (from + k) % n;
    if (players[i].status === "playing") return i;
  }
  return -1;
}

// Run a move from `base`. If a choice is needed that we don't have, pause and
// remember what was chosen so far. The move is simply re-run with one more
// answer, which is safe because the engine never changes its inputs.
function attempt(base: Game, resume: Resume, choices: number[]): Game {
  const choose = makeChooser(choices);
  try {
    if (resume.kind === "deal") {
      const round = dealRound(base.round, base.dealer, choose);
      const over = isRoundOver(round.players);
      return {
        ...base, round, pending: null, choices: [], resume: null, note: undefined,
        current: over ? -1 : nextActive(round.players, base.dealer),
        phase: over ? "roundOver" : "playing",
      };
    }
    const round = takeTurn(base.round, base.current, resume.decision, choose);
    const over = isRoundOver(round.players);
    return {
      ...base, round, pending: null, choices: [], resume: null, note: undefined,
      current: over ? -1 : nextActive(round.players, base.current),
      phase: over ? "roundOver" : "playing",
    };
  } catch (e) {
    if (e instanceof NeedTarget) return { ...base, pending: e.need, choices, resume, note: undefined };
    throw e;
  }
}

type Carry = Pick<Game, "target" | "roundNo" | "quiet" | "cover" | "best" | "stacks">;

function beginRound(round: RoundState, dealer: number, carry: Carry): Game {
  const base: Game = {
    round, dealer, current: -1, phase: "playing", winners: [],
    pending: null, choices: [], resume: null, ...carry,
  };
  return attempt(base, { kind: "deal" }, []);
}

export type NewGameOptions = { target?: number };

export function newGame(setup: (string | PlayerSetup)[], options: NewGameOptions = {}): Game {
  const players: Player[] = setup.map((s, i) => {
    const { name, bot, look } = typeof s === "string" ? { name: s, bot: undefined, look: undefined } : s;
    return { id: `p${i + 1}`, name, hand: [], totalScore: 0, status: "playing", ...(bot ? { bot } : {}), ...(look ? { look } : {}) };
  });
  const deck = { drawPile: shuffle(createDeck()), discardPile: [], seed: Math.floor(Math.random() * 2 ** 31) };
  const n = players.length;
  return beginRound({ players, deck }, 0, {
    target: options.target ?? DEFAULT_TARGET,
    roundNo: 1,
    quiet: Array(n).fill(0),
    cover: Array(n).fill(false),
    best: Array.from({ length: n }, () => ({ points: 0, sevenStack: false })),
    stacks: Array(n).fill(0),
  });
}

// ---------- who is acting ----------

// The seat that must act right now: whoever has to answer a question, else whoever's turn it is.
// -1 when nobody does (between rounds, or when the game is over).
export function actorOf(game: Game): number {
  return game.pending ? game.pending.actor : game.phase === "playing" ? game.current : -1;
}

// Is this seat played by the computer? A computer player, or a human whose seat a computer is covering.
export function isBotSeat(game: Game, seat: number): boolean {
  return game.round.players[seat]?.bot !== undefined || game.cover[seat] === true;
}

function withQuiet(game: Game, seat: number, value: number): Game {
  if (game.quiet[seat] === value) return game;
  return { ...game, quiet: game.quiet.map((q, i) => (i === seat ? value : q)) };
}

// ---------- moves ----------

function playTurn(game: Game, decision: "hit" | "stay"): Game {
  if (game.phase !== "playing" || game.pending) return game;
  return attempt(game, { kind: "turn", decision }, []);
}

function applyChoice(game: Game, target: number): Game {
  if (!game.pending || !game.resume) return game;
  if (!game.pending.options.includes(target)) return game;
  return attempt(game, game.resume, [...game.choices, target]);
}

// The current player hits or stays. May pause to ask for a target.
// A human who plays a move has not gone quiet, so their count of missed turns starts over.
export function act(game: Game, decision: "hit" | "stay"): Game {
  const seat = game.current;
  const next = playTurn(game, decision);
  return next !== game && seat >= 0 && !isBotSeat(game, seat) ? withQuiet(next, seat, 0) : next;
}

// The player answers a pending question by picking a player.
export function chooseTarget(game: Game, target: number): Game {
  const seat = game.pending ? game.pending.actor : -1;
  const next = applyChoice(game, target);
  return next !== game && seat >= 0 && !isBotSeat(game, seat) ? withQuiet(next, seat, 0) : next;
}

// ---------- the turn clock ----------

// The clock ran out on a human's turn. They stay for you. If a card is waiting for a target, a random
// legal player gets it. Letting the clock run out three turns in a row hands the seat to a computer.
export function timeUp(game: Game, random: () => number = Math.random): Game {
  const seat = actorOf(game);
  if (seat < 0 || isBotSeat(game, seat)) return game;
  const me = game.round.players[seat];
  const missed = game.quiet[seat] + 1;

  let next: Game;
  let note: string;
  if (game.pending) {
    const { options, card } = game.pending;
    const pick = options[Math.floor(random() * options.length)];
    next = applyChoice(game, pick);
    note = `Time ran out, so ${CARD_NAME[card]} went to ${game.round.players[pick].name}`;
  } else if (me.hand.length === 0) {
    next = playTurn(game, "hit"); // staying needs at least one card
    note = "Time ran out, so a card was drawn";
  } else {
    next = playTurn(game, "stay");
    // Remember that this player did not choose to stay, for the round results.
    if (next !== game) {
      next = {
        ...next,
        round: { ...next.round, players: next.round.players.map((p, i) => (i === seat ? { ...p, autoStayed: true } : p)) },
      };
    }
    note = "Time ran out, so you stayed";
  }

  next = withQuiet(next, seat, missed);
  if (missed >= AUTO_STAY_LIMIT && !next.cover[seat]) {
    next = { ...next, cover: next.cover.map((c, i) => (i === seat ? true : c)) };
  }
  return { ...next, note };
}

// The player comes back. The computer stops playing their seat and the missed-turn count starts over.
export function imBack(game: Game, seat: number): Game {
  if (!game.cover[seat] && game.quiet[seat] === 0) return game;
  return {
    ...game,
    cover: game.cover.map((c, i) => (i === seat ? false : c)),
    quiet: game.quiet.map((q, i) => (i === seat ? 0 : q)),
  };
}

// ---------- rounds ----------

// Bank the round's scores, then either finish the game or deal the next round.
export function nextRound(game: Game): Game {
  if (game.phase !== "roundOver") return game;
  // Remember each player's best round, and their Seven Stacks, before the hands are cleared.
  const best = game.round.players.map((p, i) => {
    const points = scoreHand(p);
    const old = game.best[i] ?? { points: 0, sevenStack: false };
    return points > old.points ? { points, sevenStack: hasSevenStack(p) } : old;
  });
  const stacks = game.round.players.map((p, i) => (game.stacks[i] ?? 0) + (hasSevenStack(p) ? 1 : 0));
  const ended = endRound(game.round.players, game.round.deck);
  const winners = getWinners(ended.players, game.target);
  // Exactly one winner ends the game. The rulebook is silent on an exact tie at
  // the top; the Dized FAQ says everyone plays another round, so we do that.
  if (winners.length === 1) {
    return {
      round: ended, dealer: game.dealer, current: -1, phase: "gameOver", winners,
      pending: null, choices: [], resume: null,
      target: game.target, roundNo: game.roundNo, quiet: game.quiet, cover: game.cover, best, stacks,
    };
  }
  return beginRound(ended, (game.dealer + 1) % ended.players.length, {
    target: game.target, roundNo: game.roundNo + 1, quiet: game.quiet, cover: game.cover, best, stacks,
  });
}

// ---------- computer players ----------

// Is the game waiting on a computer player? That is the player whose turn it
// is, or the player who must answer a pending question.
export function isBotTurn(game: Game): boolean {
  const who = actorOf(game);
  return who >= 0 && isBotSeat(game, who);
}

const CARD_NAME = { timeOut: "Time Out", drawThree: "Draw Three", shield: "a spare Shield" } as const;

// A card a computer player is about to play: who plays it, which card, and who gets it.
export type Play = { actor: number; card: TargetedKind; target: number };

// What the next computer move will be, if it is the playing of a card (a Time Out, Draw Three or spare Shield
// waiting for a target), and null if it is a plain hit or stay. It picks the target the same way botStep does,
// without making the move, so the screen can tell the player what is coming before it happens.
export function botPlay(game: Game): Play | null {
  if (!game.pending || !isBotTurn(game)) return null;
  const { actor, card, options } = game.pending;
  return { actor, card, target: botPickTarget(game.round.players, actor, card, options) };
}

// Make ONE computer move. The screen calls this on a timer so the human can
// follow what happened, instead of the bots finishing everything instantly.
export function botStep(game: Game): Game {
  if (!isBotTurn(game)) return game;
  const players = game.round.players;

  const play = botPlay(game);
  if (play) {
    const { actor, card, target } = play;
    const who = players[actor].name;
    const note = target === actor
      ? `${who} played ${CARD_NAME[card]} on themselves`
      : `${who} played ${CARD_NAME[card]} on ${players[target].name}`;
    return { ...chooseTarget(game, target), note };
  }

  const name = players[game.current].name;
  const decision = botDecide(players, game.current);
  const next = act(game, decision);
  return { ...next, note: decision === "hit" ? `${name} hit` : `${name} stayed` };
}

// Dealing can ask a question too: somebody was dealt a Time Out or a Draw Three. A computer player
// answers theirs on the spot, so the table is dealt in one go and nobody sees it half empty. A question
// for a human is left waiting for them. (Their answers leave no note: the cards on the table tell the
// story. The note the game came with is kept.)
export function settleDeal(game: Game): Game {
  let g = game;
  // A deal asks a handful of questions at most; the limit is only a safety net.
  for (let i = 0; i < 64 && g.pending && g.resume?.kind === "deal" && isBotSeat(g, g.pending.actor); i++) {
    g = botStep(g);
  }
  return g === game ? game : { ...g, note: game.note };
}
