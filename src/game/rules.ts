import { shuffle } from "./deck";
import { hasFlip7, scoreHand } from "./scoring";
import { Card, DeckState, Player } from "./types";

// Take the top card. If the draw pile is empty, reshuffle the discard pile first.
export function drawCard(deck: DeckState): { card: Card; deck: DeckState } {
    let drawPile = deck.drawPile;
    let discardPile = deck.discardPile;

    if (drawPile.length === 0) {
        if (discardPile.length === 0) throw new Error("No cards left to draw");
        drawPile = shuffle(discardPile);
        discardPile = [];
    }

    const [card, ...rest] = drawPile;
    return { card, deck: { drawPile: rest, discardPile } };
}

export function isDuplicate(hand: Card[], card: Card): boolean {
    if (card.kind !== "number") return false;
    return hand.some((c) => c.kind === "number" && c.value === card.value);
}

const isSecondChance = (c: Card): boolean =>
    c.kind === "action" && c.action === "secondChance";

// "discarded" lists cards that left the game mid-round, so the caller can
// put them on the discard pile and no card goes missing.
export type HitResult = { player: Player; discarded: Card[] };

export function hit(player: Player, card: Card): HitResult {
    if (player.status !== "playing") {
        throw new Error("This player can't take another card");
    }

    // A player can hold only one Second Chance. Passing a spare to another
    // player comes later; for now it is discarded.
    if (isSecondChance(card) && player.hand.some(isSecondChance)) {
        return { player, discarded: [card] };
    }

    if (isDuplicate(player.hand, card)) {
        const idx = player.hand.findIndex(isSecondChance);
        if (idx !== -1) {
            // Second Chance saves you: discard it and the duplicate.
            const saver = player.hand[idx];
            const hand = player.hand.filter((_, i) => i !== idx);
            return { player: { ...player, hand }, discarded: [saver, card] };
        }
        return {
            player: { ...player, hand: [...player.hand, card], status: "busted" },
            discarded: [],
        };
    }

    return {
        player: { ...player, hand: [...player.hand, card] },
        discarded: [],
    };
}

export function stay(player: Player): Player {
    if (player.hand.length === 0) {
        throw new Error("You need at least one card to stay");
    }
    return { ...player, status: "stayed" };
}

// The round ends when someone flips 7, or nobody is still playing.
export function isRoundOver(players: Player[]): boolean {
    return players.some(hasFlip7) || players.every((p) => p.status !== "playing");
}

// Bank scores, move every card in front of players to the discard pile,
// and reset players for the next round.
export function endRound(
    players: Player[],
    deck: DeckState
): { players: Player[]; deck: DeckState } {
    const discarded = players.flatMap((p) => p.hand);
    const next = players.map(
        (p): Player => ({
            ...p,
            totalScore: p.totalScore + scoreHand(p),
            hand: [],
            status: "playing",
        })
    );
    return {
        players: next,
        deck: { ...deck, discardPile: [...deck.discardPile, ...discarded] },
    };
}