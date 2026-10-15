import { StyleSheet } from "react-native";
import { FILL } from "./fill";

// Every color is set explicitly so the card looks the same in light and dark mode.
const INK = "#111111";
const MUTED = "#555555";
const BLUE = "#2E6FD8";

// Colors of the flash that plays over a player when something happens to them.
export const BUST_RED = "#C0262D";
export const TIMEOUT_BLUE = "#3B8FE0";

export const styles = StyleSheet.create({
  player: {
    borderWidth: 2,
    borderColor: "#D0D0D0",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  acting: { borderColor: BLUE, backgroundColor: "#EAF1FD" },
  out: { opacity: 0.6 },
  flash: { ...FILL, borderRadius: 10 },

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

  statusRow: { flexDirection: "row", alignItems: "center" },
  status: { fontSize: 14, color: "#444444" },
  roundScore: { fontSize: 16, fontWeight: "800", color: INK },
  bust: { color: BUST_RED, fontWeight: "700" },
});
