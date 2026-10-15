import { StyleSheet } from "react-native";
import { theme } from "./theme";

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  scroll: { flex: 1 },
  container: { padding: 16, paddingTop: 56, paddingBottom: 24, gap: 12 },

  header: { gap: 6 },
  headerLinks: { flexDirection: "row", gap: 20 },
  title: { fontSize: 22, fontWeight: "900", letterSpacing: 2, color: theme.text },
  link: { color: theme.gold, fontSize: 15, fontWeight: "700" },

  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  // Fixed bar at the bottom that always shows what you can do now.
  controls: {
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    padding: 16,
    paddingBottom: 28,
    gap: 8,
  },
  prompt: { fontSize: 18, fontWeight: "700", color: theme.text },
  winner: { fontSize: 26, fontWeight: "900", color: theme.gold },
  botBanner: { padding: 12, borderRadius: 12, backgroundColor: theme.surfaceRaised },
  botBannerText: { fontSize: 16, fontWeight: "700", color: theme.text },
  note: { fontSize: 14, color: theme.textDim },

  // Question panel for Time Out, Draw Three and Shield.
  actionPanel: {
    borderWidth: 2,
    borderColor: theme.gold,
    backgroundColor: theme.surfaceRaised,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  actionLabel: { fontSize: 14, color: theme.textDim },
  actionTitle: { fontSize: 26, fontWeight: "900", color: theme.gold },
  actionRule: { fontSize: 15, lineHeight: 21, color: theme.text },
  actionInstruction: { fontSize: 16, fontWeight: "800", marginTop: 4, color: theme.text },
});
