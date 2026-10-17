import { CLOCK_CHOICES, ClockSeconds } from "../game/clock";
import { Choice } from "./ui/Segmented";

// The turn clock choices, written once for the Settings screen and the Create table screen.
export const CLOCK_OPTIONS: Choice<ClockSeconds>[] = CLOCK_CHOICES.map((s) => ({ value: s, label: `${s} seconds` }));
