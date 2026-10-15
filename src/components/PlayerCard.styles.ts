import { StyleSheet } from "react-native";
import { FILL } from "./fill";
import { theme } from "./theme";

// Colors of the flash that plays over a player when something happens to them.
export const BUST_RED = "#E5484D";
export const TIMEOUT_BLUE = theme.timeOut;

export const styles = StyleSheet.create({
  player: {
    borderWidth: 2,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  // The player whose turn it is gets a gold edge and a soft glow.
  acting: {
    borderColor: theme.gold,
    backgroundColor: theme.surfaceRaised,
    shadowColor: theme.gold,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  out: { opacity: 0.65 },
  flash: { ...FILL, borderRadius: 12 },

  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  name: { fontSize: 18, fontWeight: "800", color: theme.text, flexShrink: 1 },
  tag: { fontSize: 13, color: theme.textDim },
  badge: {
    backgroundColor: theme.gold,
    color: theme.onGold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
  },
  score: { fontSize: 16, color: theme.text },

  statusRow: { flexDirection: "row", alignItems: "center" },
  status: { fontSize: 14, color: theme.textDim },
  roundScore: { fontSize: 16, fontWeight: "900", color: theme.text },
  bust: { color: theme.danger, fontWeight: "800" },
});
