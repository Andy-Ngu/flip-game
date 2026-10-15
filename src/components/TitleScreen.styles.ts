import { StyleSheet } from "react-native";

// The same navy and gold as the card backs and the app icon.
export const NAVY = "#1B2440";
export const GOLD = "#F2C14E";
const CREAM = "#FBEBD9";

// The logo is a fan of three cards, drawn at 2.2 times the size of a hand card.
export const LOGO_CARD_W = 128;
export const LOGO_CARD_H = 186;
// How far below a card's center the fan opens from (like holding cards in your hand).
export const FAN_PIVOT = 190;

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: NAVY, alignItems: "center", justifyContent: "center", padding: 24 },

  // Two soft discs of light behind the logo.
  glowOuter: { position: "absolute", width: 420, height: 420, borderRadius: 210, backgroundColor: "#7A90E0", opacity: 0.07, transform: [{ translateY: -140 }] },
  glowInner: { position: "absolute", width: 280, height: 280, borderRadius: 140, backgroundColor: "#7A90E0", opacity: 0.1, transform: [{ translateY: -140 }] },

  logo: { width: LOGO_CARD_W * 2.1, height: LOGO_CARD_H + 30, alignItems: "center", justifyContent: "center" },
  logoCard: {
    position: "absolute",
    width: LOGO_CARD_W,
    height: LOGO_CARD_H,
    borderRadius: 18,
    borderWidth: 5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  logoInner: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 11,
    borderWidth: 2,
  },
  logoSeven: {
    width: "100%",
    fontSize: 104,
    lineHeight: 120,
    fontWeight: "900",
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
  },

  titleBlock: { marginTop: 34, alignItems: "center" },
  titleTop: { fontSize: 46, lineHeight: 52, fontWeight: "900", letterSpacing: 9, color: CREAM },
  titleBottom: { fontSize: 46, lineHeight: 52, fontWeight: "900", letterSpacing: 9, color: GOLD },
  tagline: { marginTop: 14, fontSize: 16, color: "#A9B4D6", textAlign: "center" },

  playWrap: { marginTop: 44, alignSelf: "stretch", alignItems: "center" },
  play: {
    minWidth: 220,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 14,
    backgroundColor: GOLD,
    alignItems: "center",
    shadowColor: GOLD,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  playText: { fontSize: 20, fontWeight: "900", letterSpacing: 4, color: NAVY },

  footer: { position: "absolute", bottom: 36, fontSize: 13, color: "#6F7BA3", textAlign: "center" },
});
