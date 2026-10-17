import { StyleSheet } from "react-native";
import { Ui } from "../AppContext";
import { FILL } from "../fill";

// The width of the SCORE column. It grows with the Text size setting: the small heading "SCORE" is 46 px wide
// at Normal size, 53 at Large and 61 at Largest, and a score such as 200 is 50 px wide in the big numbers at Largest.
export const scoreColumn = (scale: number): number => Math.ceil(48 * scale);

export const makeStyles = (ui: Ui) =>
  StyleSheet.create({
    screen: { ...FILL },
    // A little darker than the normal backdrop, so the board stands out.
    veil: { ...FILL, backgroundColor: "rgba(10,14,28,0.55)" },
    // The whole board is one big tap target: tapping anywhere moves on.
    tap: { ...FILL, paddingHorizontal: 16 },
    titleBlock: { alignItems: "center", gap: 8 },
    listArea: { flex: 1, marginTop: 22 },
    // The little column headings above the list. They line up with the rows, which have a border and the same padding.
    labels: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12 + ui.colors.borderWidth, paddingBottom: 8 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: 12,
      borderWidth: ui.colors.borderWidth,
      paddingHorizontal: 12,
    },
    nameBox: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 7 },
    youTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: ui.colors.gold },
    scoreBox: { width: scoreColumn(ui.scale) },
  });
