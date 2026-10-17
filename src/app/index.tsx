import { useState } from "react";
import { View } from "react-native";
import { useApp } from "../components/AppContext";
import { CreateTableScreen } from "../components/screens/CreateTableScreen";
import { HowToPlayScreen } from "../components/screens/HowToPlayScreen";
import { ProfileScreen } from "../components/screens/ProfileScreen";
import { SettingsScreen } from "../components/screens/SettingsScreen";
import { TitleScreen } from "../components/screens/TitleScreen";
import { TableScreen } from "../components/table/TableScreen";
import { NORMAL } from "../components/theme";
import { useBackButton } from "../components/useBackButton";
import { profileLook, profileName } from "../game/profile";
import { TableSetup, tableSetup } from "../game/seats";
import { PlayerSetup } from "../game/session";

// The screens of the app. Only one is shown at a time, and this file decides which.
//   title     the first screen: Play, How to play, Settings
//   create    choose the table: how many players, how good the computer is, the winning score
//   table     the game itself
//   settings, howto, profile    open from the title screen
type ScreenName = "title" | "create" | "table" | "settings" | "howto" | "profile";

// A game that has been started. The id changes every time, so a new game always starts clean.
type Started = { id: number; setup: PlayerSetup[]; table: TableSetup };

export default function Home() {
  const { settings, loaded, update } = useApp();
  const [screen, setScreen] = useState<ScreenName>("title");
  const [started, setStarted] = useState<Started | null>(null);
  const profile = settings.profile;

  // Android's back button: from any of the side screens it goes back to the title. (The table
  // handles its own back button, and on the title screen back leaves the app as usual.)
  useBackButton(profile !== null && screen !== "title" && screen !== "table", () => {
    setScreen("title");
    return true;
  });

  // Wait for the saved settings (a fraction of a second) so the right screen opens straight away.
  if (!loaded) return <View style={{ flex: 1, backgroundColor: NORMAL.bg }} />;

  // The very first time (or after deleting your profile) you choose your character before anything else.
  if (!profile) return <ProfileScreen key="create" mode="create" onDone={() => setScreen("title")} />;

  function startGame(table: TableSetup) {
    if (!profile) return;
    update({ table, turnClock: table.clock }); // remember this table (and its clock) for next time
    setStarted({
      id: (started?.id ?? 0) + 1,
      table,
      setup: tableSetup(table, { name: profileName(profile), look: profileLook(profile) }),
    });
    setScreen("table");
  }

  switch (screen) {
    case "create":
      // The clock comes from the Turn clock setting, which is the one place it is changed.
      return <CreateTableScreen initial={{ ...settings.table, clock: settings.turnClock }} onStart={startGame} onBack={() => setScreen("title")} />;
    case "table":
      return started ? <TableScreen key={started.id} setup={started.setup} table={started.table} onExit={() => setScreen("title")} /> : null;
    case "settings":
      return <SettingsScreen onBack={() => setScreen("title")} />;
    case "howto":
      return <HowToPlayScreen onBack={() => setScreen("title")} />;
    case "profile":
      return <ProfileScreen key="edit" mode="edit" onDone={() => setScreen("title")} onBack={() => setScreen("title")} />;
    default:
      return (
        <TitleScreen
          onPlay={() => setScreen("create")}
          onHowTo={() => setScreen("howto")}
          onSettings={() => setScreen("settings")}
          onProfile={() => setScreen("profile")}
        />
      );
  }
}
