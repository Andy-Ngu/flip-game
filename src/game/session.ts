import { createDeck, shuffle } from "./deck";
import { dealRound, randomTarget, RoundState, takeTurn } from "./round";
import { endRound, isRoundOver } from "./rules";
import { getWinners } from "./scoring";
import { Player } from "./types";

export type Phase = "playing" | "roundOver" | "gameOver";

export type Game = {
    round: RoundState;   // players + deck for the current round
    dealer: number;      // index of the dealer
    current: number;     // index of the player whose turn it is (-1 when none)
    phase: Phase;
    winners: Player[];   // filled in when phase is "gameOver"
};

function nextActive(players: Player[], from: number): number {
    const n = players.length;
    for (let k = 1; k <= n; k++) {
        const i = (from + k) % n;
        if (players[i].status === "playing") return i;
    }
    return -1;
}

function beginRound(round: RoundState, dealer: number): Game {
    const dealt = dealRound(round, dealer, randomTarget);
    const over = isRoundOver(dealt.players);
    return {
        round: dealt,
        dealer,
        current: over ? -1 : nextActive(dealt.players, dealer),
        phase: over ? "roundOver" : "playing",
        winners: [],
    };
}

export function newGame(names: string[]): Game {
    const players: Player[] = names.map((name, i) => ({
        id: `p${i + 1}`, name, hand: [], totalScore: 0, status: "playing",
    }));
    const deck = { drawPile: shuffle(createDeck()), discardPile: [] };
    return beginRound({ players, deck }, 0);
}

// The current player hits or stays.
export function act(game: Game, decision: "hit" | "stay"): Game {
    if (game.phase !== "playing") return game;
    const round = takeTurn(game.round, game.current, decision, randomTarget);
    if (isRoundOver(round.players)) {
        return { ...game, round, current: -1, phase: "roundOver" };
    }
    return { ...game, round, current: nextActive(round.players, game.current) };
}

// Bank the round's scores, then either finish the game or deal the next round.
export function nextRound(game: Game): Game {
    if (game.phase !== "roundOver") return game;
    const ended = endRound(game.round.players, game.round.deck);
    const winners = getWinners(ended.players);
    if (winners.length > 0) {
        return { round: ended, dealer: game.dealer, current: -1, phase: "gameOver", winners };
    }
    return beginRound(ended, (game.dealer + 1) % ended.players.length);
}