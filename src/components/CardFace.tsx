import { Text, View } from "react-native";
import { faceFor } from "../game/cardFace";
import { Card } from "../game/types";
import { styles } from "./CardFace.styles";

// Card text ignores the phone's font-size setting (allowFontScaling={false}), because a card is
// artwork with a fixed size: scaled-up text would wrap and push out of place.
// Time Out and Shield are drawn with simple shapes, so they look the same on every phone.
// The front of a card: corner marks on number cards, a big center mark, and a caption on action and bonus cards.
export function CardFace({ card }: { card: Card }) {
  const f = faceFor(card);
  return (
    <View style={[styles.card, { backgroundColor: f.bg, borderColor: f.accent }]}>
      <View style={[styles.inner, { borderColor: f.accent + "55" }]} />
      {f.corner !== null && (
        <>
          <Text allowFontScaling={false} numberOfLines={1} style={[styles.cornerTop, f.underline && styles.underline, { color: f.accent }]}>{f.corner}</Text>
          <Text allowFontScaling={false} numberOfLines={1} style={[styles.cornerBottom, f.underline && styles.underline, { color: f.accent }]}>{f.corner}</Text>
        </>
      )}
      {/* The big mark is always dead center. The caption sits below it, in its own space. */}
      <View style={styles.middle}>
        {f.icon === "pause" && (
          <View style={styles.pause}>
            <View style={[styles.pauseBar, { backgroundColor: f.accent }]} />
            <View style={[styles.pauseBar, { backgroundColor: f.accent }]} />
          </View>
        )}
        {f.icon === "shield" && (
          <View style={[styles.shield, { borderColor: f.accent }]}>
            <View style={[styles.shieldCore, { backgroundColor: f.accent }]} />
          </View>
        )}
        {f.icon === null && (
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={[styles.center, f.center.length > 2 && styles.centerSmall, f.underline && styles.underline, { color: f.accent }]}
          >
            {f.center}
          </Text>
        )}
      </View>
      {f.title !== null && (
        <Text allowFontScaling={false} numberOfLines={1} style={[styles.title, { color: f.accent }]}>
          {f.title}
        </Text>
      )}
    </View>
  );
}

// The back of a card.
export function CardBack() {
  return (
    <View style={[styles.card, styles.back]}>
      <View style={[styles.inner, styles.backInner]} />
      <View style={styles.middle}>
        <Text allowFontScaling={false} style={styles.backMark}>◆</Text>
      </View>
    </View>
  );
}
