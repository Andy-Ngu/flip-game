import { StyleSheet } from "react-native";
import { Ui } from "../AppContext";
import { FILL } from "../fill";
import { hexAlpha } from "../overlays/glow";

export const TILE_RADIUS = 14;

export const makeStyles = (ui: Ui) =>
  StyleSheet.create({
    tile: {
      borderRadius: TILE_RADIUS,
      borderWidth: ui.colors.borderWidth,
      borderColor: ui.colors.border,
      backgroundColor: ui.colors.surface,
      paddingHorizontal: 6,
      paddingVertical: 4,
    },
    header: { flexDirection: "row", alignItems: "center", gap: 7 },
    names: { flex: 1, minWidth: 0, gap: 2 },
    scores: { alignItems: "flex-end", gap: 1 },
    cards: { marginTop: 3 },
    crown: { position: "absolute", left: -3, top: -7 },
    // The play order badge takes the top left corner, so while it shows the crown moves to the right.
    crownRight: { position: "absolute", right: -3, top: -7 },
    // These sit on the edge of the tile, a little outside it (the numbers are measured from the tile's outer edge).
    badge: { position: "absolute", left: -5, top: -5 },
    tag: { position: "absolute", right: 10, top: -8 },
    press: { ...FILL, borderRadius: TILE_RADIUS },
    pressed: { backgroundColor: hexAlpha(ui.colors.gold, 0.16) },
  });
