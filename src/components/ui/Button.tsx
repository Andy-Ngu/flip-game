import { View } from "react-native";
import { Feel } from "../../game/events";
import { useStyles, useUi } from "../AppContext";
import { ButtonSize, ButtonVariant, makeStyles, SIZES } from "./Button.styles";
import { Icon, IconName } from "./Icon";
import { T } from "./T";
import { Tap } from "./Tap";

type Props = {
  label: string;
  sub?: string;                // a small line under the label ("Draw a card")
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  onPress?: () => void;
  disabled?: boolean;
  flex?: number;               // a share of the row it sits in
  height?: number;             // the height of the face, instead of the size's usual height
  accessibilityLabel?: string;
  haptic?: Feel | null;
  hitSlop?: number;            // extra room around the button that also counts as a tap (for a button under 48 tall)
};

// The one button of the app. Gold is the main action, blue is STAY, ghost is the quiet kind, danger
// is for leaving. The big ones have a darker lower edge and press down when tapped.
export function Button({ label, sub, variant = "gold", size = "md", icon, onPress, disabled, flex, height, accessibilityLabel, haptic, hitSlop }: Props) {
  const { colors } = useUi();
  const styles = useStyles(makeStyles);
  const s = SIZES[size];

  // Switched off (it is not your turn): grey and low, but still readable.
  const look = disabled
    ? { face: variant === "gold" ? colors.surfaceRaised : colors.surface, border: colors.textFaint, text: colors.textFaint, subText: colors.textFaint, edge: null }
    : {
        gold: { face: colors.gold, border: colors.gold, text: colors.onGold, subText: colors.onGold, edge: colors.goldDark },
        blue: { face: colors.surface, border: colors.blue, text: colors.text, subText: colors.textFaint, edge: colors.blueDark },
        ghost: { face: colors.surface, border: colors.border, text: colors.text, subText: colors.textFaint, edge: null },
        danger: { face: colors.surface, border: colors.danger, text: colors.danger, subText: colors.danger, edge: null },
      }[variant];
  // The space for the lower edge is kept even when the button is switched off, so the row does not jump.
  const edge = variant === "gold" || variant === "blue" ? s.edge : 0;
  const drawEdge = edge > 0 && look.edge !== null;
  const borderWidth = variant === "gold" && !disabled ? 2 : colors.borderWidth;

  return (
    <Tap
      onPress={onPress}
      disabled={disabled}
      label={accessibilityLabel ?? (sub ? `${label}. ${sub}` : label)}
      haptic={haptic}
      hitSlop={hitSlop}
      style={flex !== undefined ? { flex } : undefined}
    >
      {(pressed) => (
        <View style={[styles.wrap, { paddingBottom: edge, opacity: disabled ? 0.4 : 1 }]}>
          {drawEdge && <View style={[styles.base, { top: edge, borderRadius: s.radius, backgroundColor: look.edge ?? undefined }]} />}
          <View
            style={[
              styles.face,
              {
                minHeight: height ?? s.height,
                borderRadius: s.radius,
                borderWidth,
                borderColor: look.border,
                backgroundColor: look.face,
              },
              pressed && !disabled && edge > 0 ? { transform: [{ translateY: edge - 1 }] } : null,
            ]}
          >
            {size === "sm" ? (
              <View style={styles.inline}>
                {icon && <Icon name={icon} size={18} color={look.text} />}
                <T size={13} weight={800} color={look.text} align="center">{label}</T>
              </View>
            ) : (
              <View style={styles.center}>
                <View style={styles.inline}>
                  {icon && <Icon name={icon} size={s.label} color={look.text} />}
                  <T size={s.label} weight="display" spacing={s.spacing} color={look.text} align="center">{label}</T>
                </View>
                {sub ? <T size={s.sub} weight={800} color={look.subText} align="center">{sub}</T> : null}
              </View>
            )}
          </View>
        </View>
      )}
    </Tap>
  );
}
