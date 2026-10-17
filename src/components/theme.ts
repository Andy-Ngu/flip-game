// The colours, fonts and sizes of the whole app in one place. Every screen reads them from here
// (through useUi), so changing the look, or switching on high contrast, means changing this file.

export type Palette = {
  bg: string;            // the table: deep navy
  bgDeep: string;        // behind sheets and dialogs
  surface: string;       // panels on the table
  surfaceRaised: string; // things sitting on a panel (inputs, buttons, the active panel)
  border: string;
  borderWidth: number;   // thicker with high contrast

  text: string;          // cream
  textDim: string;
  textFaint: string;

  gold: string;          // the main accent: buttons, the active player, the winner
  goldDark: string;      // the lower edge of a gold button
  onGold: string;        // text on top of gold

  blue: string;          // STAY, Time Out
  blueDark: string;
  good: string;          // green: connection, bust odds low, a Shield
  warn: string;          // orange: the turn clock under ten seconds
  danger: string;
  dangerBg: string;
  dim: string;           // a card slot with nothing in it
};

export const NORMAL: Palette = {
  bg: "#1B2440",
  bgDeep: "#141B33",
  surface: "#243056",
  surfaceRaised: "#2D3B69",
  border: "#3A4A7C",
  borderWidth: 2,

  text: "#F4EFE6",
  textDim: "#C9D1EC",
  textFaint: "#A9B4D6",

  gold: "#F2C14E",
  goldDark: "#B8891E",
  onGold: "#1B2440",

  blue: "#5BB4F0",
  blueDark: "#2D3B69",
  good: "#5FD39A",
  warn: "#FFA94D",
  danger: "#FF7A85",
  dangerBg: "#43263A",
  dim: "rgba(122,138,190,0.45)",
};

// High contrast: brighter text, thicker outlines and plain backgrounds.
export const HIGH_CONTRAST: Palette = {
  bg: "#080C1A",
  bgDeep: "#000000",
  surface: "#10172E",
  surfaceRaised: "#1B2547",
  border: "#E8ECF8",
  borderWidth: 3,

  text: "#FFFFFF",
  textDim: "#F0F3FC",
  textFaint: "#D5DBF0",

  gold: "#FFD54D",
  goldDark: "#B8891E",
  onGold: "#000000",

  blue: "#7CC8FF",
  blueDark: "#2D3B69",
  good: "#7BF2B6",
  warn: "#FFC27A",
  danger: "#FF9AA2",
  dangerBg: "#4A1F2B",
  dim: "rgba(213,219,240,0.6)",
};

// The three fonts. They are loaded in the root layout, and the names match what useFonts is given.
export const FONT = {
  display: "LilitaOne_400Regular",
  semi: "Nunito_600SemiBold",
  bold: "Nunito_700Bold",
  extra: "Nunito_800ExtraBold",
  black: "Nunito_900Black",
} as const;

export type FontName = keyof typeof FONT;

// Nunito weights as the mockups write them (600 to 900), mapped to the font files.
export const WEIGHT_FONT = { 600: FONT.semi, 700: FONT.bold, 800: FONT.extra, 900: FONT.black } as const;
export type Weight = keyof typeof WEIGHT_FONT;

// The colour of a status word, used on opponent tiles.
export type StatusColors = { playing: string; stayed: string; busted: string; timedOut: string };
