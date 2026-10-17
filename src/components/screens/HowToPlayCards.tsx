import { View } from "react-native";
import { useUi } from "../AppContext";
import { CardFace, cardHeight } from "../cards/CardFace";
import { T } from "../ui/T";
import { PICTURE_H, PICTURE_W, PictureCard } from "./HowToPlayPages";

// The little picture beside each step: a few real cards, tilted a little as they are in a hand.
// The step's words say everything the picture shows, so screen readers skip the picture.
export function HowToPlayPicture({ cards }: { cards: PictureCard[] }) {
  const { colors, highContrast } = useUi();

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: PICTURE_W, height: PICTURE_H }}>
      {cards.map((c, i) => {
        const radius = 10 * (c.width / 68); // the same corner as the card itself
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              left: c.left,
              top: c.top,
              width: c.width,
              height: cardHeight(c.width),
              borderRadius: radius,
              transform: [{ rotate: `${c.tilt}deg` }],
              boxShadow: [{ offsetX: 0, offsetY: 5, blurRadius: 10, color: "rgba(0,0,0,0.4)" }],
            }}
          >
            <CardFace card={c.card} width={c.width} highContrast={highContrast} />
            {c.again ? (
              <>
                {/* A red ring round the card that caused the bust, like in a real game. */}
                <View
                  pointerEvents="none"
                  style={{ position: "absolute", left: -3, top: -3, right: -3, bottom: -3, borderRadius: radius + 3, borderWidth: 3, borderColor: colors.danger }}
                />
                {/* ...and a label, so it is not only the colour that says so. */}
                <View pointerEvents="none" style={{ position: "absolute", left: -8, right: -8, bottom: -10, alignItems: "center" }}>
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: colors.danger }}>
                    <T fixed size={10} weight={900} color={colors.bg} numberOfLines={1}>{c.again}</T>
                  </View>
                </View>
              </>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
