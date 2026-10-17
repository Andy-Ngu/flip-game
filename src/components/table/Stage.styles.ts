import { StyleSheet } from "react-native";
import { Ui } from "../AppContext";
import { FILL } from "../fill";

// The dark veil over the stage while "How your round scores" is open.
export const SCRIM = "rgba(8,12,28,0.55)";

// The space between the stage's edge and what is inside it, left and right. The "How your round scores" card
// is drawn inside the stage, inset by the same amount.
export const STAGE_PAD_X = 14;

// (The order the parts of the stage are drawn in is STAGE_LAYER, in components/layers.ts.)
export const makeStyles = (ui: Ui) =>
  StyleSheet.create({
    stage: {
      flex: 1,
      borderRadius: 20,
      borderWidth: ui.colors.borderWidth + 0.5,
      borderColor: ui.colors.border,
      backgroundColor: ui.colors.surface,
      paddingHorizontal: STAGE_PAD_X,
      paddingTop: 12,
      paddingBottom: 10,
    },
    // The top row: the avatar on the left, and the two score boxes sharing everything to its right
    // (they grow to fill it, so there is no empty space between the avatar and the scores).
    top: { flexDirection: "row", alignItems: "center", gap: 8 },
    // The words about you (YOUR TURN ...) on a strip of their own, as wide as the stage.
    caption: { marginTop: 3 },
    scores: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "stretch", gap: 6 },
    totalBox: {
      flexGrow: 1,
      paddingHorizontal: 9,
      paddingTop: 5,
      paddingBottom: 4,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: ui.colors.gold,
      backgroundColor: ui.colors.bg,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
    },
    // A chat bubble or emote from you: it starts just right of your avatar and is centred on it.
    bubble: { position: "absolute", left: 50, right: 0, top: 0, bottom: 0, justifyContent: "center", alignItems: "flex-start" },
    scrim: { ...FILL, borderRadius: 18, backgroundColor: SCRIM },
    whoDim: { ...FILL, borderRadius: 12, backgroundColor: SCRIM },
    handArea: { flex: 1, justifyContent: "center", marginHorizontal: -4 },
    rows: { gap: 6, justifyContent: "flex-end" },
    // The BUST stamp has a layer of its own, laid over the hand's area (its top and height are measured). Its inner
    // view pops in (the animation owns the transform) and the next one carries the tilt.
    stampLayer: { position: "absolute", left: 0, right: 0, alignItems: "center", justifyContent: "center" },
    stamp: {
      paddingHorizontal: 22,
      paddingVertical: 2,
      borderRadius: 14,
      borderWidth: 5,
      borderColor: ui.colors.danger,
      backgroundColor: "rgba(27,36,64,0.82)",
      transform: [{ rotate: "-6deg" }],
    },
    cover: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      paddingLeft: 12,
      paddingRight: 6,
      paddingVertical: 4,
      borderRadius: 14,
      borderWidth: ui.colors.borderWidth,
      borderColor: ui.colors.blue,
      backgroundColor: ui.colors.bg,
    },
  });
