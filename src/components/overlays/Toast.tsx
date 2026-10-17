import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { paced } from "../../game/pace";
import { Palette } from "../theme";
import { useStyles, useUi } from "../AppContext";
import { Icon, IconName } from "../ui/Icon";
import { T } from "../ui/T";
import { Tap } from "../ui/Tap";
import { makeStyles } from "./Toast.styles";

export type ToastTone = "gold" | "blue" | "danger" | "good";

// What a toast says. `id` changes for every new toast. Put a line break in `text` to get a headline and
// a smaller second line ("Robo took the lead" / "195 points against Fizz on 188"). `icon` is optional:
// without it the picture follows the tone.
export type ToastData = { id: number; text: string; tone: ToastTone; icon?: IconName | "alert" };

type Props = {
  toast: ToastData | null;   // a new toast slides in; null fades the current one away
  top: number;               // how far from the top of the screen it sits (just below the round pill)
  onClose?: () => void;      // the toast was tapped: the table takes it away
  inert?: boolean;           // let every touch through to the table (while you pick a player, the message must not cover the players)
};

type Look = { fill: string; edge: string; ink: string; soft: string; disc: string; headline: "display" | 900 };

// The colours of each tone, all from the palette. Gold and good are solid (a lead change is good news);
// blue and danger are dark panels with a coloured edge (information and warnings).
function lookFor(tone: ToastTone, c: Palette): Look {
  switch (tone) {
    case "gold": return { fill: c.gold, edge: c.gold, ink: c.onGold, soft: c.onGold, disc: c.onGold, headline: "display" };
    case "good": return { fill: c.good, edge: c.good, ink: c.bg, soft: c.bg, disc: c.bg, headline: "display" };
    case "danger": return { fill: c.dangerBg, edge: c.danger, ink: c.text, soft: c.textDim, disc: c.danger, headline: 900 };
    case "blue": return { fill: c.surface, edge: c.blue, ink: c.text, soft: c.textDim, disc: c.blue, headline: 900 };
  }
}

const DEFAULT_ICON: Record<ToastTone, IconName | "alert"> = { gold: "crown", good: "check", danger: "alert", blue: "info" };

type PillProps = { data: ToastData; visible: boolean; onClose?: () => void; inert?: boolean };

// The toast itself. The table gives every new toast a new `id`, and each id gets its own fresh pill (see Toast below),
// so a new message always starts from the top and drops in. When `visible` turns false the pill fades away.
// A tap on it closes it (the message is already read, or does not matter).
function ToastPill({ data, visible, onClose, inert }: PillProps) {
  const { colors, reduceMotion, speed } = useUi();
  const styles = useStyles(makeStyles);
  const shown = useSharedValue(0);                       // 0 = invisible, 1 = fully visible
  const drop = useSharedValue(reduceMotion ? 0 : -14);   // how far above its resting place it is

  useEffect(() => {
    if (visible) {
      shown.value = withTiming(1, { duration: paced(reduceMotion ? 120 : 160, speed) });
      if (!reduceMotion) drop.value = withTiming(0, { duration: paced(260, speed), easing: Easing.out(Easing.cubic) });
    } else {
      shown.value = withTiming(0, { duration: paced(200, speed) });
    }
  }, [visible]);

  const move = useAnimatedStyle(() => ({ opacity: shown.value, transform: [{ translateY: drop.value }] }));

  const look = lookFor(data.tone, colors);
  const [headline, ...rest] = data.text.split("\n");
  const second = rest.join(" ").trim();
  const icon = data.icon ?? DEFAULT_ICON[data.tone];

  return (
    <Tap onPress={visible ? onClose : undefined} disabled={!visible || inert} label="Close message" haptic={null}>
      <Animated.View style={[styles.pill, { backgroundColor: look.fill, borderColor: look.edge }, move]}>
        {icon === "crown" ? (
          <Icon name="crown" size={26} color={look.disc} />
        ) : (
          <View style={[styles.disc, { backgroundColor: look.disc }]}>
            {icon === "alert" ? (
              <T fixed size={20} weight="display" lh={1} color={colors.bg}>!</T>
            ) : (
              <Icon name={icon} size={18} color={data.tone === "good" ? colors.good : colors.bg} stroke={3} />
            )}
          </View>
        )}
        <View style={styles.words}>
          {look.headline === "display" ? (
            <T size={18} weight="display" spacing={0.5} lh={1.05} color={look.ink} numberOfLines={2}>{headline}</T>
          ) : (
            <T size={14} weight={900} lh={1.15} color={look.ink} numberOfLines={2}>{headline}</T>
          )}
          {second ? <T size={12} weight={800} lh={1.2} color={look.soft} numberOfLines={2}>{second}</T> : null}
        </View>
      </Animated.View>
    </Tap>
  );
}

// A short message at the top of the table: someone took the lead, the draw pile is running low, a card was
// played on somebody. It slides down, stays until the table sends null (or it is tapped), then fades away.
// The strip around it stays on screen the whole time and carries the words for screen readers, so Android's
// TalkBack reads each new toast out (it is a polite live region). Only the message itself takes a touch: the
// strip around it lets taps through to the table.
export function Toast({ toast, top, onClose, inert = false }: Props) {
  const styles = useStyles(makeStyles);

  // While a toast fades away `toast` is already null, so the last one is remembered to keep its words on screen.
  const [last, setLast] = useState<ToastData | null>(toast);
  useEffect(() => {
    if (toast) setLast(toast);
  }, [toast]);
  const current = toast ?? last;

  return (
    <View
      // Only a toast that is showing takes a touch. The pill of the last one stays mounted while it is faded
      // away, and must not stand in the way of a swipe over the first row of tiles.
      pointerEvents={inert || !toast ? "none" : "box-none"}
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={toast ? toast.text.replace(/\n/g, ". ") : ""}
      importantForAccessibility={toast ? "yes" : "no"}
      style={[styles.strip, { top }]}
    >
      {current ? (
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <ToastPill key={current.id} data={current} visible={toast !== null} onClose={onClose} inert={inert} />
        </View>
      ) : null}
    </View>
  );
}
