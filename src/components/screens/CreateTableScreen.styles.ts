import { StyleSheet } from "react-native";
import { Ui } from "../AppContext";

export const makeStyles = (_ui: Ui) =>
  StyleSheet.create({
    // The choices scroll (with the biggest text they do not all fit on a small phone);
    // the start button stays where it is, under them.
    scroll: { flex: 1 },
    sections: { gap: 20, paddingTop: 12, paddingBottom: 16 },
    section: { gap: 8 },
    footer: { paddingTop: 8 },
  });
