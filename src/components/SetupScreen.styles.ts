import { StyleSheet } from "react-native";

const INK = "#111111";
const BLUE = "#2E6FD8";

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F7F9" },
  container: { padding: 16, paddingTop: 56, paddingBottom: 40, gap: 12 },
  title: { fontSize: 28, fontWeight: "700", color: INK },
  help: { fontSize: 15, color: "#555555" },

  seat: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#D0D0D0",
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  seatHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#C8C8C8",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 17,
    color: INK,
    backgroundColor: "#FFFFFF",
  },
  remove: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3D6D8",
  },
  removeDisabled: { opacity: 0.35 },
  removeText: { fontSize: 18, color: "#C0262D", fontWeight: "700" },

  kindRow: { flexDirection: "row", gap: 6 },
  kind: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C8C8C8",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  kindSelected: { backgroundColor: BLUE, borderColor: BLUE },
  kindText: { fontSize: 14, fontWeight: "600", color: INK },
  kindTextSelected: { color: "#FFFFFF" },

  problem: { color: "#C0262D", fontSize: 14, fontWeight: "600" },
});
