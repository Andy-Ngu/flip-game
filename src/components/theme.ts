// The colors of the whole app in one place. The title screen, setup screen and game table
// all use these, so changing the look means changing this file.
export const theme = {
  bg: "#1B2440",            // the table: deep navy
  surface: "#243056",       // panels on the table
  surfaceRaised: "#2D3B69", // things sitting on a panel (inputs, buttons, the active panel)
  border: "#3A4A7C",

  text: "#F4EFE6",          // cream
  textDim: "#A9B4D6",
  textFaint: "#7F8BB3",

  gold: "#F2C14E",          // the main accent: buttons, the active player, the winner
  onGold: "#1B2440",        // text on top of gold

  danger: "#FF7A85",
  dangerBg: "#43263A",
  timeOut: "#5BB4F0",
} as const;
