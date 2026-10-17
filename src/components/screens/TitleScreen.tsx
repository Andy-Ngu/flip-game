import { ScrollView, useWindowDimensions, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { paced } from "../../game/pace";
import { useStyles, useUi } from "../AppContext";
import { Backdrop } from "../ui/Backdrop";
import { Button } from "../ui/Button";
import { makeStyles } from "./TitleScreen.styles";
import { TitleScreenFloaters } from "./TitleScreenFloaters";
import { TitleScreenLogo } from "./TitleScreenLogo";
import { TitleScreenProfile } from "./TitleScreenProfile";

type Props = {
  onPlay: () => void;
  onHowTo: () => void;
  onSettings: () => void;
  onProfile: () => void;
};

// The first screen: cards drifting behind the logo, then PLAY, How to play and Settings.
// Your profile chip sits in the top corner.
export function TitleScreen({ onPlay, onHowTo, onSettings, onProfile }: Props) {
  const { reduceMotion, speed } = useUi();
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  // The buttons sit about two thirds of the way down, as in the mockup: plenty of air under them on a
  // tall phone (the cards drift there), not too much on a short one.
  const bottomGap = Math.max(16, Math.min(140, Math.round(height * 0.14)));
  // The buttons fade up a moment after the logo has opened. With Reduce motion on they are just there.
  const buttonsIn = reduceMotion ? undefined : FadeInDown.delay(paced(650, speed)).duration(paced(450, speed));

  return (
    <View style={styles.root}>
      <Backdrop centerY={0.4} />
      <TitleScreenFloaters />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + bottomGap,
            paddingLeft: insets.left + 16,
            paddingRight: insets.right + 16,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <TitleScreenProfile onPress={onProfile} />

        <View style={styles.middle}>
          <TitleScreenLogo />
        </View>

        <Animated.View entering={buttonsIn} style={styles.buttons}>
          <Button label="PLAY" size="lg" variant="gold" haptic="light" accessibilityLabel="Play" onPress={onPlay} />
          <View style={styles.row}>
            <Button label="How to play" variant="ghost" size="sm" height={52} flex={1} onPress={onHowTo} />
            <Button label="Settings" variant="ghost" size="sm" height={52} flex={1} onPress={onSettings} />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
