import { StyleSheet } from "react-native";
import { Ui } from "../AppContext";

export const makeStyles = (ui: Ui) =>
  StyleSheet.create({
    root: { flex: 1 },
    scroll: { flex: 1 },
    content: { paddingTop: 10, paddingBottom: 16, gap: 18 },
    // The character, their name and the lines under it, in the middle.
    who: { alignItems: "center", gap: 8 },
    nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 10, marginTop: 6 },
    guest: {
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: ui.colors.surface,
      borderColor: ui.colors.border,
      borderWidth: ui.colors.borderWidth,
    },
    section: { gap: 8 },
    note: { padding: 14, gap: 6 },
    deleteLink: { minHeight: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
    // The big button at the bottom of the first-time screen stays put while the rest scrolls.
    footer: { paddingTop: 8 },
    dialogButtons: { flexDirection: "row", gap: 10 },
  });
