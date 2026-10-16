import { StyleSheet } from "react-native";
import { CARD_H, CARD_W } from "../game/handLayout";
import { FILL } from "./fill";
import { theme } from "./theme";

export const styles = StyleSheet.create({
  // Covers the player's card; touches pass through to whatever is underneath.
  overlay: { ...FILL, alignItems: "center", justifyContent: "center" },

  panel: {
    backgroundColor: theme.surfaceRaised,
    borderWidth: 2,
    borderColor: theme.gold,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000000",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  row: { flexDirection: "row", gap: 16, alignItems: "center" },
  cardBox: { width: CARD_W, height: CARD_H },

  // A gold ring that grows out of the Shield when the duplicate hits it.
  ring: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: theme.gold,
  },

  // A red cross stamped over the blocked duplicate.
  cross: { ...FILL, alignItems: "center", justifyContent: "center" },
  crossBar: {
    position: "absolute",
    width: 54,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.danger,
  },
  dim: { ...FILL, borderRadius: 8, backgroundColor: "#000000" },

  label: { fontSize: 14, fontWeight: "900", letterSpacing: 3, color: theme.gold },
});
