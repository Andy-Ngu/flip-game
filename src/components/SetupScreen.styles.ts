import { StyleSheet } from "react-native";
import { theme } from "./theme";

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  container: { padding: 16, paddingTop: 56, paddingBottom: 40, gap: 12 },
  title: { fontSize: 28, fontWeight: "900", color: theme.text },
  help: { fontSize: 15, lineHeight: 21, color: theme.textDim },

  seat: {
    backgroundColor: theme.surface,
    borderWidth: 2,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  seatHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 17,
    color: theme.text,
    backgroundColor: theme.bg,
  },
  remove: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.dangerBg,
  },
  removeDisabled: { opacity: 0.35 },
  removeText: { fontSize: 18, color: theme.danger, fontWeight: "700" },

  kindRow: { flexDirection: "row", gap: 6 },
  kind: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    backgroundColor: theme.surfaceRaised,
  },
  kindSelected: { backgroundColor: theme.gold, borderColor: theme.gold },
  kindText: { fontSize: 14, fontWeight: "700", color: theme.textDim },
  kindTextSelected: { color: theme.onGold },

  problem: { color: theme.danger, fontSize: 14, fontWeight: "600" },
});
