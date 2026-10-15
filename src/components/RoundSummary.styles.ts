import { StyleSheet } from "react-native";
import { theme } from "./theme";

export const BACKDROP = "rgba(27, 36, 64, 0.97)";

export const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: BACKDROP },
  scroll: { flex: 1 },
  container: { padding: 16, paddingTop: 64, paddingBottom: 24, gap: 14 },

  kicker: { fontSize: 14, fontWeight: "900", letterSpacing: 5, color: theme.gold, textAlign: "center" },
  headline: { fontSize: 26, fontWeight: "900", color: theme.text, textAlign: "center" },
  message: { fontSize: 15, lineHeight: 21, color: theme.textDim, textAlign: "center" },

  board: { gap: 8, marginTop: 6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.surface,
    borderWidth: 2,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 12,
  },
  rowLeader: { borderColor: theme.gold, backgroundColor: theme.surfaceRaised },
  rank: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.surfaceRaised,
  },
  rankLeader: { backgroundColor: theme.gold },
  rankText: { fontSize: 16, fontWeight: "900", color: theme.text },
  rankTextLeader: { color: theme.onGold },

  who: { flex: 1, gap: 2 },
  name: { fontSize: 17, fontWeight: "800", color: theme.text },
  detail: { fontSize: 13, color: theme.textDim },
  detailBust: { color: theme.danger, fontWeight: "700" },
  detailSeven: { color: theme.gold, fontWeight: "800" },

  numbers: { alignItems: "flex-end", gap: 2 },
  gain: { fontSize: 14, fontWeight: "800", color: theme.textDim },
  gainBust: { color: theme.danger },
  total: { fontSize: 24, fontWeight: "900", color: theme.text },
  totalLeader: { color: theme.gold },

  buttons: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.surface,
  },
});
