import { ReactNode, useState } from "react";
import { ScrollView, View } from "react-native";
import { Target, TARGETS } from "../../game/scoring";
import { BOT_LEVEL_LABEL, BOT_LEVELS, SEAT_COUNTS, TableSetup } from "../../game/seats";
import { BotLevel } from "../../game/types";
import { useStyles, useUi } from "../AppContext";
import { CLOCK_OPTIONS } from "../clockChoices";
import { Button } from "../ui/Button";
import { Screen } from "../ui/Screen";
import { Choice, Segmented } from "../ui/Segmented";
import { T } from "../ui/T";
import { TopBar } from "../ui/TopBar";
import { makeStyles } from "./CreateTableScreen.styles";

type Props = {
  initial: TableSetup;                    // what the choices start as (the last table you made)
  onStart: (table: TableSetup) => void;   // START GAME
  onBack: () => void;
};

// The choices, written once. Numbers are drawn in the title font; the others are words.
const SEAT_CHOICES: Choice<number>[] = SEAT_COUNTS.map((n) => ({ value: n, label: String(n), spoken: `${n} seats` }));
const BOT_CHOICES: Choice<BotLevel>[] = BOT_LEVELS.map((level) => ({ value: level, label: BOT_LEVEL_LABEL[level] }));
const TARGET_CHOICES: Choice<Target>[] = TARGETS.map((t) => ({ value: t, label: String(t), spoken: `${t} points` }));

// Set up a game against the computer: how many seats, how good the computer players are, how long
// you get per turn and what score wins. Nothing is saved here; START GAME hands the choices back.
export function CreateTableScreen({ initial, onStart, onBack }: Props) {
  const styles = useStyles(makeStyles);
  const [table, setTable] = useState<TableSetup>(initial);
  const change = (part: Partial<TableSetup>) => setTable((t) => ({ ...t, ...part }));

  return (
    <Screen>
      <TopBar title="CREATE TABLE" onBack={onBack} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.sections} showsVerticalScrollIndicator={false}>
        {/* The explaining sentences are not drawn any more, but a screen reader still says them (as the hint). */}
        <Section label="SEATS">
          <Segmented
            label="Seats" hint={`You and ${table.seats - 1} computer players.`}
            height={52} onScreen numerals choices={SEAT_CHOICES} value={table.seats} onChange={(seats) => change({ seats })}
          />
        </Section>

        <Section label="TURN CLOCK">
          <Segmented
            label="Turn clock" hint="If it runs out, you stay automatically."
            height={52} onScreen choices={CLOCK_OPTIONS} value={table.clock} onChange={(clock) => change({ clock })}
          />
        </Section>

        <Section label="BOT SKILL">
          <Segmented
            label="Bot skill" hint="How well the computer players play."
            height={52} onScreen choices={BOT_CHOICES} value={table.botLevel} onChange={(botLevel) => change({ botLevel })}
          />
        </Section>

        <Section label="FIRST TO REACH">
          <Segmented
            label="First to reach" hint="Lower is a shorter game. 200 is the usual."
            height={52} onScreen numerals choices={TARGET_CHOICES} value={table.target} onChange={(target) => change({ target })}
          />
        </Section>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="START GAME" size="lg" height={64} haptic="light" accessibilityLabel="Start game" onPress={() => onStart(table)} />
      </View>
    </Screen>
  );
}

type SectionProps = { label: string; children: ReactNode };

// A small grey heading and the choices under it.
function Section({ label, children }: SectionProps) {
  const { colors } = useUi();
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.section}>
      <T size={11} weight={900} spacing={1.2} lh={1} color={colors.textFaint} accessibilityRole="header">{label}</T>
      {children}
    </View>
  );
}
