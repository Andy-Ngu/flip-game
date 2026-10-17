import { useMemo, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import { CHARACTERS, COLORS, NOUNS, Profile, withCharacter, withColor } from "../../game/profile";
import { useUi } from "../AppContext";
import { Avatar } from "../avatars/Avatar";
import { Icon } from "../ui/Icon";
import { Tap } from "../ui/Tap";
import { T } from "../ui/T";

const COLUMNS = 4;
const GAP = 8;
const CHARACTER_H = 72;   // a character button
const COLOUR_H = 48;      // a colour button: the dot is smaller (38) but the touch area is 48 high

// What a screen reader says for each colour. The same order as COLORS in game/profile.ts.
const COLOUR_NAMES: Record<string, string> = {
  "#5BB4F0": "Sky blue",
  "#7A90E0": "Periwinkle",
  "#E07A90": "Pink",
  "#A97AE0": "Violet",
  "#5FD39A": "Green",
  "#E0A85F": "Amber",
  "#E0795F": "Coral",
  "#F2C14E": "Gold",
};

type Props = {
  profile: Profile;
  onChange: (next: Profile) => void;
};

// Pick one of the 12 characters and one of the 8 colours. The chosen one has a thick gold outline AND
// a tick, so it is clear without telling colours apart. The characters are drawn on the colour you have
// picked, so you see the result before you choose.
export function ProfilePicker({ profile, onChange }: Props) {
  const { colors } = useUi();
  const [gridWidth, setGridWidth] = useState(0);
  // Four buttons in a row, sharing the width. Not drawn until the width is known.
  const cell = gridWidth > 0 ? Math.floor((gridWidth - GAP * (COLUMNS - 1)) / COLUMNS) : 0;
  // One look per character, made again only when the colour changes, so picking a character does not
  // redraw all twelve drawings.
  const looks = useMemo(() => CHARACTERS.map((character) => ({ character, color: profile.color })), [profile.color]);

  return (
    <View style={{ gap: 18 }} onLayout={(e: LayoutChangeEvent) => setGridWidth(e.nativeEvent.layout.width)}>
      <View style={{ gap: 8 }}>
        <T size={11} weight={900} spacing={1.2} lh={1} color={colors.textFaint}>CHARACTER</T>
        <View accessibilityRole="radiogroup" accessibilityLabel="Character" style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP }}>
          {cell > 0
            ? CHARACTERS.map((c, n) => {
                const on = c === profile.character;
                return (
                  <Tap
                    key={c}
                    role="radio"
                    selected={on}
                    checked={on}
                    label={NOUNS[c]}
                    onPress={() => onChange(withCharacter(profile, c))}
                    style={{ width: cell, height: CHARACTER_H }}
                  >
                    <View
                      style={{
                        flex: 1,
                        borderRadius: 14,
                        borderWidth: on ? 3 : colors.borderWidth,
                        borderColor: on ? colors.gold : colors.border,
                        backgroundColor: on ? colors.surfaceRaised : colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Avatar look={looks[n]} size={52} />
                      {on ? (
                        <View
                          style={{
                            position: "absolute",
                            top: 3,
                            right: 3,
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: colors.gold,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon name="check" size={13} color={colors.onGold} stroke={3.4} />
                        </View>
                      ) : null}
                    </View>
                  </Tap>
                );
              })
            : null}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <T size={11} weight={900} spacing={1.2} lh={1} color={colors.textFaint}>COLOUR</T>
        {/* Two rows of four, lined up with the characters above, so every button is at least 48 high. */}
        <View accessibilityRole="radiogroup" accessibilityLabel="Colour" style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP }}>
          {cell > 0
            ? COLORS.map((color, i) => {
                const on = color === profile.color;
                return (
                  <Tap
                    key={color}
                    role="radio"
                    selected={on}
                    checked={on}
                    label={COLOUR_NAMES[color] ?? `Colour ${i + 1}`}
                    onPress={() => onChange(withColor(profile, color))}
                    style={{ width: cell, height: COLOUR_H, alignItems: "center", justifyContent: "center" }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: color,
                        borderWidth: 3,
                        borderColor: on ? colors.text : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: on ? [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 2, color: colors.bg }] : undefined,
                      }}
                    >
                      {on ? <Icon name="check" size={18} color={colors.onGold} stroke={3.4} /> : null}
                    </View>
                  </Tap>
                );
              })
            : null}
        </View>
      </View>
    </View>
  );
}
