import { ReactNode } from "react";
import { View } from "react-native";
import { FILL } from "../fill";

type Props = {
  level: number;
  hidden?: boolean;        // something in front of this layer is a dialog: screen readers skip what is in here
  children?: ReactNode;
};

// A full-screen layer at the given level (see components/layers.ts). It is a real view
// (`collapsable={false}`) with its own z-order: React Native joins views that draw nothing into their
// parent, and then the numbers of everything inside them are compared with the numbers outside, so a card
// with a high number could end up in front of a popup. Touches pass through everything but the children.
export function Layer({ level, hidden = false, children }: Props) {
  return (
    <View
      collapsable={false}
      pointerEvents="box-none"
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? "no-hide-descendants" : "auto"}
      style={[FILL, { zIndex: level }]}
    >
      {children}
    </View>
  );
}
