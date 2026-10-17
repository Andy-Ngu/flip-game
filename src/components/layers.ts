// The order things are drawn on the table, from the back to the front. A higher number is drawn in front
// of a lower one. Every group below is its own layer (see Layer and the Stage), so the numbers only ever
// compete inside their own group and a card in your hand can never end up in front of a popup.
//
// The order follows what design systems say about messages (Adobe Spectrum and Dialpad's toast guidelines,
// and the WCAG discussion of timed messages): the more a message matters, the nearer the front; only one
// small message at a time, and the more important one wins; a message stays long enough to be read (5 to 6
// seconds for a plain toast; in a fast game, shorter, and it closes when tapped); and anything the player
// has to understand is never a toast that vanishes.
//   - Things the player opened (a menu, a dialog) are in front of everything: it is what they are looking at.
//   - Whole scenes (the round board, the results, the winner) replace the table: in front of it, behind any menu.
//   - Messages that explain the game (a first-time card explanation, the tips) come next. They have to be
//     read, so nothing but a menu or a scene may cover them.
//   - Big moments (Shield blocked it, a card played on you, the deck being shuffled, a Seven Stack) come before small messages.
//   - Small messages ("Gus played Time Out on you") are in front of the table and behind the rest.
//   - The table is last. Inside it the BUST stamp is in front of your cards and the header, and your cards are
//     in front of the Seven Stack and bust odds bars but behind everything else.

// The layers of the whole screen (see TableScreen).
export const LAYER = {
  table: 0,      // the other players, your stage, the buttons
  glow: 10,      // the gold edge when your turn starts (decoration, never takes a touch)
  toast: 20,     // a short message at the top: someone played a card, took the lead, the deck is low
  moment: 30,    // something big happened: Shield blocked it, a card was played on you, the deck is being shuffled, a Seven Stack
  help: 40,      // a message that explains the game: card help, the first-game tips
  scene: 50,     // the round board, the round results, the winner
  menu: 60,      // menus, sheets and dialogs the player opened
} as const;

// The layers inside your own stage (see Stage), from the back to the front.
export const STAGE_LAYER = {
  meters: 1,         // the Seven Stack and bust odds bars
  hand: 2,           // your cards: in front of the bars, behind everything else
  header: 3,         // the score boxes and the words about you
  stamp: 4,          // BUST, in front of the cards and the header
  veil: 5,           // the dark veil while "How your round scores" is open
  headerRaised: 6,   // the score box stays bright above the veil
  breakdown: 7,      // the "How your round scores" card
} as const;
