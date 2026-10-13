import { Card } from "./types";

export function describeCard(card: Card): string {
    switch (card.kind) {
        case "number":
            return `Number ${card.value}`;
        case "action":
            return `Action: ${card.action}`;
        case "modifier":
            if (card.multiplier === 2) return "Score x2";
            return `Bonus +${card.bonus}`;
    }
}