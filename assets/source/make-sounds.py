"""Generates every sound effect in assets/sounds/ from scratch: the "wooden table" set.

Nothing here is recorded or sampled. Each sound is built from sine waves and filtered noise, so the sounds are
original and free to use. The theme is a card game on a wooden table:

  - notes are a soft marimba (a sine wave with two quickly fading overtones and a tiny mallet click),
  - cards are a puff of low-passed noise, like a card sliding over felt,
  - knocks and the bust are hollow wood.

Run it from the project folder with:

    python assets/source/make-sounds.py

It needs numpy and scipy (pip install numpy scipy). Change a number below and run it again to adjust a sound.
Every sound is brought to a similar loudness at the end (see LEVEL), so you only decide how a sound is shaped here,
not how loud it is.
"""
import os
import wave

import numpy as np
from scipy import signal

RATE = 44100
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sounds")
rng = np.random.default_rng(11)  # fixed seed: the noise is the same every run

# The notes used below, in Hz.
N = {
    "F3": 174.61, "A3": 220.00, "C4": 261.63, "E4": 329.63, "G4": 392.00, "A4": 440.00,
    "B4": 493.88, "C5": 523.25, "D5": 587.33, "E5": 659.25, "G5": 783.99, "A5": 880.00,
    "B5": 987.77, "C6": 1046.50, "D6": 1174.66,
}


# ---------------------------------------------------------------- building blocks

def t(seconds):
    return np.arange(int(RATE * seconds)) / RATE


def lowpass(x, cutoff, order=2):
    return signal.sosfilt(signal.butter(order, cutoff, "low", fs=RATE, output="sos"), x)


def bandpass(x, low, high, order=2):
    return signal.sosfilt(signal.butter(order, [low, high], "band", fs=RATE, output="sos"), x)


def noise(seconds):
    return rng.standard_normal(int(RATE * seconds))


def place(*parts):
    """Mix sounds together; each part is (start_seconds, samples)."""
    length = max(int(RATE * s) + len(w) for s, w in parts)
    out = np.zeros(length)
    for start, w in parts:
        i = int(RATE * start)
        out[i : i + len(w)] += w
    return out


def voice(freq, seconds, partials, attack=0.003):
    """Sine partials, each (multiple of freq, loudness, how fast it dies away per second)."""
    x = t(seconds)
    y = sum(amp * np.sin(2 * np.pi * freq * mult * x) * np.exp(-decay * x) for mult, amp, decay in partials)
    return y * np.minimum(1.0, x / attack)


# ---------------------------------------------------------------- the wooden instruments

def marimba(freq, seconds=1.0, vel=1.0):
    """A struck wooden bar: the note, a quickly fading overtone about four times higher, and a mallet click."""
    body = voice(freq, seconds, [(1, 1.0, 4.2), (3.93, 0.30, 15), (9.2, 0.05, 34)], attack=0.002)
    n = int(RATE * 0.012)
    body[:n] += bandpass(noise(0.012), 700, 3200) * np.exp(-300 * t(0.012)) * 0.10
    return body * vel


def knock(freq=900, seconds=0.1, vel=1.0):
    """A woodblock: a short pitched tok with a click on the front."""
    x = t(seconds)
    tone = np.sin(2 * np.pi * freq * x) * np.exp(-55 * x)
    click = bandpass(noise(seconds), 400, 2200) * np.exp(-140 * x) * 0.5
    return (tone * 0.8 + click) * vel


def felt_slide(seconds=0.085, bright=2200, vel=1.0):
    """A card sliding over felt: soft low-passed noise with a gentle start, and a faint tap of the table."""
    x = t(seconds)
    hiss = lowpass(noise(seconds), bright, order=4)
    shape = np.minimum(1.0, x / 0.012) * np.exp(-36 * x)
    tap = np.sin(2 * np.pi * 140 * x) * np.exp(-60 * x) * 0.45
    return (hiss * shape * 1.4 + tap) * vel


def thud(seconds=0.5):
    """A dull knock on a wooden table: a low tone that sags a little, and a puff of low rumble."""
    x = t(seconds)
    low = np.sin(2 * np.pi * 120 * x * (1 - 0.5 * x)) * np.exp(-9 * x)
    rumble = lowpass(noise(seconds), 350) * np.exp(-30 * x) * 1.4
    return low + rumble


# ---------------------------------------------------------------- finishing

LEVEL = 0.13                       # how loud a sound is (the RMS of its audible part), for every sound
LEVEL_OF = {"tick": 0.085, "deal": 0.12, "shuffle": 0.11, "timeOut": 0.15}   # the few that differ from the rest
CEILING = 0.92                     # nothing gets louder than this: a gentle limiter, never a hard clip


def audible_rms(x):
    loud = np.abs(x) > 0.02 * np.max(np.abs(x))
    return float(np.sqrt(np.mean(x[loud] ** 2)))


def save(name, samples):
    samples = samples.copy()
    start = int(RATE * 0.0007)
    samples[:start] *= np.linspace(0, 1, start)       # no click at the start
    fade = int(RATE * 0.01)
    samples[-fade:] *= np.linspace(1, 0, fade)        # or at the end
    samples = samples * (LEVEL_OF.get(name, LEVEL) / audible_rms(samples))
    peak = np.max(np.abs(samples))
    if peak > CEILING:
        samples = np.tanh(samples / peak * 1.2) / np.tanh(1.2) * CEILING
    pcm = (samples * 32767).astype("<i2")
    os.makedirs(OUT, exist_ok=True)
    with wave.open(os.path.join(OUT, f"{name}.wav"), "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(RATE)
        f.writeframes(pcm.tobytes())
    print(f"{name}.wav  {len(samples) / RATE:.2f}s  peak {min(peak, CEILING):.2f}")


# ---------------------------------------------------------------- the sounds

# A card is drawn: a card slides over felt.
save("draw", felt_slide())

# The streak: the same slide with a soft marimba note on top that climbs one step for every card you have drawn in
# a row (draw2 is your second card, draw5 your fifth). The steps follow a pentatonic scale, so they always sound
# good together. The seventh card is the Seven Stack run below.
LADDER = [N["C5"], N["D5"], N["E5"], N["G5"]]
for step, freq in enumerate(LADDER, start=2):
    save(f"draw{step}", place((0.0, felt_slide()), (0.0, marimba(freq, 0.3, 0.8))))

# A new round is dealt: a quick flurry of card slides.
save("deal", place(*[(i * 0.07, felt_slide(0.07, vel=0.8 + 0.05 * i)) for i in range(5)]))

# A player stays and banks their points: a wooden clack, then two rising marimba notes.
save("stay", place((0.0, knock(1250, 0.08, 0.9)), (0.0, marimba(N["C5"], 0.6, 0.8)), (0.1, marimba(N["G5"], 0.9, 0.9))))

# A bust: a dull thud on the table, then two low marimba notes stepping down.
save("bust", place((0.0, thud() * 1.4), (0.1, marimba(N["A3"], 0.7, 0.55)), (0.3, marimba(N["F3"], 1.0, 0.55))))

# Time Out: two wooden notes stepping down, like a pause.
save("timeOut", place((0.0, knock(900, 0.07, 0.6)), (0.0, marimba(N["E5"], 0.3, 0.9)), (0.16, marimba(N["B4"], 0.6, 0.9)), (0.16, marimba(N["B4"] / 2, 0.6, 0.35))))

# A Shield saves you: a firm wooden knock with two high marimba notes ringing over it.
save("shield", place((0.0, knock(1600, 0.1, 0.8)), (0.0, marimba(N["G5"], 1.0, 0.9)), (0.06, marimba(N["D6"], 0.8, 0.5))))

# Seven Stack: a rising marimba run that ends on a long, ringing note.
run = [N["C5"], N["D5"], N["E5"], N["G5"], N["A5"]]
parts = [(i * 0.075, marimba(f, 0.35, 0.8)) for i, f in enumerate(run)]
parts += [(5 * 0.075, marimba(N["C6"], 1.2, 1.0)), (5 * 0.075, marimba(N["C5"], 1.2, 0.6))]
save("sevenStack", place(*parts))

# End of a round: two calm falling notes that settle.
save("roundEnd", place((0.0, marimba(N["E5"], 0.9, 0.9)), (0.18, marimba(N["C5"], 1.2, 1.0)), (0.18, marimba(N["C4"], 1.2, 0.5))))

# Winning the game: a marimba roll that speeds up and swells, then a held chord.
roll, at = [], 0.0
for i in range(9):
    roll.append((at, marimba(N["G4"], 0.25, 0.45 + 0.07 * i)))
    at += 0.085 - 0.006 * i
chord = [marimba(f, 1.5, 0.8) for f in (N["C4"], N["E4"], N["G4"], N["C5"])] + [marimba(N["C6"], 1.5, 0.6)]
save("win", place(*roll, *[(at + 0.02 * i, c) for i, c in enumerate(chord)]))

# It is your turn: two soft wooden notes, a rising fourth, like a gentle tap on the table. Easy to hear a lot.
save("yourTurn", place((0.0, marimba(N["E4"], 0.7, 0.85)), (0.16, marimba(N["A4"], 0.9, 1.0))))

# One tick of the turn clock in its last five seconds: a short, dry woodblock tick (quieter than the rest).
save("tick", knock(1700, 0.05, 1.0))

# The deck is shuffled: a riffle. Cards slide past faster and faster as the two halves come together, with a soft
# rustle underneath, then the stack lands with a wooden thud. It lasts as long as the riffle on the screen.
def riffle(flicks=34, first_gap=0.052, last_gap=0.016):
    parts, now = [], 0.0
    for i in range(flicks):
        frac = i / (flicks - 1)
        gap = first_gap + (last_gap - first_gap) * frac          # the gaps shrink
        loud = 0.45 + 0.55 * frac * (0.7 + 0.3 * rng.random())   # and the slides get louder
        parts.append((now, felt_slide(0.03, 2600, loud)))
        now += gap
    return now, parts


def rustle(seconds):
    """Soft, low noise that swells and fades: the body of the shuffle."""
    soft = lowpass(noise(seconds), 1400)
    shape = np.sin(np.pi * np.arange(len(soft)) / len(soft)) ** 1.4
    return soft * shape * 1.5


ends, slides = riffle()
landing = place((0.0, thud(0.3)), (0.0, knock(260, 0.12, 0.6)))
save("shuffle", place((0.0, rustle(ends + 0.05)), *slides, (ends + 0.02, landing * 1.2)))

# The game asks you to pick a player (Time Out, Draw Three, a spare Shield): three quick marimba notes that climb
# like a question. Different from "your turn" (two lower, slower notes) so you can tell them apart with your eyes shut.
save("ask", place((0.0, marimba(N["D5"], 0.3, 0.8)), (0.09, marimba(N["G5"], 0.35, 0.9)), (0.18, marimba(N["B5"], 0.8, 1.0))))
