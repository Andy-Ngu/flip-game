import { createDeck, shuffle } from "./deck";
import { ChooseTarget, dealRound, RoundState, takeTurn, TargetedKind } from "./round";
import { endRound, isRoundOver } from "./rules";
import { getWinners } from "./scoring";
import { Player } from "./types";

export type Phase = "playing" | "roundOver" | "gameOver";

// The game is waiting for a human to pick a player.
export type Pending = {
    actor: number;          // who received the card
    card: TargetedKind;     // freeze, flipThree or secondChance
    options: number[];      // players that can be chosen
};

// What was happening when the game paused.
type Resume = { kind: "deal" } | { kind: "turn"; decision: "hit" | "stay" };

export type Game = {
    round: RoundState;   // players + deck. While paused this is the state BEFORE the move.
    dealer: number;
    current: number;     // whose turn it is (-1 when none)
    phase: Phase;
    winners: Player[];
    pending: Pending | null;
    choices: number[];   // choices made so far for the move in progress
    resume: Resume | null;
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
                ...base, round, pending: null, choices: [], resume: null,
                current: over ? -1 : nextActive(round.players, base.dealer),
                phase: over ? "roundOver" : "playing",
            };
        }
        const round = takeTurn(base.round, base.current, resume.decision, choose);
        const over = isRoundOver(round.players);
        return {
            ...base, round, pending: null, choices: [], resume: null,
            current: over ? -1 : nextActive(round.players, base.current),
            phase: over ? "roundOver" : "playing",
        };
    } catch (e) {
        if (e instanceof NeedTarget) return { ...base, pending: e.need, choices, resume };
        throw e;
    }
}

function beginRound(round: RoundState, dealer: number): Game {
    const base: Game = {
        round, dealer, current: -1, phase: "playing", winners: [],
        pending: null, choices: [], resume: null,
    };
    return attempt(base, { kind: "deal" }, []);
}

export function newGame(names: string[]): Game {
    const players: Player[] = names.map((name, i) => ({
        id: `p${i + 1}`, name, hand: [], totalScore: 0, status: "playing",
    }));
    const deck = { drawPile: shuffle(createDeck()), discardPile: [] };
    return beginRound({ players, deck }, 0);
}

// The current player hits or stays. May pause to ask for a target.
export function act(game: Game, decision: "hit" | "stay"): Game {
    if (game.phase !== "playing" || game.pending) return game;
    return attempt(game, { kind: "turn", decision }, []);
}

// The player answers a pending question by picking a player.
export function chooseTarget(game: Game, target: number): Game {
    if (!game.pending || !game.resume) return game;
    if (!game.pending.options.includes(target)) return game;
    return attempt(game, game.resume, [...game.choices, target]);
}

// Bank the round's scores, then either finish the game or deal the next round.
export function nextRound(game: Game): Game {
    if (game.phase !== "roundOver") return game;
    const ended = endRound(game.round.players, game.round.deck);
    const winners = getWinners(ended.players);
    if (winners.length === 1) {
        return {
            round: ended, dealer: game.dealer, current: -1, phase: "gameOver", winners,
            pending: null, choices: [], resume: null,
        };
    }
    return beginRound(ended, (game.dealer + 1) % ended.players.length);
}