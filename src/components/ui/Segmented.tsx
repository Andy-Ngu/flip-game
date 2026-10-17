import { View } from "react-native";
import { useUi } from "../AppContext";
import { T } from "./T";
import { Tap } from "./Tap";

export type Choice<V> = {
  value: V;
  label: string;      // what is drawn in the cell
  caption?: string;   // a small line under it
  spoken?: string;    // what a screen reader says, if the label alone would not be clear ("6" is "6 seats")
};

type Props<V> = {
  choices: Choice<V>[];
  value: V;
  onChange: (value: V) => void;
  label: string;        // what the group is for, for screen readers
  hint?: string;        // a sentence only a screen reader says, after the label ("You and 3 computer players.")
  height?: number;
  onScreen?: boolean;   // the cells sit straight on the screen, not inside a panel, so they are the panel colour
  numerals?: boolean;   // draw the labels in the big title font (seat counts and scores)
};

// A row of choices where exactly one is picked: seat count, bot skill, turn clock, text size and so on.
export function Segmented<V extends string | number>({ choices, value, onChange, label, hint, height = 48, onScreen, numerals }: Props<V>) {
  const { colors } = useUi();
  return (
    <View style={{ flexDirection: "row", gap: choices.length > 3 ? 6 : 8 }} accessibilityRole="radiogroup" accessibilityLabel={label} accessibilityHint={hint}>
      {choices.map((c) => {
        const on = c.value === value;
        const ink = on ? colors.onGold : colors.text;
        return (
          <View key={String(c.value)} style={{ flex: 1 }}>
            <Tap role="radio" selected={on} checked={on} label={c.spoken ?? (c.caption ? `${c.label}, ${c.caption}` : c.label)} onPress={() => onChange(c.value)}>
              <View
                style={{
                  minHeight: height,
                  borderRadius: 12,
                  borderWidth: colors.borderWidth,
                  borderColor: on ? colors.gold : colors.border,
                  backgroundColor: on ? colors.gold : onScreen ? colors.surface : colors.bg,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 4,
                  paddingVertical: 4,
                }}
              >
                {numerals ? (
                  <T size={22} weight="display" lh={1.1} color={ink}>{c.label}</T>
                ) : (
                  <T size={c.caption ? 14 : 15} weight={900} lh={1.1} align="center" color={ink}>{c.label}</T>
                )}
                {c.caption ? <T size={11} weight={800} align="center" color={on ? colors.onGold : colors.textFaint}>{c.caption}</T> : null}
              </View>
            </Tap>
          </View>
        );
      })}
    </View>
  );
}
