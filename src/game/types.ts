// A card is one of three kinds. The "kind" field tells TypeScript which kind it is.
export type NumberCard = {
    kind: "number";
    value: number; // 0 to 12
};

export type ActionCard = {
    kind: "action";
    action: "freeze" | "flipThree" | "secondChance";
};

export type ModifierCard = {
    kind: "modifier";
    bonus: number;      // points added, e.g. 2, 4, 6, 8, 10
    multiplier: number; // 1 for normal cards, 2 for the x2 card
};

// A Card can be any one of those three.
export type Card = NumberCard | ActionCard | ModifierCard;

export type Player = {
    id: string;
    name: string;
    hand: Card[]; // cards in front of the player this round
    totalScore: number; // score across all rounds
    status: "playing" | "stayed" | "busted" | "frozen";
};

export type DeckState = {
    drawPile: Card[];
    discardPile: Card[];
};