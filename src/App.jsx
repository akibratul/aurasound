import { useEffect, useRef, useState, startTransition } from "react";
import { motion } from "framer-motion";
import { MoonStar, Settings2 } from "lucide-react";
import Controls from "./components/Controls";
import Player from "./components/Player";
import Settings from "./components/Settings";
import { createAmbientEngine } from "./audio/ambientEngine";
import {
  createDefaultSoundVolumes,
  DEFAULT_QUALITY,
  DEFAULT_SCENE,
  getScene,
  getSound,
  MOOD_SCENES,
  SOUND_LIBRARY,
  TIMER_PRESETS,
} from "./lib/soundData";

const STORAGE_KEY = "aurasound-state-v2";
const HISTORY_KEY = "aurasound-history-v2";

function getDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isLateNightHour(date = new Date()) {
  const hour = date.getHours();
  return hour >= 21 || hour < 5;
}

function encodeMix(activeSoundIds, soundVolumes) {
  return activeSoundIds
    .map((soundId) => `${soundId}.${Math.round((soundVolumes[soundId] ?? 0) * 100)}`)
    .join(",");
}

function decodeMix(rawMix) {
  const entries = rawMix.split(",").filter(Boolean);
  const activeSoundIds = [];
  const soundVolumes = {};

  entries.forEach((entry) => {
    const [soundId, rawVolume] = entry.split(".");
    const soundExists = SOUND_LIBRARY.some((sound) => sound.id === soundId);
    const volume = Number(rawVolume);

    if (!soundExists || !Number.isFinite(volume)) {
      return;
    }

    activeSoundIds.push(soundId);
    soundVolumes[soundId] = Math.max(0, Math.min(1, volume / 100));
  });

  return { activeSoundIds, soundVolumes };
}

function createFallbackState(sceneId = DEFAULT_SCENE) {
  const scene = getScene(sceneId);
  return {
    selectedSceneId: scene.id,
    activeSoundIds: [...scene.activeSoundIds],
    primarySoundId: scene.primarySoundId,
    soundVolumes: {
      ...createDefaultSoundVolumes(),
      ...scene.volumes,
    },
    masterVolume: 0.82,
    animationsEnabled: true,
    quality: DEFAULT_QUALITY,
    selectedTimerMinutes: null,
    customTimerMinutes: String(scene.focusMinutes),
    screenshotMode: false,
    resumeReady: false,
    sharedFromLink: false,
  };
}

function parseSharedState() {
  try {
    const params = new URLSearchParams(window.location.search);
    const nextState = {};
    const sceneId = params.get("scene");
    const mix = params.get("mix");
    const screenshotMode = params.get("shot") === "1";

    if (sceneId && MOOD_SCENES.some((scene) => scene.id === sceneId)) {
      nextState.selectedSceneId = sceneId;
    }

    if (mix) {
      const decoded = decodeMix(mix);

      if (decoded.activeSoundIds.length > 0) {
        nextState.activeSoundIds = decoded.activeSoundIds;
        nextState.soundVolumes = decoded.soundVolumes;
        nextState.primarySoundId = decoded.activeSoundIds[0];
      }
    }

    if (screenshotMode) {
      nextState.screenshotMode = true;
    }

    if (Object.keys(nextState).length > 0) {
      nextState.sharedFromLink = true;
    }

    return nextState;
  } catch (error) {
    return {};
  }
}

function loadStoredState() {
  const sharedState = parseSharedState();
  const fallback = createFallbackState(sharedState.selectedSceneId ?? DEFAULT_SCENE);

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return {
        ...fallback,
        ...sharedState,
        soundVolumes: {
          ...fallback.soundVolumes,
          ...(sharedState.soundVolumes ?? {}),
        },
      };
    }

    const parsed = JSON.parse(raw);
    const selectedSceneId =
      typeof parsed.selectedSceneId === "string" && MOOD_SCENES.some((scene) => scene.id === parsed.selectedSceneId)
        ? parsed.selectedSceneId
        : fallback.selectedSceneId;
    const sceneFallback = createFallbackState(selectedSceneId);
    const activeSoundIds =
      Array.isArray(parsed.activeSoundIds) && parsed.activeSoundIds.length > 0
        ? parsed.activeSoundIds.filter((soundId) => SOUND_LIBRARY.some((sound) => sound.id === soundId))
        : sceneFallback.activeSoundIds;

    return {
      ...sceneFallback,
      ...parsed,
      ...sharedState,
      selectedSceneId: sharedState.selectedSceneId ?? selectedSceneId,
      activeSoundIds: sharedState.activeSoundIds ?? activeSoundIds,
      primarySoundId:
        sharedState.primarySoundId ??
        (SOUND_LIBRARY.some((sound) => sound.id === parsed.primarySoundId)
          ? parsed.primarySoundId
          : activeSoundIds[0] ?? sceneFallback.primarySoundId),
      soundVolumes: {
        ...sceneFallback.soundVolumes,
        ...(parsed.soundVolumes ?? {}),
        ...(sharedState.soundVolumes ?? {}),
      },
      screenshotMode: Boolean(sharedState.screenshotMode ?? parsed.screenshotMode),
      resumeReady: !sharedState.sharedFromLink && Boolean(parsed.wasPlaying),
      sharedFromLink: Boolean(sharedState.sharedFromLink),
    };
  } catch (error) {
    return {
      ...fallback,
      ...sharedState,
      soundVolumes: {
        ...fallback.soundVolumes,
        ...(sharedState.soundVolumes ?? {}),
      },
    };
  }
}

function loadHistory() {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
}

function formatFocusTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return `${Math.max(1, Math.floor(totalSeconds / 60))}m`;
}

function formatClock(totalSeconds) {
  const safeSeconds = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getStreakCount(history) {
  let streak = 0;
  const pointer = new Date();
  pointer.setHours(0, 0, 0, 0);

  while (true) {
    const key = getDayKey(pointer);

    if ((history[key] ?? 0) <= 0) {
      break;
    }

    streak += 1;
    pointer.setDate(pointer.getDate() - 1);
  }

  return streak;
}

function getSuggestedSceneId(isLateNight) {
  if (isLateNight) {
    const hour = new Date().getHours();
    return hour >= 23 || hour < 3 ? "midnight-isolation" : "rainy-night-focus";
  }

  const hour = new Date().getHours();
  return hour < 15 ? "cozy-cafe-study" : "forest-meditation";
}

async function copyShareUrl(url, title, text) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (error) {
      if (error?.name === "AbortError") {
        return false;
      }
    }
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return true;
  }

  window.prompt("Copy your AuraSound link", url);
  return true;
}

export default function App() {
  const initialStateRef = useRef(loadStoredState());
  const initialState = initialStateRef.current;
  const isLateNight = isLateNightHour();
  const engineRef = useRef(null);
  const [selectedSceneId, setSelectedSceneId] = useState(initialState.selectedSceneId);
  const [activeSoundIds, setActiveSoundIds] = useState(initialState.activeSoundIds);
  const [primarySoundId, setPrimarySoundId] = useState(initialState.primarySoundId);
  const [soundVolumes, setSoundVolumes] = useState(initialState.soundVolumes);
  const [masterVolume, setMasterVolume] = useState(initialState.masterVolume);
  const [animationsEnabled, setAnimationsEnabled] = useState(initialState.animationsEnabled);
  const [quality, setQuality] = useState(initialState.quality);
  const [isPlaying, setIsPlaying] = useState(false);
  const [focusSessionActive, setFocusSessionActive] = useState(false);
  const [focusSessionStartedAt, setFocusSessionStartedAt] = useState(null);
  const [selectedTimerMinutes, setSelectedTimerMinutes] = useState(initialState.selectedTimerMinutes);
  const [customTimerMinutes, setCustomTimerMinutes] = useState(initialState.customTimerMinutes);
  const [timerStartedAt, setTimerStartedAt] = useState(null);
  const [timerEndAt, setTimerEndAt] = useState(null);
  const [timerNow, setTimerNow] = useState(Date.now());
  const [timerOpen, setTimerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sessionHistory, setSessionHistory] = useState(() => loadHistory());
  const [statusMessage, setStatusMessage] = useState(
    initialState.sharedFromLink
      ? "Shared mood scene loaded. Press play when you're ready."
      : initialState.resumeReady
        ? "Your last space is waiting. Press play to return."
        : "",
  );
  const [shareStatus, setShareStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [motivationalIndex, setMotivationalIndex] = useState(0);
  const [screenshotMode, setScreenshotMode] = useState(initialState.screenshotMode);

  const selectedScene = getScene(selectedSceneId);
  const featuredSound = getSound(primarySoundId ?? selectedScene.primarySoundId);
  const suggestedScene = getScene(getSuggestedSceneId(isLateNight));
  const todaySeconds = sessionHistory[getDayKey()] ?? 0;
  const streakCount = getStreakCount(sessionHistory);
  const timerDurationMs = timerStartedAt && timerEndAt ? timerEndAt - timerStartedAt : 0;
  const timerRemainingMs = timerEndAt ? Math.max(0, timerEndAt - timerNow) : 0;
  const timerProgress =
    timerEndAt && timerDurationMs > 0 ? Math.max(0, Math.min(1, 1 - timerRemainingMs / timerDurationMs)) : 0;
  const sessionClockLabel = timerEndAt
    ? `Focus ${formatClock(timerRemainingMs / 1000)}`
    : focusSessionStartedAt
      ? `Focus ${formatClock((timerNow - focusSessionStartedAt) / 1000)}`
      : "Focus";
  const visualizerIntensity =
    activeSoundIds.reduce((total, soundId) => total + (soundVolumes[soundId] ?? 0), 0) /
    Math.max(activeSoundIds.length, 1);
  const motivationalText = selectedScene.mantra[motivationalIndex % selectedScene.mantra.length];

  useEffect(() => {
    engineRef.current = createAmbientEngine();

    return () => {
      void engineRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.animations = animationsEnabled ? "on" : "off";
    document.documentElement.dataset.night = isLateNight ? "late" : "day";
    document.documentElement.dataset.screenshot = screenshotMode ? "on" : "off";
  }, [animationsEnabled, isLateNight, screenshotMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          selectedSceneId,
          activeSoundIds,
          primarySoundId,
          soundVolumes,
          masterVolume,
          animationsEnabled,
          quality,
          selectedTimerMinutes,
          customTimerMinutes,
          screenshotMode,
          wasPlaying: isPlaying,
        }),
      );
    } catch (error) {
      // Ignore storage failures in restricted contexts.
    }
  }, [
    selectedSceneId,
    activeSoundIds,
    primarySoundId,
    soundVolumes,
    masterVolume,
    animationsEnabled,
    quality,
    selectedTimerMinutes,
    customTimerMinutes,
    screenshotMode,
    isPlaying,
  ]);

  useEffect(() => {
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(sessionHistory));
    } catch (error) {
      // Ignore storage failures in restricted contexts.
    }
  }, [sessionHistory]);

  useEffect(() => {
    if (!engineRef.current) {
      return undefined;
    }

    let cancelled = false;

    async function syncAudio() {
      try {
        await engineRef.current.applyState({
          activeSoundIds,
          soundVolumes,
          masterVolume,
          playing: isPlaying && activeSoundIds.length > 0,
          quality,
        });

        if (!cancelled) {
          setErrorMessage("");
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Playback could not start.");
          setIsPlaying(false);
          setFocusSessionActive(false);
        }
      }
    }

    void syncAudio();

    return () => {
      cancelled = true;
    };
  }, [activeSoundIds, soundVolumes, masterVolume, isPlaying, quality]);

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setSessionHistory((previous) => {
        const todayKey = getDayKey();
        return {
          ...previous,
          [todayKey]: (previous[todayKey] ?? 0) + 1,
        };
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (!timerEndAt) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      const now = Date.now();
      setTimerNow(now);

      if (timerEndAt <= now) {
        window.clearInterval(intervalId);
        setTimerEndAt(null);
        setTimerStartedAt(null);
        setIsPlaying(false);
        setFocusSessionActive(false);
        setStatusMessage("Well done. You stayed with it.");
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [timerEndAt]);

  useEffect(() => {
    if (!focusSessionActive && !isPlaying) {
      setTimerNow(Date.now());
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTimerNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [focusSessionActive, isPlaying]);

  useEffect(() => {
    if (!isPlaying && !focusSessionActive) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setMotivationalIndex((previous) => previous + 1);
    }, 7000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [focusSessionActive, isPlaying, selectedSceneId]);

  useEffect(() => {
    if (!statusMessage || errorMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setStatusMessage("");
    }, 4800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [statusMessage, errorMessage]);

  useEffect(() => {
    if (!shareStatus) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setShareStatus("");
    }, 4200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [shareStatus]);

  function startTimer(minutes) {
    if (!minutes || minutes <= 0) {
      setTimerStartedAt(null);
      setTimerEndAt(null);
      setTimerNow(Date.now());
      return;
    }

    const now = Date.now();
    setTimerStartedAt(now);
    setTimerEndAt(now + minutes * 60 * 1000);
    setTimerNow(now);
  }

  function stopTimer() {
    setTimerStartedAt(null);
    setTimerEndAt(null);
    setTimerNow(Date.now());
  }

  function applyScene(sceneId, reason = "") {
    const scene = getScene(sceneId);

    startTransition(() => {
      setSelectedSceneId(scene.id);
      setPrimarySoundId(scene.primarySoundId);
      setActiveSoundIds([...scene.activeSoundIds]);
      setSoundVolumes((previous) => ({
        ...previous,
        ...scene.volumes,
      }));
      setCustomTimerMinutes(String(scene.focusMinutes));
      if (reason) {
        setStatusMessage(reason);
      }
    });
  }

  function endFocusSession(message) {
    setFocusSessionActive(false);
    setFocusSessionStartedAt(null);
    setIsPlaying(false);
    stopTimer();
    setStatusMessage(message);
  }

  function handlePlayPause() {
    setStatusMessage("");
    setTimerOpen(false);

    if (isPlaying) {
      if (focusSessionActive) {
        endFocusSession("Well done. You stayed with it.");
      } else {
        setIsPlaying(false);
        stopTimer();
        setStatusMessage("The room is still here when you return.");
      }
      return;
    }

    if (activeSoundIds.length === 0) {
      applyScene(selectedSceneId);
    }

    setIsPlaying(true);

    if (selectedTimerMinutes) {
      startTimer(selectedTimerMinutes);
    }
  }

  function handleToggleFocusSession() {
    if (focusSessionActive) {
      endFocusSession("Well done. You stayed with it.");
      return;
    }

    if (activeSoundIds.length === 0) {
      applyScene(selectedSceneId);
    }

    const focusMinutes = selectedTimerMinutes ?? selectedScene.focusMinutes;
    setFocusSessionActive(true);
    setFocusSessionStartedAt(Date.now());
    setIsPlaying(true);
    startTimer(focusMinutes);
    setStatusMessage("Focus session started. Stay here.");
  }

  function handleToggleSound(soundId) {
    setStatusMessage("");
    const exists = activeSoundIds.includes(soundId);

    if (exists) {
      const nextSoundIds = activeSoundIds.filter((id) => id !== soundId);
      setActiveSoundIds(nextSoundIds);

      if (primarySoundId === soundId) {
        setPrimarySoundId(nextSoundIds[0] ?? selectedScene.primarySoundId);
      }

      if (nextSoundIds.length === 0) {
        setIsPlaying(false);
        setFocusSessionActive(false);
        setFocusSessionStartedAt(null);
        stopTimer();
        setStatusMessage("The mix is clear now.");
      }

      return;
    }

    setActiveSoundIds([...activeSoundIds, soundId]);
    setPrimarySoundId(soundId);

    if (soundVolumes[soundId] == null) {
      setSoundVolumes((previous) => ({
        ...previous,
        [soundId]: getSound(soundId).defaultVolume,
      }));
    }
  }

  function handleSelectSound(soundId) {
    setPrimarySoundId(soundId);

    if (!activeSoundIds.includes(soundId)) {
      setActiveSoundIds([...activeSoundIds, soundId]);
    }
  }

  function handleSoundVolumeChange(soundId, value) {
    setSoundVolumes((previous) => ({
      ...previous,
      [soundId]: value,
    }));
  }

  function cycleFeaturedSound(direction) {
    const currentIndex = SOUND_LIBRARY.findIndex((sound) => sound.id === primarySoundId);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextSound = SOUND_LIBRARY[(safeIndex + direction + SOUND_LIBRARY.length) % SOUND_LIBRARY.length];

    setPrimarySoundId(nextSound.id);

    if (activeSoundIds.length <= 1) {
      setActiveSoundIds([nextSound.id]);
      return;
    }

    if (!activeSoundIds.includes(nextSound.id)) {
      setActiveSoundIds([...activeSoundIds, nextSound.id]);
    }
  }

  function shiftScene(direction) {
    const currentIndex = MOOD_SCENES.findIndex((scene) => scene.id === selectedSceneId);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextScene = MOOD_SCENES[(safeIndex + direction + MOOD_SCENES.length) % MOOD_SCENES.length];
    applyScene(nextScene.id, `${nextScene.label} loaded.`);
  }

  function handleSelectTimer(minutes) {
    setSelectedTimerMinutes(minutes);
    setTimerOpen(false);

    if (!minutes) {
      stopTimer();
      return;
    }

    if (isPlaying || focusSessionActive) {
      startTimer(minutes);
    }
  }

  function handleApplyCustomTimer() {
    const minutes = Number(customTimerMinutes);

    if (!Number.isFinite(minutes) || minutes <= 0) {
      return;
    }

    setSelectedTimerMinutes(minutes);
    setTimerOpen(false);

    if (isPlaying || focusSessionActive) {
      startTimer(minutes);
    }
  }

  async function handleShareScene() {
    const url = new URL(window.location.href);
    url.searchParams.set("scene", selectedSceneId);
    url.searchParams.set("mix", encodeMix(activeSoundIds, soundVolumes));

    if (screenshotMode) {
      url.searchParams.set("shot", "1");
    } else {
      url.searchParams.delete("shot");
    }

    const shared = await copyShareUrl(url.toString(), "AuraSound", selectedScene.shareCaption);

    if (shared) {
      setShareStatus("Mood scene link ready. Share the calm.");
    }
  }

  function handleToggleScreenshotMode() {
    const nextValue = !screenshotMode;
    setScreenshotMode(nextValue);
    setStatusMessage(nextValue ? "Screenshot mode on. The interface stepped back." : "Screenshot mode off.");
  }

  function handleReset() {
    const defaults = createFallbackState();

    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      // Ignore storage failures in restricted contexts.
    }

    setSelectedSceneId(defaults.selectedSceneId);
    setActiveSoundIds(defaults.activeSoundIds);
    setPrimarySoundId(defaults.primarySoundId);
    setSoundVolumes(defaults.soundVolumes);
    setMasterVolume(defaults.masterVolume);
    setAnimationsEnabled(defaults.animationsEnabled);
    setQuality(defaults.quality);
    setSelectedTimerMinutes(defaults.selectedTimerMinutes);
    setCustomTimerMinutes(defaults.customTimerMinutes);
    setScreenshotMode(false);
    setSessionHistory({});
    setFocusSessionActive(false);
    setFocusSessionStartedAt(null);
    setIsPlaying(false);
    stopTimer();
    setSettingsOpen(false);
    setStatusMessage("Session reset. A quieter beginning is ready.");
  }

  const backgroundDuration =
    (focusSessionActive ? 26 : 18) * (isLateNight ? 1.35 : 1) * (screenshotMode ? 0.9 : 1);
  const backgroundStyle = {
    backgroundImage: `
      radial-gradient(circle at 18% 18%, ${featuredSound.glow}, transparent 28%),
      radial-gradient(circle at 82% 72%, ${selectedScene.tint}, transparent 26%),
      linear-gradient(145deg, ${selectedScene.background[0]}, ${selectedScene.background[1]}, ${selectedScene.background[2]})
    `,
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--bg)] text-[color:var(--text)]">
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={backgroundStyle}
        animate={animationsEnabled ? { backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] } : undefined}
        transition={
          animationsEnabled
            ? {
                duration: backgroundDuration,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }
            : undefined
        }
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 noise-overlay" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(4,6,10,0.15),rgba(4,6,10,0.45))]" />

      <header
        className={[
          "relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-4 pt-5 sm:px-6 lg:px-8",
          screenshotMode ? "opacity-70" : "",
        ].join(" ")}
      >
        <div className="glass-panel neo-surface flex items-center gap-3 rounded-full border border-white/10 px-4 py-3">
          <div
            className="h-9 w-9 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${featuredSound.accent}, ${selectedScene.background[0]})`,
              boxShadow: `0 0 28px ${featuredSound.glow}`,
            }}
          />
          <div>
            <p className="text-sm font-semibold tracking-tight">AuraSound</p>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Made with AuraSound
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isLateNight ? (
            <span className="glass-panel neo-surface hidden items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)] sm:flex">
              <MoonStar className="h-3.5 w-3.5" />
              Night tuned
            </span>
          ) : null}

          {!screenshotMode ? (
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="glass-panel neo-surface ripple-button rounded-full border border-white/10 p-3 text-[color:var(--text)]"
              aria-label="Open settings"
            >
              <Settings2 className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </header>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-40 pt-24 sm:px-6 lg:px-8">
        <Player
          sounds={SOUND_LIBRARY}
          moodScenes={MOOD_SCENES}
          activeSoundIds={activeSoundIds}
          soundVolumes={soundVolumes}
          featuredSound={featuredSound}
          selectedScene={selectedScene}
          suggestedScene={suggestedScene}
          isPlaying={isPlaying}
          animationsEnabled={animationsEnabled}
          isLateNight={isLateNight}
          focusSessionActive={focusSessionActive}
          focusSessionLabel={sessionClockLabel}
          todayFocus={`You've focused ${formatFocusTime(todaySeconds)} today`}
          streakCount={streakCount}
          motivationalText={motivationalText}
          statusMessage={errorMessage || statusMessage}
          shareStatus={shareStatus}
          screenshotMode={screenshotMode}
          visualizerIntensity={visualizerIntensity}
          onToggleSound={handleToggleSound}
          onSelectSound={handleSelectSound}
          onSoundVolumeChange={handleSoundVolumeChange}
          onSelectScene={(sceneId) => applyScene(sceneId, `${getScene(sceneId).label} loaded.`)}
          onShiftScene={shiftScene}
          onApplySuggestedScene={() => applyScene(suggestedScene.id, `${suggestedScene.label} suggested.`)}
          onToggleFocusSession={handleToggleFocusSession}
          onShareScene={handleShareScene}
          onToggleScreenshotMode={handleToggleScreenshotMode}
        />
      </main>

      <Controls
        featuredSound={featuredSound}
        activeSoundIds={activeSoundIds}
        isPlaying={isPlaying}
        masterVolume={masterVolume}
        onVolumeChange={setMasterVolume}
        onPlayPause={handlePlayPause}
        onPrevious={() => cycleFeaturedSound(-1)}
        onNext={() => cycleFeaturedSound(1)}
        timerOpen={timerOpen}
        onToggleTimerPanel={() => setTimerOpen((previous) => !previous)}
        selectedTimerMinutes={selectedTimerMinutes}
        customTimerMinutes={customTimerMinutes}
        onCustomTimerChange={setCustomTimerMinutes}
        onApplyCustomTimer={handleApplyCustomTimer}
        onSelectTimer={handleSelectTimer}
        timerPresets={TIMER_PRESETS}
        timerRemainingSeconds={timerRemainingMs / 1000}
        timerProgress={timerProgress}
        timerActive={Boolean(timerEndAt)}
        focusSessionActive={focusSessionActive}
        sessionClockLabel={sessionClockLabel}
        screenshotMode={screenshotMode}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <Settings
        open={settingsOpen}
        animationsEnabled={animationsEnabled}
        quality={quality}
        onClose={() => setSettingsOpen(false)}
        onAnimationsChange={setAnimationsEnabled}
        onQualityChange={setQuality}
        onReset={handleReset}
      />
    </div>
  );
}
