import { StyleProp, Text, TextProps, TextStyle } from "react-native";
import { useUi } from "../AppContext";
import { FONT, Weight, WEIGHT_FONT } from "../theme";

export type TProps = Omit<TextProps, "style" | "allowFontScaling" | "maxFontSizeMultiplier"> & {
  size?: number;               // the size as drawn in the mockups, before the Text size setting
  weight?: Weight | "display"; // Nunito 600 to 900, or "display" for the rounded title font (Lilita One)
  color?: string;              // the palette's text colour when left out
  spacing?: number;            // space between letters, in px
  lh?: number;                 // line height as a multiple of the size
  align?: TextStyle["textAlign"];
  fixed?: boolean;             // true: ignore the Text size setting (card faces and other artwork)
  underline?: boolean;
  style?: StyleProp<TextStyle>;
};

// All text in the app goes through here, so the fonts, the Text size setting and the colours are
// decided in one place. The phone's own font size setting is ignored on purpose (allowFontScaling is
// off): the app has its own Text size setting, and the table is laid out to fit it.
export function T({ size = 14, weight = 700, color, spacing, lh, align, fixed, underline, style, children, ...rest }: TProps) {
  const { scale, colors } = useUi();
  const px = fixed ? size : Math.round(size * scale * 10) / 10;
  const display = weight === "display";
  const text: TextStyle = {
    fontFamily: display ? FONT.display : WEIGHT_FONT[weight],
    fontSize: px,
    lineHeight: Math.round(px * (lh ?? (display ? 1.12 : 1.22)) * 10) / 10,
    color: color ?? colors.text,
    includeFontPadding: false,
    ...(spacing !== undefined ? { letterSpacing: spacing } : {}),
    ...(align ? { textAlign: align } : {}),
    ...(underline ? { textDecorationLine: "underline" as const } : {}),
  };
  return (
    <Text allowFontScaling={false} style={[text, style]} {...rest}>
      {children}
    </Text>
  );
}
