import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { useCallback, useEffect, useRef } from "react";
import { Cue, SoundName } from "../game/sounds";

// One file per sound, made by assets/source/make-sounds.py.
const FILES: Record<SoundName, number> = {
  draw: require("../../assets/sounds/draw.wav"),
  draw2: require("../../assets/sounds/draw2.wav"),
  draw3: require("../../assets/sounds/draw3.wav"),
  draw4: require("../../assets/sounds/draw4.wav"),
  draw5: require("../../assets/sounds/draw5.wav"),
  deal: require("../../assets/sounds/deal.wav"),
  stay: require("../../assets/sounds/stay.wav"),
  bust: require("../../assets/sounds/bust.wav"),
  timeOut: require("../../assets/sounds/timeOut.wav"),
  shield: require("../../assets/sounds/shield.wav"),
  sevenStack: require("../../assets/sounds/sevenStack.wav"),
  roundEnd: require("../../assets/sounds/roundEnd.wav"),
  win: require("../../assets/sounds/win.wav"),
  yourTurn: require("../../assets/sounds/yourTurn.wav"),
  tick: require("../../assets/sounds/tick.wav"),
  shuffle: require("../../assets/sounds/shuffle.wav"),
  ask: require("../../assets/sounds/ask.wav"),
};

// Some sounds are made quieter so the frequent ones (a card flick) don't tire the ear.
const VOLUME: Record<SoundName, number> = {
  draw: 0.7, draw2: 0.7, draw3: 0.7, draw4: 0.7, draw5: 0.7,
  deal: 0.7, stay: 0.6, bust: 0.9, timeOut: 0.8,
  shield: 0.8, sevenStack: 0.9, roundEnd: 0.7, win: 1,
  yourTurn: 0.8, tick: 0.5, shuffle: 0.85, ask: 0.8,
};

// The sounds that belong to the turn alert: your turn has started, the clock is running down, the game is
// waiting for you to pick a player. They follow the "Turn alert sound" setting, not the "Sound effects" one,
// so a player can have one without the other.
const ALERTS: SoundName[] = ["yourTurn", "tick", "ask"];

// Sound for the game. `effects` is the Sound effects setting, `alerts` the Turn alert sound setting.
// `play` plays one sound; `playCues` plays a list of sounds at their times.
export function useSounds(effects: boolean, alerts: boolean) {
  // Each sound gets its own player, so sounds can overlap (a flick during a chime).
  // The hooks always run in the same order, which is what React requires.
  const players = {
    draw: useAudioPlayer(FILES.draw),
    draw2: useAudioPlayer(FILES.draw2),
    draw3: useAudioPlayer(FILES.draw3),
    draw4: useAudioPlayer(FILES.draw4),
    draw5: useAudioPlayer(FILES.draw5),
    deal: useAudioPlayer(FILES.deal),
    stay: useAudioPlayer(FILES.stay),
    bust: useAudioPlayer(FILES.bust),
    timeOut: useAudioPlayer(FILES.timeOut),
    shield: useAudioPlayer(FILES.shield),
    sevenStack: useAudioPlayer(FILES.sevenStack),
    roundEnd: useAudioPlayer(FILES.roundEnd),
    win: useAudioPlayer(FILES.win),
    yourTurn: useAudioPlayer(FILES.yourTurn),
    tick: useAudioPlayer(FILES.tick),
    shuffle: useAudioPlayer(FILES.shuffle),
    ask: useAudioPlayer(FILES.ask),
  };

  // Always read the newest values, so `play` can keep the same identity between renders.
  const latest = useRef({ players, effects, alerts });
  latest.current = { players, effects, alerts };

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Play even when the phone's ringer is on silent only if the player asked for sound
    // in the app; mix with other audio (music, a podcast) instead of stopping it.
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: "mixWithOthers" }).catch(() => {});
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const play = useCallback((sound: SoundName) => {
    const { players: p, effects: fx, alerts: al } = latest.current;
    if (!(ALERTS.includes(sound) ? al : fx)) return;
    // A broken sound must never break the game, so every call swallows errors.
    try {
      const player = p[sound];
      player.volume = VOLUME[sound];
      player.seekTo(0).catch(() => {});
      player.play();
    } catch {
      // ignore
    }
  }, []);

  const playCues = useCallback(
    (cues: Cue[]) => {
      for (const cue of cues) {
        if (cue.at <= 0) play(cue.sound);
        else timers.current.push(setTimeout(() => play(cue.sound), cue.at));
      }
    },
    [play]
  );

  return { play, playCues };
}
