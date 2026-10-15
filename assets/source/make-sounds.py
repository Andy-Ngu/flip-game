"""Generates every sound effect in assets/sounds/ from scratch.

Nothing here is recorded or sampled: each sound is built from sine waves and noise, so
the sounds are original and free to use. Run it from the project folder with:

    python assets/source/make-sounds.py

It needs numpy (pip install numpy). Change a number below and run it again to adjust a sound.
"""
import os
import wave

import numpy as np

RATE = 32000
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sounds")
rng = np.random.default_rng(7)  # fixed seed: the noise is the same every run


def t(seconds):
    return np.arange(int(RATE * seconds)) / RATE


def env(n, attack=0.004, decay=8.0):
    """Quick fade in, then an exponential fade out. `decay` is higher for shorter sounds."""
    x = np.arange(n) / RATE
    a = np.minimum(1.0, x / attack)
    return a * np.exp(-decay * x)


def tone(freq, seconds, decay=8.0, partials=((1, 1.0),), attack=0.004):
    x = t(seconds)
    wave_ = sum(amp * np.sin(2 * np.pi * freq * mult * x) for mult, amp in partials)
    return wave_ * env(len(x), attack, decay)


def glide(f0, f1, seconds, decay=5.0, partials=((1, 1.0), (2, 0.35), (3, 0.15))):
    x = t(seconds)
    freq = f0 * (f1 / f0) ** (x / seconds)
    phase = 2 * np.pi * np.cumsum(freq) / RATE
    wave_ = sum(amp * np.sin(phase * mult) for mult, amp in partials)
    return wave_ * env(len(x), 0.006, decay)


def noise(seconds, decay=60.0):
    """A short burst of hiss that fades out quickly."""
    x = rng.standard_normal(int(RATE * seconds))
    hp = np.concatenate([[0.0], np.diff(x)])  # a crude high-pass: keeps the hiss, drops the rumble
    return hp * env(len(hp), 0.001, decay)


def place(*parts):
    """Mix sounds together; each part is (start_seconds, samples)."""
    length = max(int(RATE * s) + len(w) for s, w in parts)
    out = np.zeros(length)
    for start, w in parts:
        i = int(RATE * start)
        out[i : i + len(w)] += w
    return out


def save(name, samples, peak=0.8):
    samples = samples / (np.max(np.abs(samples)) or 1.0) * peak
    fade = int(RATE * 0.006)
    samples[-fade:] *= np.linspace(1, 0, fade)  # no click at the end
    pcm = (samples * 32767).astype("<i2")
    os.makedirs(OUT, exist_ok=True)
    with wave.open(os.path.join(OUT, f"{name}.wav"), "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(RATE)
        f.writeframes(pcm.tobytes())
    print(f"{name}.wav  {len(samples) / RATE:.2f}s")


BELL = ((1, 1.0), (2.76, 0.45), (5.4, 0.2))   # partials that make a struck-metal "ting"
SOFT = ((1, 1.0), (2, 0.3), (3, 0.1))          # a gentle, rounded tone


def flick(length=0.075):
    """One card sliding: a puff of hiss with a tiny low knock under it."""
    return place((0.0, noise(length, decay=55)), (0.0, tone(170, 0.05, decay=60) * 0.5))


# A card is drawn.
save("draw", flick(), peak=0.7)

# A new round is dealt: a quick flurry of flicks.
save("deal", place(*[(i * 0.07, flick(0.06) * (0.8 + 0.05 * i)) for i in range(5)]), peak=0.7)

# A player stays and banks their points: two soft rising dings.
save("stay", place((0.0, tone(784, 0.5, 7, SOFT)), (0.09, tone(1047, 0.6, 6, SOFT))), peak=0.7)

# A bust: a falling "womp" with a snap at the start.
save("bust", place((0.0, glide(300, 80, 0.55, decay=4.5)), (0.0, noise(0.05, decay=70) * 0.6)), peak=0.85)

# Time Out: two blips stepping down, like a pause button.
save("timeOut", place((0.0, tone(660, 0.16, 14, SOFT)), (0.17, tone(494, 0.34, 9, SOFT)), (0.17, tone(247, 0.34, 9, SOFT) * 0.5)), peak=0.75)

# A Shield saves you: a bright metallic ting.
save("shield", place((0.0, tone(1568, 0.7, 6, BELL)), (0.0, tone(784, 0.5, 8, SOFT) * 0.3)), peak=0.75)

# Seven Stack: a rising arpeggio that ends on a long, shimmering note.
notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]
parts = [(i * 0.085, tone(f, 0.28, 9, SOFT)) for i, f in enumerate(notes[:-1])]
parts.append((4 * 0.085, tone(notes[-1], 1.0, 3.2, BELL) + tone(notes[-1] / 2, 1.0, 3.2, SOFT) * 0.5))
save("sevenStack", place(*parts), peak=0.8)

# End of a round: two calm bell notes.
save("roundEnd", place((0.0, tone(783.99, 0.7, 5.5, BELL)), (0.16, tone(1046.5, 0.9, 4.5, BELL))), peak=0.7)

# Winning the game: a quick climb, then a held major chord.
climb = [(i * 0.1, tone(f, 0.3, 8, SOFT)) for i, f in enumerate([392.0, 523.25, 659.25, 783.99])]
chord = [tone(f, 1.6, 2.4, BELL) for f in (523.25, 659.25, 783.99, 1046.5)]
save("win", place(*climb, (0.42, sum(chord) / 2.0)), peak=0.85)
