import { StyleSheet } from "react-native";
import { Card } from "../game/types";

// Every color is set explicitly so the screen looks the same whether the
// phone is in light or dark mode.
const INK = "#111111";
const MUTED = "#555555";
const BLUE = "#2E6FD8";

// Background color for each kind of card.
export const CARD_COLORS: Record<Card["kind"], string> = {
  number: "#F4E9C9",
  action: "#9ED0F5",
  modifier: "#F5B95E",
};

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F7F9" },
  scroll: { flex: 1 },
  container: { padding: 16, paddingTop: 56, paddingBottom: 24, gap: 12 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 28, fontWeight: "700", color: INK },
  link: { color: BLUE, fontSize: 15, fontWeight: "600" },

  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  // One card per player.
  player: {
    borderWidth: 2,
    borderColor: "#D0D0D0",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  currentPlayer: { borderColor: BLUE, backgroundColor: "#EAF1FD" },
  playerOut: { opacity: 0.6 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  name: { fontSize: 18, fontWeight: "600", color: INK, flexShrink: 1 },
  tag: { fontSize: 13, color: MUTED },
  turnBadge: {
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
  bust: { color: "#C0262D", fontWeight: "700" },

  // Fixed bar at the bottom that always shows what you can do now.
  controls: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#DDDDDD",
    padding: 16,
    paddingBottom: 28,
    gap: 8,
  },
  prompt: { fontSize: 18, fontWeight: "600", color: INK },
  botBanner: { padding: 12, borderRadius: 10, backgroundColor: "#F0F0F0" },
  botBannerText: { fontSize: 16, fontWeight: "600", color: INK },
  note: { fontSize: 14, color: MUTED },

  // Question panel for Freeze, Flip Three and Second Chance.
  actionPanel: {
    borderWidth: 2,
    borderColor: BLUE,
    backgroundColor: "#EAF6FF",
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  actionLabel: { fontSize: 14, color: "#444444" },
  actionTitle: { fontSize: 26, fontWeight: "800", color: "#1B4F9C" },
  actionRule: { fontSize: 15, color: "#333333" },
  actionInstruction: { fontSize: 16, fontWeight: "700", marginTop: 4, color: INK },
});
