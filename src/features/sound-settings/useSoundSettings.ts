import { useEffect, useRef, useState } from "react";
import { HowlerAudio, type SoundSettings } from "../../platform/audio.web";

export function useSoundSettings() {
  const [settings, setSettings] = useState<SoundSettings>({ enabled: true, loading: false, error: "" });
  const [audio] = useState(() => new HowlerAudio(setSettings));
  const enabledForSession = useRef(true);

  useEffect(() => {
    audio.setEnabled(enabledForSession.current);
    audio.requestBackground();
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const control = event.target.closest<HTMLElement>("button, a[href], summary");
      if (control?.closest("[inert]") || control?.getAttribute("aria-disabled") === "true"
        || (control instanceof HTMLButtonElement && control.disabled)
        || control?.classList.contains("sound-toggle")) return;
      audio.interact();
      if (control && !control.hasAttribute("data-sound-handled")) audio.play("button");
    };
    const stopWhenHidden = () => {
      if (document.hidden) audio.stopAll();
      else audio.resumeBackground();
    };
    const stopOnPageHide = () => audio.stopAll();
    document.addEventListener("click", onClick, true);
    document.addEventListener("visibilitychange", stopWhenHidden);
    window.addEventListener("pagehide", stopOnPageHide);
    return () => {
      document.removeEventListener("visibilitychange", stopWhenHidden);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("pagehide", stopOnPageHide);
      audio.dispose();
    };
  }, [audio]);

  function toggle() {
    enabledForSession.current = !settings.enabled;
    audio.setEnabled(enabledForSession.current, true);
  }

  return { ...settings, audio, toggle };
}
