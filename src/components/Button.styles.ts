import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  button: {
    minWidth: 100,
    backgroundColor: "#2E6FD8",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    alignSelf: "stretch",
  },
  // Use inside a row so several buttons share the width.
  fill: { flex: 1 },
  disabled: { backgroundColor: "#A8B8D8" },
  text: { color: "white", fontSize: 16, fontWeight: "600" },
});
