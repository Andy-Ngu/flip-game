// Small helpers for the words on screen, so every place says things the same way.

// "1 point", "0 points", "15 points".
export const pointsText = (n: number): string => `${n} ${n === 1 ? "point" : "points"}`;
