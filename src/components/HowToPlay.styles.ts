import { StyleSheet } from "react-native";
import { theme } from "./theme";

export const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.bg },
  scroll: { flex: 1 },
  container: { padding: 16, paddingTop: 56, paddingBottom: 24, gap: 14 },

  title: { fontSize: 28, fontWeight: "900", color: theme.text },
  intro: { fontSize: 16, lineHeight: 23, color: theme.textDim },

  section: {
    backgroundColor: theme.surface,
    borderWidth: 2,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  heading: { fontSize: 13, fontWeight: "900", letterSpacing: 3, color: theme.gold },
  body: { fontSize: 15, lineHeight: 22, color: theme.text },
  bold: { fontWeight: "800" },
  dim: { fontSize: 14, lineHeight: 20, color: theme.textDim },

  // A card (or a few) with its explanation beside it.
  cardRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  cards: { flexDirection: "row", gap: 8 },
  cardText: { flex: 1, gap: 2 },
  cardName: { fontSize: 16, fontWeight: "800", color: theme.text },

  sum: {
    backgroundColor: theme.surfaceRaised,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  sumLine: { fontSize: 15, color: theme.text },
  sumTotal: { fontSize: 17, fontWeight: "900", color: theme.gold },

  buttons: {
    padding: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.surface,
  },
});
