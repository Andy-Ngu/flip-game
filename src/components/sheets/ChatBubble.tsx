import { View } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
import { describeMessage, MessageKind, phraseText } from "../../game/chat";
import { useUi } from "../AppContext";
import { T } from "../ui/T";
import { EmoteFace } from "./EmoteFace";

type Props = {
  message: { id: number; kind: MessageKind; ref: string };
  mine?: boolean;   // your own message: a gold bubble, a little bigger, instead of the cream one other players get
};

const SHADOW = [{ offsetX: 0, offsetY: 6, blurRadius: 14, color: "rgba(0,0,0,0.45)" }];

// A message on the table: a speech bubble with a phrase in it, or a round sticker for an emote. It is
// as big as what it holds and has a small tail on its left side that points at the sender's avatar, so
// the player's tile puts it just to the right of the avatar. The table removes it after three seconds
// (BUBBLE_MS in game/chat.ts); it fades out when it goes. It never takes a touch.
export function ChatBubble({ message, mine = false }: Props) {
  const { colors, reduceMotion } = useUi();
  const label = describeMessage(message) ?? "Message";
  const entering = reduceMotion ? FadeIn.duration(120) : ZoomIn.springify().damping(12);
  const exiting = FadeOut.duration(160);

  if (message.kind === "emote") {
    return (
      <Animated.View
        key={message.id}
        entering={entering}
        exiting={exiting}
        pointerEvents="none"
        accessible
        accessibilityLabel={label}
        accessibilityLiveRegion="polite"
        style={{ alignSelf: "flex-start", width: 52, height: 52 }}
      >
        {/* The sticker is turned a little, like it was slapped on. (The turn is on an inner view, because the
            pop-in animation above owns the outer view's transform.) */}
        <View style={{ width: 52, height: 52, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-8deg" }] }}>
          {/* A faint ring around the sticker, like a ripple where it popped out of the avatar. */}
          <View style={{ position: "absolute", left: 0, top: 0, width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: colors.gold, opacity: 0.5 }} />
          <View style={{ width: 46, height: 46, borderRadius: 23, boxShadow: SHADOW }}>
            <EmoteFace id={message.ref} size={46} />
          </View>
        </View>
      </Animated.View>
    );
  }

  const text = phraseText(message.ref) ?? "";
  const paper = mine ? colors.gold : colors.text;
  const ink = mine ? colors.onGold : colors.bg;
  return (
    <Animated.View
      key={message.id}
      entering={entering}
      exiting={exiting}
      pointerEvents="none"
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      style={{
        alignSelf: "flex-start",
        maxWidth: 190,
        minHeight: mine ? 40 : 34,
        justifyContent: "center",
        paddingHorizontal: mine ? 14 : 12,
        paddingVertical: 5,
        borderRadius: mine ? 14 : 12,
        backgroundColor: paper,
        boxShadow: SHADOW,
      }}
    >
      {/* The tail: a small square turned into a diamond, half hidden behind the bubble, pointing left. */}
      <View
        style={{
          position: "absolute",
          left: -5,
          top: "50%",
          marginTop: -5.5,
          width: 11,
          height: 11,
          borderRadius: 2,
          backgroundColor: paper,
          transform: [{ rotate: "45deg" }],
        }}
      />
      <T size={mine ? 16 : 14} weight={900} lh={1.1} color={ink} numberOfLines={2}>{text}</T>
    </Animated.View>
  );
}
