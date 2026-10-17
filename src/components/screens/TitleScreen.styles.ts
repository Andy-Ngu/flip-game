import { StyleSheet } from "react-native";
import { Ui } from "../AppContext";

export const makeStyles = (ui: Ui) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: ui.colors.bg },
    scroll: { flex: 1 },
    // Grows to fill the screen, so the logo can sit in the middle and the buttons at the bottom.
    content: { flexGrow: 1 },
    middle: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12 },
    buttons: { paddingHorizontal: 20, gap: 12 },
    row: { flexDirection: "row", gap: 10 },
  });
