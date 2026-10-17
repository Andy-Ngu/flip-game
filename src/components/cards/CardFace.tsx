import { View } from "react-native";
import { faceFor } from "../../game/cardFace";
import { describeCard } from "../../game/describe";
import { Card } from "../../game/types";
import { FILL } from "../fill";
import { T } from "../ui/T";
import { ClockGlyph, ShieldGlyph, ThreeGlyph } from "./Glyphs";

// Every card is 68 wide by 98 tall at its normal size. Everything inside is drawn in proportion,
// so a card can be any width: big in the card help, medium in your hand, tiny on a tile.
export const CARD_RATIO = 98 / 68;
export const cardHeight = (width: number): number => Math.round(width * CARD_RATIO);

type Props = { card: Card; width: number; highContrast?: boolean };

// The front of a card. Number cards have their number in the middle and in two corners; action and
// bonus cards have a drawn symbol (or the bonus) in the middle and their name along the bottom.
// Card text ignores the Text size setting (fixed): a card is artwork with a set size.
export function CardFace({ card, width, highContrast = false }: Props) {
  const f = faceFor(card, highContrast);
  const k = width / 68;
  const height = cardHeight(width);
  const big = width >= 100;
  const bonusText = f.icon === null && f.corner === null;
  const longCenter = f.center.length > 2;

  return (
    <View
      accessible
      accessibilityLabel={describeCard(card)}
      style={{
        width,
        height,
        borderRadius: 10 * k,
        borderWidth: (f.thick ? 5 : 2.5) * k,
        borderColor: f.outline,
        backgroundColor: f.bg,
        overflow: "hidden",
      }}
    >
      {f.corner !== null ? (
        <>
          <T fixed size={14 * k} weight="display" color={f.ink} underline={f.underline} style={{ position: "absolute", left: 6 * k, top: 2 * k }}>{f.corner}</T>
          <View style={{ position: "absolute", right: 6 * k, bottom: 2 * k, transform: [{ rotate: "180deg" }] }}>
            <T fixed size={14 * k} weight="display" color={f.ink} underline={f.underline}>{f.corner}</T>
          </View>
        </>
      ) : null}

      {big && f.top !== null ? (
        <T fixed size={11 * (k * 0.68)} weight="display" spacing={2} color={f.ink} align="center" style={{ position: "absolute", left: 0, right: 0, top: 12 * k * 0.68 }}>{f.top}</T>
      ) : null}

      <View style={[FILL, { bottom: f.title !== null ? 20 * k : 0, alignItems: "center", justifyContent: "center" }]}>
        {f.icon === "shield" ? <ShieldGlyph width={27 * k} color={f.ink} /> : null}
        {f.icon === "clock" ? <ClockGlyph size={34 * k} color={f.ink} /> : null}
        {f.icon === "three" ? <ThreeGlyph scale={0.6 * k} color={f.ink} paper={f.bg} /> : null}
        {f.icon === null ? (
          <T
            fixed
            size={(f.corner !== null ? 40 : bonusText && longCenter ? 25 : 31) * k}
            weight="display"
            color={f.ink}
            underline={f.underline}
            numberOfLines={1}
          >
            {f.center}
          </T>
        ) : null}
      </View>

      {f.title !== null ? (
        <T
          fixed
          size={9.5 * k}
          weight="display"
          spacing={0.8 * k}
          color={f.ink}
          align="center"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          style={{ position: "absolute", left: 3 * k, right: 3 * k, bottom: 6 * k }}
        >
          {f.title}
        </T>
      ) : null}
    </View>
  );
}
