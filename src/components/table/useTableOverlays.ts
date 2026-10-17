import { useState } from "react";
import { Card } from "../../game/types";
import { useAppActive } from "../useAppActive";

export type SheetName = "menu" | "chat" | "emotes" | "standings";
export type ScreenName = "settings" | "rules";

// What is open on top of the table: a sheet (menu, chat, emotes, standings), the "leave?" question,
// the settings or rules screen, or the explanation of a card you are holding down.
// While any of them is open (or the app is in the background) the game waits.
export function useTableOverlays() {
  const appActive = useAppActive();
  const [sheet, setSheet] = useState<SheetName | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [screen, setScreen] = useState<ScreenName | null>(null);
  const [heldCard, setHeldCard] = useState<Card | null>(null);
  const blocked = sheet !== null || leaving || screen !== null || heldCard !== null;
  const paused = !appActive || blocked;

  // Android's back button closes whatever is on top, if anything is. Returns true if it closed something.
  // (The sheets and dialogs handle the back button themselves while they are open; this covers the
  // full screens, settings and rules.)
  function closeTop(): boolean {
    if (heldCard) setHeldCard(null);
    else if (screen) setScreen(null);
    else if (leaving) setLeaving(false);
    else if (sheet) setSheet(null);
    else return false;
    return true;
  }

  return { sheet, setSheet, leaving, setLeaving, screen, setScreen, heldCard, setHeldCard, blocked, paused, closeTop };
}

export type TableOverlays = ReturnType<typeof useTableOverlays>;
