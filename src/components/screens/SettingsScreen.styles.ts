import { StyleSheet } from "react-native";
import { Ui } from "../AppContext";

export const makeStyles = (ui: Ui) =>
  StyleSheet.create({
    scroll: { flex: 1 },
    content: { paddingTop: 8, paddingBottom: 24, gap: 20 },
    sectionTitle: { marginHorizontal: 4, marginBottom: 8 },
    // The rows share one rounded panel; this keeps their corners inside it.
    panel: { overflow: "hidden" },
    // The thin line between two rows. With High contrast on it is drawn in the border colour so it can be seen.
    divider: { borderTopWidth: 2, borderTopColor: ui.highContrast ? ui.colors.border : ui.colors.bg },
    note: { marginTop: -4, paddingHorizontal: 4 },
  });
