import { StyleSheet } from "react-native";
import { Card } from "../game/types";

// Every color is set explicitly so the card looks the same in light and dark mode.
const INK = "#111111";
const MUTED = "#555555";
const BLUE = "#2E6FD8";

// Background color for each kind of card.
export const CARD_COLORS: Record<Card["kind"], string> = {
  number: "#F4E9C9",
  action: "#9ED0F5",
  modifier: "#F5B95E",
};

// Colors of the flash that plays over a card when something happens to a player.
export const BUST_RED = "#C0262D";
export const FREEZE_BLUE = "#3B8FE0";

export const styles = StyleSheet.create({
  player: {
    borderWidth: 2,
    borderColor: "#D0D0D0",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  acting: { borderColor: BLUE, backgroundColor: "#EAF1FD" },
  out: { opacity: 0.6 },
  flash: { ...StyleSheet.absoluteFillObject, borderRadius: 10 },

  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  name: { fontSize: 18, fontWeight: "600", color: INK, flexShrink: 1 },
  tag: { fontSize: 13, color: MUTED },
  badge: {
    backgroundColor: BLUE,
    color: "white",
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
  },
  score: { fontSize: 16, color: INK },

  hand: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  empty: { color: "#666666" },
  card: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  cardText: { fontSize: 14, fontWeight: "500", color: INK },

  status: { fontSize: 14, color: "#444444" },
  bust: { color: BUST_RED, fontWeight: "700" },
});
