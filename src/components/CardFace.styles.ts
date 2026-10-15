import { StyleSheet } from "react-native";
import { CARD_H, CARD_W } from "../game/handLayout";

export const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 8,
    borderWidth: 2,
    overflow: "hidden",
    // A soft shadow lifts the card off the table.
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  inner: {
    position: "absolute",
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 5,
    borderWidth: 1,
  },
  cornerTop: { position: "absolute", top: 4, left: 6, fontSize: 13, fontWeight: "800" },
  cornerBottom: {
    position: "absolute",
    bottom: 4,
    right: 6,
    fontSize: 13,
    fontWeight: "800",
    transform: [{ rotate: "180deg" }],
  },
  // A 6 or 9 gets a line under it, like on road signs, so an upside-down card is never misread.
  underline: { textDecorationLine: "underline" },
  middle: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  // The mark fills the card's width and is centered inside it, so it can never wrap or drift.
  // A line height a little taller than the text keeps symbols from different fonts level.
  center: {
    width: "100%",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  // Time Out: the pause symbol, two bars.
  pause: { flexDirection: "row", gap: 7 },
  pauseBar: { width: 8, height: 28, borderRadius: 2 },
  // Shield: an outline with a rounded bottom and a solid core.
  shield: {
    width: 28,
    height: 33,
    borderWidth: 3.5,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  shieldCore: { width: 10, height: 12, borderRadius: 5 },
  centerSmall: { fontSize: 23, lineHeight: 30 }, // for longer marks such as +10
  title: {
    position: "absolute",
    bottom: 9,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  // The back of a card, shown while it flies in and flips over.
  back: { backgroundColor: "#23304F", borderColor: "#F2C14E" },
  backInner: { borderColor: "#F2C14E66" },
  backMark: { fontSize: 26, color: "#F2C14E" },
});
