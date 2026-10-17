import { ScrollView, useWindowDimensions, View } from "react-native";
import { cardHelpFor } from "../../game/cardHelp";
import { Card } from "../../game/types";
import { useUi } from "../AppContext";
import { CardFace } from "../cards/CardFace";
import { Button } from "../ui/Button";
import { Sheet } from "../ui/Sheet";
import { T } from "../ui/T";

type Props = { card: Card; onClose: () => void };

// What you see when you press and hold any card: the card big, its name, and what it does.
// The words scroll if the Text size setting makes them too tall for the screen; the button stays put.
export function CardHelpSheet({ card, onClose }: Props) {
  const { colors, highContrast } = useUi();
  const { height } = useWindowDimensions();
  const text = cardHelpFor(card);

  return (
    <Sheet title={text.title} onClose={onClose}>
      <ScrollView
        style={{ maxHeight: Math.round(height * 0.55) }}
        contentContainerStyle={{ alignItems: "center", gap: 14, paddingBottom: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {/* A tiny tilt and a soft shadow, so it looks like a card held up to the light. The rounded corners match the card's. */}
        <View style={{ borderRadius: 18, transform: [{ rotate: "-3deg" }], boxShadow: [{ offsetX: 0, offsetY: 10, blurRadius: 18, color: "rgba(0,0,0,0.4)" }] }}>
          <CardFace card={card} width={120} highContrast={highContrast} />
        </View>
        <T size={15} weight={700} lh={1.4} color={colors.textDim} align="center">{text.long}</T>
      </ScrollView>
      <Button label="GOT IT" variant="gold" size="md" onPress={onClose} />
    </Sheet>
  );
}
