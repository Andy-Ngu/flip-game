import { useEffect, useRef } from "react";
import { AccessibilityInfo, Platform, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { exampleCard, HELP, HelpKey, HOLD_HINT } from "../../game/cardHelp";
import { faceFor } from "../../game/cardFace";
import { paced } from "../../game/pace";
import { Card } from "../../game/types";
import { useUi } from "../AppContext";
import { CardBack } from "../cards/CardBack";
import { CardFace } from "../cards/CardFace";
import { Palette } from "../theme";
import { T } from "../ui/T";
import { Tap } from "../ui/Tap";

// How far above the bottom of the screen (on top of the phone's own navigation bar) the pop-up sits.
// It is meant to float just above the HIT and STAY buttons. Change this one number to move it.
export const TOAST_ABOVE_DOCK = 150;

// The pop-up goes away by itself after this long (before the Game speed setting is applied).
const AUTO_HIDE_MS = 4500;

// The colour of the pop-up's frame and name. Most come from the app's palette; the Draw Three card is
// purple, which the palette has no word for, so it borrows the pale purple of the card itself.
function tintFor(key: HelpKey, colors: Palette, highContrast: boolean): string {
  switch (key) {
    case "shield": return colors.good;
    case "timeOut": return colors.blue;
    case "doubleScore": return colors.warn;
    case "bonus":
    case "sevenStack": return colors.gold;
    case "drawThree": {
      const card = exampleCard("drawThree");
      return card ? faceFor(card, highContrast).bg : colors.text;
    }
  }
}

type Props = {
  help: HelpKey;
  onDismiss: () => void;   // "Got it", or the pop-up timing out
  card?: Card;             // the real card that caused the pop-up, if the screen has it; otherwise an example of the same kind
  bottom?: number;         // distance from the bottom of the screen, to put it somewhere else than above the dock
};

// A banner that appears the first time each special card turns up, saying in a sentence what it does.
// It floats over the table without blocking it: only the "Got it" button takes touches.
export function CardHelpToast({ help, onDismiss, card, bottom }: Props) {
  const { colors, highContrast, reduceMotion, speed, scale } = useUi();
  const insets = useSafeAreaInsets();
  // With big text the words need the whole width, so the button moves under them and the extra hint is left
  // out of what is drawn (screen readers still hear it).
  const stacked = scale > 1.1;
  const text = HELP[help];
  const tint = tintFor(help, colors, highContrast);
  const shown = card ?? exampleCard(help);
  const spoken = `${text.title}. ${text.line} ${HOLD_HINT}`;

  // Always call the newest onDismiss, without the timer starting over every time the screen redraws.
  const latest = useRef(onDismiss);
  latest.current = onDismiss;

  useEffect(() => {
    const timer = setTimeout(() => latest.current(), paced(AUTO_HIDE_MS, speed));
    return () => clearTimeout(timer);
  }, [help, speed]);

  // Android reads out a live region by itself; iPhones need to be told.
  useEffect(() => {
    if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibility(spoken);
  }, [help]);

  const gotIt = (
    <Tap onPress={onDismiss} label="Got it">
      {(pressed) => (
        <View
          style={{
            minHeight: 48,
            minWidth: 64,
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: colors.gold,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.85 : 1,
          }}
        >
          <T size={15} weight="display" spacing={1} lh={1} color={colors.onGold} align="center">GOT IT</T>
        </View>
      )}
    </Tap>
  );

  return (
    <Animated.View
      key={help}
      entering={reduceMotion ? undefined : FadeInDown.duration(200)}
      exiting={reduceMotion ? undefined : FadeOutDown.duration(160)}
      pointerEvents="box-none"
      style={{ position: "absolute", left: 16, right: 16, bottom: bottom ?? insets.bottom + TOAST_ABOVE_DOCK }}
    >
      <View
        style={{
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 18,
          borderWidth: 2.5,
          borderColor: tint,
          backgroundColor: colors.surface,
          boxShadow: [{ offsetX: 0, offsetY: 10, blurRadius: 22, color: "rgba(0,0,0,0.45)" }],
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          {/* A small tilted copy of the card. The words next to it already say everything, so screen readers skip it. */}
          <View
            style={{ transform: [{ rotate: "-6deg" }] }}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {shown ? <CardFace card={shown} width={44} highContrast={highContrast} /> : <CardBack width={44} />}
          </View>

          <View style={{ flex: 1, minWidth: 0, gap: 5 }} accessible accessibilityLiveRegion="polite" accessibilityLabel={spoken}>
            <T size={20} weight="display" spacing={0.8} lh={1} color={tint} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {text.title}
            </T>
            <T size={12.5} weight={700} lh={1.3} color={colors.textDim}>{stacked ? text.line : `${text.line} ${HOLD_HINT}`}</T>
          </View>

          {stacked ? null : gotIt}
        </View>
        {stacked ? <View style={{ marginTop: 8 }}>{gotIt}</View> : null}
      </View>
    </Animated.View>
  );
}
