import { useCallback, useEffect, useRef, useState } from "react";
import { defaultSettings, Settings } from "../game/settings";
import { loadSettings, saveSettings } from "./storage";

// The saved settings. `loaded` turns true once they have been read from the phone
// (a fraction of a second after launch). `update` changes some of them and saves.
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);
  const latest = useRef(settings);

  useEffect(() => {
    let cancelled = false;
    loadSettings().then((s) => {
      if (cancelled) return;
      latest.current = s;
      setSettings(s);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback((change: Partial<Settings>) => {
    const next = { ...latest.current, ...change };
    latest.current = next;
    setSettings(next);
    saveSettings(next);
  }, []);

  return { settings, loaded, update };
}
