import { NumberCard, Player } from "./types";

function numberCards(player: Player): NumberCard[] {
    return player.hand.filter((c): c is NumberCard => c.kind === "number");
}

export function uniqueNumberCount(player: Player): number {
    return new Set(numberCards(player).map((c) => c.value)).size;
}

// Seven different number cards. Actions and modifiers don't count.
export function hasFlip7(player: Player): boolean {
    return uniqueNumberCount(player) >= 7;
}

// Order from the rulebook: sum number cards, apply x2, add bonuses, add 15 for Flip 7.
export function scoreHand(player: Player): number {
    if (player.status === "busted") return 0;

    let total = numberCards(player).reduce((sum, c) => sum + c.value, 0);

    const hasDouble = player.hand.some(
        (c) => c.kind === "modifier" && c.multiplier === 2
    );
    if (hasDouble) total *= 2;

    for (const c of player.hand) {
        if (c.kind === "modifier") total += c.bonus;
    }

    if (hasFlip7(player)) total += 15;
    return total;
}

// Call this only at the END of a round. The highest total at or above the
// target wins. An exact tie returns every tied player (my assumption).
export function getWinners(players: Player[], target = 200): Player[] {
    const best = Math.max(...players.map((p) => p.totalScore));
    if (best < target) return [];
    return players.filter((p) => p.totalScore === best);
}