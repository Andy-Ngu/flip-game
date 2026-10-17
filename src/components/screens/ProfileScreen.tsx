import { useState } from "react";
import { AccessibilityInfo, ScrollView, View } from "react-native";
import { Profile, profileName, randomProfile, rerollName } from "../../game/profile";
import { deleteProfile } from "../../game/settings";
import { useApp, useStyles, useUi } from "../AppContext";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Panel } from "../ui/Panel";
import { Screen } from "../ui/Screen";
import { Tap } from "../ui/Tap";
import { T } from "../ui/T";
import { TopBar } from "../ui/TopBar";
import { ProfilePicker } from "./ProfilePicker";
import { ProfilePortrait } from "./ProfilePortrait";
import { makeStyles } from "./ProfileScreen.styles";
import { ProfileStats } from "./ProfileStats";

type Props = {
  mode: "create" | "edit";
  onDone: () => void;     // create: the big button was pressed and the profile is saved. edit: leave the screen
  onBack?: () => void;    // the back arrow. In create mode there is none unless this is given
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// "Playing since October 2026", or nothing if we do not know when the profile was made.
function sinceText(since: number | null): string | null {
  if (since === null) return null;
  const date = new Date(since);
  if (Number.isNaN(date.getTime())) return null;
  return `Playing since ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

// Who you are at the table: a character, a colour and a name that comes with the character.
//
//   create  the first time the app opens. A random guest is made for you (say "Daring Fox"); change the
//           character, the colour or the name if you like, then press LET'S PLAY. Nothing is saved
//           until you press it.
//   edit    the same picker (opened with the pencil), plus your record, and a way to delete it all.
//           Every change is saved straight away.
export function ProfileScreen({ mode, onDone, onBack }: Props) {
  const { settings, update } = useApp();
  const { colors } = useUi();
  const styles = useStyles(makeStyles);
  const creating = mode === "create";

  // The profile being worked on lives here while the screen is open.
  const [profile, setProfile] = useState<Profile>(() => settings.profile ?? randomProfile());
  const [picking, setPicking] = useState(creating);   // the character and colour pickers are showing
  const [asking, setAsking] = useState(false);        // the "Delete your profile?" question is showing

  // Every change goes through here. Editing saves it at once; creating waits for the big button.
  function change(next: Profile) {
    setProfile(next);
    AccessibilityInfo.announceForAccessibility(profileName(next));
    if (!creating) update({ profile: next });
  }

  function finish() {
    update({ profile, since: Date.now() });
    onDone();
  }

  // After this the app has no profile, so it shows the first-time screen again by itself.
  function remove() {
    setAsking(false);
    update(deleteProfile(settings));
  }

  const back = creating ? onBack : (onBack ?? onDone);
  const since = creating ? null : sinceText(settings.since);

  return (
    <View style={styles.root}>
      {/* While the "Delete your profile?" question is open, screen readers skip the screen under it. */}
      <View style={styles.root} importantForAccessibility={asking ? "no-hide-descendants" : "auto"} accessibilityElementsHidden={asking}>
        <Screen>
          <TopBar title={creating ? "YOUR CHARACTER" : "PROFILE"} onBack={back} />

          <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.who}>
              <ProfilePortrait profile={profile} onEdit={creating ? undefined : () => setPicking((open) => !open)} editing={picking} />
              <View style={styles.nameRow}>
                <T size={30} weight="display" spacing={1} lh={1.05} align="center" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={{ flexShrink: 1 }}>
                  {profileName(profile)}
                </T>
                {creating ? null : (
                  <View style={styles.guest}>
                    <T size={11} weight={900} spacing={0.8} lh={1.2} color={colors.textDim}>GUEST</T>
                  </View>
                )}
              </View>
              {since ? <T size={12.5} weight={700} color={colors.textDim}>{since}</T> : null}
              {picking ? <Button label="New name" icon="refresh" variant="ghost" size="sm" height={48} onPress={() => change(rerollName(profile))} /> : null}
            </View>

            {picking ? <ProfilePicker profile={profile} onChange={change} /> : null}

            {creating ? null : (
              <>
                <View style={styles.section}>
                  <T size={11} weight={900} spacing={1.2} lh={1} color={colors.textFaint}>YOUR STATS</T>
                  <ProfileStats stats={settings.stats} />
                </View>

                <Panel style={styles.note}>
                  <T size={15} weight={800}>You are playing as a guest</T>
                  <T size={12.5} weight={700} lh={1.35} color={colors.textDim}>Your profile is saved on this phone.</T>
                </Panel>

                <Tap label="Delete my profile and data" onPress={() => setAsking(true)} haptic="light" style={styles.deleteLink}>
                  <T size={14} weight={800} color={colors.danger} align="center">Delete my profile and data</T>
                </Tap>
              </>
            )}
          </ScrollView>

          {creating ? (
            <View style={styles.footer}>
              <Button label="LET'S PLAY" variant="gold" size="lg" height={64} onPress={finish} />
            </View>
          ) : null}
        </Screen>
      </View>

      {asking ? (
        <Dialog
          title="DELETE YOUR PROFILE?"
          tone="danger"
          body="This removes your name, character and stats from this phone. It cannot be undone."
          onClose={() => setAsking(false)}
        >
          <View style={styles.dialogButtons}>
            <Button label="Keep it" variant="ghost" size="sm" height={52} flex={1} onPress={() => setAsking(false)} />
            <Button label="Delete" variant="danger" size="sm" height={52} flex={1} onPress={remove} />
          </View>
        </Dialog>
      ) : null}
    </View>
  );
}
