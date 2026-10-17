import { Children, ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { GAME_SPEEDS, GameSpeed } from "../../game/pace";
import { TextSize, TEXT_SIZES } from "../../game/settings";
import { useApp, useStyles, useUi } from "../AppContext";
import { Panel } from "../ui/Panel";
import { Screen } from "../ui/Screen";
import { Choice, Segmented } from "../ui/Segmented";
import { Switch } from "../ui/Switch";
import { T } from "../ui/T";
import { TopBar } from "../ui/TopBar";
import { makeStyles } from "./SettingsScreen.styles";
import { SettingsScreenPreview } from "./SettingsScreenPreview";
import { SettingsScreenRow } from "./SettingsScreenRow";

type Props = { onBack: () => void };

const TEXT_SIZE_LABEL: Record<TextSize, string> = { normal: "Normal", large: "Large", largest: "Largest" };
const SPEED_LABEL: Record<GameSpeed, string> = { slower: "Slower", normal: "Normal", faster: "Faster" };

const TEXT_SIZE_CHOICES: Choice<TextSize>[] = TEXT_SIZES.map((size) => ({ value: size, label: TEXT_SIZE_LABEL[size] }));
const SPEED_CHOICES: Choice<GameSpeed>[] = GAME_SPEEDS.map((speed) => ({ value: speed, label: SPEED_LABEL[speed] }));

// Every setting in one place. A change is applied and saved the moment it is made, so there is no
// Save button: turn on High contrast and the colours change under your thumb.
export function SettingsScreen({ onBack }: Props) {
  const { settings, update } = useApp();
  const { reduceMotion } = useUi();
  const styles = useStyles(makeStyles);

  // A setting with an on/off switch.
  const toggle = (label: string, desc: string, value: boolean, onChange: (on: boolean) => void) => (
    <SettingsScreenRow label={label} desc={desc} control={<Switch value={value} onChange={onChange} label={label} />} />
  );

  return (
    <Screen>
      <TopBar title="SETTINGS" onBack={onBack} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="SOUND AND TOUCH">
          {toggle("Sound effects", "Card flips, chimes and the shuffle.", settings.sound, (sound) => update({ sound }))}
          {toggle("Vibration", "Buzz when you bust, draw or it is your turn.", settings.vibration, (vibration) => update({ vibration }))}
          {toggle("Turn alert sound", "A short chime when it becomes your turn.", settings.turnAlertSound, (turnAlertSound) => update({ turnAlertSound }))}
        </Section>

        <Section title="TEXT AND COLOUR">
          <SettingsScreenRow
            label="Text size"
            desc="Makes names, scores and labels bigger. The table rearranges to fit."
            below={
              <>
                <Segmented label="Text size" choices={TEXT_SIZE_CHOICES} value={settings.textSize} onChange={(textSize) => update({ textSize })} />
                <SettingsScreenPreview />
              </>
            }
          />
          {toggle("High contrast", "Brighter text, thicker outlines and plain backgrounds.", settings.highContrast, (highContrast) => update({ highContrast }))}
        </Section>

        <Section title="MOTION">
          {/* Shows what is really happening: on if you chose it, or if you have not chosen and your phone asks for it. */}
          {toggle("Reduce motion", "Cards appear without flying. No floating, bouncing or confetti.", reduceMotion, (on) => update({ reduceMotion: on }))}
          {toggle("Reduce flashes", "Replaces screen flashes and glows with a calm outline.", settings.reduceFlashes, (reduceFlashes) => update({ reduceFlashes }))}
        </Section>

        <Section title="PACE">
          <SettingsScreenRow
            label="Game speed"
            desc="How quickly bots play and animations run."
            below={<Segmented label="Game speed" choices={SPEED_CHOICES} value={settings.gameSpeed} onChange={(gameSpeed) => update({ gameSpeed })} />}
          />
          {toggle("Ignore double taps", "After a tap, buttons wait half a second before they accept another.", settings.ignoreDoubleTaps, (ignoreDoubleTaps) => update({ ignoreDoubleTaps }))}
        </Section>

        <Section title="GAME">
          {toggle("Show bust odds", "The chance your next card is a duplicate.", settings.showBustOdds, (showBustOdds) => update({ showBustOdds }))}
          {toggle("Swap button sides", "Puts HIT on the right and STAY on the left.", settings.swapSides, (swapSides) => update({ swapSides }))}
          {toggle("Hide chat and emotes", "Do not show other players' messages or reactions at the table.", settings.hideChat, (hideChat) => update({ hideChat }))}
        </Section>

        <FootNote />
      </ScrollView>
    </Screen>
  );
}

type SectionProps = { title: string; children: ReactNode };

// A small grey heading above one rounded panel holding a few settings, with a thin line between them.
function Section({ title, children }: SectionProps) {
  const { colors } = useUi();
  const styles = useStyles(makeStyles);
  return (
    <View>
      <T size={11} weight={900} spacing={1.4} lh={1} color={colors.textFaint} style={styles.sectionTitle} accessibilityRole="header">{title}</T>
      <Panel radius={16} style={styles.panel}>
        {Children.toArray(children).map((row, i) => (
          <View key={i} style={i === 0 ? undefined : styles.divider}>
            {row}
          </View>
        ))}
      </Panel>
    </View>
  );
}

function FootNote() {
  const { colors } = useUi();
  const styles = useStyles(makeStyles);
  return (
    <T size={12} weight={700} lh={1.4} color={colors.textFaint} align="center" style={styles.note}>
      Settings are saved on this phone. Reduce motion starts on if your phone is set to reduce motion.
    </T>
  );
}
