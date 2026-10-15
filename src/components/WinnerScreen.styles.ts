import { StyleSheet } from "react-native";
import { theme } from "./theme";

export const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.bg },

  glowOuter: { position: "absolute", top: 40, alignSelf: "center", width: 420, height: 420, borderRadius: 210, backgroundColor: "#7A90E0", opacity: 0.07 },
  glowInner: { position: "absolute", top: 110, alignSelf: "center", width: 280, height: 280, borderRadius: 140, backgroundColor: "#7A90E0", opacity: 0.1 },

  scroll: { flex: 1 },
  container: { padding: 16, paddingTop: 80, paddingBottom: 24, gap: 10, alignItems: "center" },

  kicker: { fontSize: 16, fontWeight: "900", letterSpacing: 8, color: theme.gold },
  name: { fontSize: 44, lineHeight: 52, fontWeight: "900", color: theme.text, textAlign: "center" },
  points: { fontSize: 18, color: theme.textDim, marginBottom: 16 },
  pointsValue: { color: theme.gold, fontWeight: "900" },

  board: { alignSelf: "stretch", gap: 8, marginTop: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.surface,
    borderWidth: 2,
    borderColor: theme.border,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  rowWinner: { borderColor: theme.gold, backgroundColor: theme.surfaceRaised },
  rank: { width: 28, fontSize: 16, fontWeight: "900", color: theme.textDim, textAlign: "center" },
  rankWinner: { color: theme.gold },
  rowName: { flex: 1, fontSize: 17, fontWeight: "800", color: theme.text },
  rowTotal: { fontSize: 20, fontWeight: "900", color: theme.text },
  rowTotalWinner: { color: theme.gold },

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
