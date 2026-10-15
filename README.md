# Stack Seven

A push-your-luck card game for 3 to 8 players, built with React Native, Expo and TypeScript. Play pass-and-play with friends, or add computer opponents at three difficulty levels.

On your turn you either **hit** (draw a card) or **stay** (bank your points). Draw a number you already hold and you bust, scoring nothing for the round. Collect seven different numbers and you complete a **Seven Stack** for a bonus and end the round on the spot. First to 200 wins.


## Features

- **Complete rules engine** for a 94-card deck, scoring, special cards, ties and multi-round games
- **Computer opponents** at three levels (Easy, Medium, Hard), checked against each other in a bot tournament
- **Setup screen** to add and remove players, and choose human or computer for each seat
- **Remembers your table**: the players you chose and the haptics setting are saved on the phone
- **Results board and winner screen** with ranked standings, counting totals and confetti
- **In-app rules** with real card faces, from the title screen or mid-game
- **Card game feel**: cards fly in face-down and flip, spring into a fanned hand, wobble gently on your turn, tilt toward your finger when you press and hold, and droop when you bust
- **Sound effects** for drawing, staying, busting, Time Out, Shield, Seven Stack and winning, with a Sound switch
- **Haptics** tuned to the moment: a tick when you draw, a heavier buzz when a Time Out lands, a success pattern for a Seven Stack
- **Original card art**, drawn entirely in code (no image files), plus an animated title screen and app icon

## How to play

Each player starts a round with one card. Players then take turns in seat order, starting with the player after the dealer. The dealer changes every round.

**On your turn**, hit or stay.
- **Hit:** draw a card from the deck.
- **Stay:** lock in your current score and sit out the rest of the round. You need at least one card to stay.

**Number cards (0 to 12).** There are as many copies of each number as its value (twelve 12s, eleven 11s, down to one 1, plus a single 0). Draw a number you already have and you **bust**: your hand scores 0 this round.

**Action cards** are resolved when drawn:

| Card | What it does |
| --- | --- |
| **Time Out** | You choose a player. They bank their points and are out for the rest of the round. |
| **Draw Three** | You choose a player. They must draw the next three cards, and they bust if any is a duplicate. |
| **Shield** | Absorbs one duplicate, then is used up. You can hold one at a time. A spare goes to another player who has none. |

**Bonus cards** change your score: **Bonus +2, +4, +6, +8, +10**, and **Double Score**, which doubles the total of your number cards (not your bonuses).

**Seven Stack.** Collect seven different numbers and the round ends immediately. You get +15, and everyone still in the round banks their points.

**Scoring a hand:** add up the number cards, apply Double Score if you have it, add any Bonus cards, then add 15 for a Seven Stack. A busted hand scores 0.

**Winning.** When a round ends and someone has 200 or more, the highest total wins. If the top players are tied, everyone plays another round.

## Tech stack

| | |
| --- | --- |
| Framework | React Native with Expo (Expo Router) |
| Language | TypeScript (strict mode) |
| Animation | React Native Reanimated, running on the UI thread |
| Haptics | expo-haptics |
| Sound | expo-audio |
| Storage | AsyncStorage for saved settings |
| Tests | Plain TypeScript test scripts and simulations, no framework |

## Architecture

The game is split into two layers that don't know about each other's details.

```
src/
  game/          Pure TypeScript. No React, no React Native.
    types.ts       Card, Player and deck types
    deck.ts        Building, shuffling and (seeded) reshuffling the deck
    rules.ts       Drawing, duplicates, busting, ending a round
    scoring.ts     Hand scoring and finding the winners
    round.ts       One round: dealing, turns, special cards
    session.ts     A whole game, including pausing for a player's choice
    bot.ts         The computer players
    events.ts      "What just happened?" for haptics and effects
    seats.ts       Setup screen logic
    results.ts     Ranked results for the round-over board and the final standings
    settings.ts    What is saved between launches, and how to read it back safely
    sounds.ts      Which sound effects play for each moment of a game
    cardFace.ts    What each card looks like (colors, symbols, captions)
    handLayout.ts  Where each card sits in the fanned hand
    check-*.ts     Test suites
  components/    React Native screens and pieces
    TitleScreen, SetupScreen, GameScreen, RoundSummary, WinnerScreen,
    PlayerCard, Hand, CardFace, Button, theme (all colors in one file)
  app/           Expo Router entry point
assets/
  source/make-sounds.py   Builds every sound effect from sine waves and noise
  sounds/                 The nine generated .wav files
scripts/
  run-checks.js  Compiles and runs every test suite (npm test)
```

### Decisions worth explaining

**A pure, immutable game engine.** Every function takes a game state and returns a new one; nothing is changed in place. That makes the rules easy to test without a phone or a screen, and it means the UI can simply hold one piece of state and replace it after each move.

**Pausing for a choice without a state machine.** Some cards need a decision mid-turn (who gets the Time Out?). Instead of splitting each turn into many half-finished states, the session runs the whole move, and if it needs an answer it doesn't have, it stops and remembers the answers so far. After you answer, the move is re-run from the start with one more answer. This is safe because the engine never changes its inputs.

**A bug the tests caught.** Re-running a move means every step must repeat exactly. A stress test showed one step that didn't: when the draw pile ran out mid-turn, the discard pile was reshuffled randomly, so a replay could deal different cards than the player had been asked about. The fix was a seeded shuffle that is stored in the deck state, so the same state always reshuffles the same way. There's now a regression test for it.

**Events instead of haptics in the game logic.** The engine knows nothing about vibration or animation. A function compares the previous and next game state and returns a list of events (bust, Time Out, Seven Stack, and so on), and a second function maps those events to a haptic feel. The screen plays the result. Changing how the game feels never touches the rules.

**Computer players you can trust.** Easy stays at a fixed score, Medium at a higher one, and Hard weighs the expected gain against the chance of busting using the cards it has seen. I didn't want to just claim the levels were different, so the bot suite plays a 3,000-game tournament between all three and checks that Hard wins well above an even share.

**Animation that stays smooth.** Each card's position, tilt, flip and press state live in Reanimated shared values, so animation runs on the UI thread even while JavaScript is busy. The fanned layout is a pure function (`handLayout.ts`) and is tested like the rest of the game logic. The idle wobble only runs for the player whose turn it is, and stops for everyone else.

**Sounds made from nothing.** I didn't want to hunt for sound files with unclear licenses, so a short Python script builds every sound from sine waves and noise: a card flick is a puff of filtered noise, a bust is a falling tone, a Shield is a struck-metal partial series. They are original, the script is in the repo, and changing a sound means changing a number and running it again. Which sound plays is decided by a pure function over the same events the haptics use, so it is tested like the rest of the game.

**Saved settings that can't break the app.** Whatever is read back from the phone is untrusted: it can be missing, cut off, from an older version of the app or edited by hand. `parseSettings` checks every field on its own and falls back to the default, and a saved table must pass the same rules as the setup screen, so a bad save can never crash the app or start a game the setup screen would refuse.

**Cards that look right on every phone.** Card text ignores the phone's font-size setting, and the Time Out and Shield icons are drawn with shapes instead of font symbols, because symbols render differently from one Android font to the next.

## Testing

```
npm test
```

This compiles and runs nine suites (about 205 checks):

| Suite | What it covers |
| --- | --- |
| `check-round` | Dealing, duplicates, Shield, Time Out, Draw Three, Seven Stack, and 300 simulated games checking that all 94 cards are always accounted for |
| `check-session` | Pausing and resuming for choices, ties, the 200-point finish, the mid-turn reshuffle, and 300 full games |
| `check-bots` | Each difficulty's decisions, target choices, and a 3,000-game tournament |
| `check-seats` | Setup screen rules (3 to 8 players, human or computer) |
| `check-events` | Turning state changes into events and haptic feels |
| `check-cards` | Card faces, hand layout and the 6 and 9 underline |
| `check-results` | The round results board: ranking, ties, and when the game ends |
| `check-sounds` | Which sound plays for each moment: flicks for cards, the outcome after them, and the win fanfare |
| `check-settings` | Loading saved settings safely, including missing, damaged and out-of-date data |

A typical tournament result over 3,000 games (it varies a little each run):

| Level | Win rate |
| --- | --- |
| Easy | about 9% |
| Medium | about 40% |
| Hard | about 51% |

The screens are checked with the TypeScript compiler and by playing on a device. The engine is where the automated tests focus.

## Running it

You'll need Node.js and the Expo Go app on your phone (or an Android or iOS emulator).

```
npm install
npx expo start
```

Scan the QR code with Expo Go. Haptics need a real phone.

## What I learned

- **TypeScript as a safety net.** My first compiler errors were a property missing from a type and a card kind I hadn't declared. Reading those messages taught me what the types were for: card kinds are a union type, so the compiler stops me from handling a card the game doesn't have.
- **Why you return a new array instead of changing the old one.** The game engine never edits a game in place. Each move returns a new state. That made the rules easy to test, and it's the same habit React state needs.
- **Keeping rules and screens apart.** The whole game runs without React, so I could test it with plain scripts and then build screens on top of it.
- **Testing by simulation.** Playing hundreds of random games, and thousands of bot games, found a rare reshuffle bug that no hand-written test would have thought of.
- **Animation with Reanimated.** Shared values, springs, timing and repeating animations. I studied how Balatro gets its card feel (tilt toward the touch, a shadow that moves, a hand that follows its slot) and rebuilt the techniques with my own artwork.
- **Real devices behave differently from the code.** On my Galaxy S24, the phone's font-size setting broke the card layout. I fixed it by making card text ignore font scaling and drawing the icons as shapes.
- **Working with an AI assistant.** I learned to give specific feedback from the real phone, to ask why a change works before accepting it, and to keep the tests as the judge of whether the code is right.

## Roadmap

- Online multiplayer (later, once the offline game is finished)

## About this project

Stack Seven is an independent hobby project made for learning and for my portfolio. It is not affiliated with any publisher, and it uses no artwork, text or assets from another game. It is inspired by the push-your-luck card game genre, and its animation feel is inspired by the way Balatro handles cards. All code, card art and sound effects here are original.

I built this with Claude (Anthropic's AI assistant) as a pair-programming partner, while learning Expo and TypeScript.

## License

MIT. See [LICENSE](LICENSE).
