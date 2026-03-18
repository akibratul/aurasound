import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  CloudMoon,
  Flame,
  PlayCircle,
  Share2,
  Sparkles,
  Waves,
} from "lucide-react";
import SoundCard from "./SoundCard";
import Visualizer from "./Visualizer";

export default function Player({
  sounds,
  moodScenes,
  activeSoundIds,
  soundVolumes,
  featuredSound,
  selectedScene,
  suggestedScene,
  isPlaying,
  animationsEnabled,
  isLateNight,
  focusSessionActive,
  focusSessionLabel,
  todayFocus,
  streakCount,
  motivationalText,
  statusMessage,
  shareStatus,
  screenshotMode,
  visualizerIntensity,
  onToggleSound,
  onSelectSound,
  onSoundVolumeChange,
  onSelectScene,
  onShiftScene,
  onApplySuggestedScene,
  onToggleFocusSession,
  onShareScene,
  onToggleScreenshotMode,
}) {
  const touchStartRef = useRef(0);
  const SceneIcon = selectedScene.icon;
  const FeaturedIcon = featuredSound.icon;

  function handleTouchStart(event) {
    touchStartRef.current = event.touches[0]?.clientX ?? 0;
  }

  function handleTouchEnd(event) {
    const endX = event.changedTouches[0]?.clientX ?? 0;
    const delta = endX - touchStartRef.current;

    if (Math.abs(delta) < 48) {
      return;
    }

    onShiftScene(delta < 0 ? 1 : -1);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6">
      <motion.section
        initial={animationsEnabled ? { opacity: 0, y: 20, filter: "blur(8px)" } : false}
        animate={animationsEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="glass-panel neo-surface relative overflow-hidden rounded-[40px] border border-white/12 px-5 py-6 sm:px-7 lg:px-10 lg:py-8"
      >
        <div className="noise-overlay pointer-events-none absolute inset-0" />
        <div
          className="pointer-events-none absolute -left-16 top-0 h-72 w-72 rounded-full blur-3xl"
          style={{ background: featuredSound.glow }}
        />
        <div
          className="pointer-events-none absolute bottom-0 right-[-4rem] h-72 w-72 rounded-full blur-3xl"
          style={{ background: selectedScene.tint }}
        />

        <div className="relative grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                AuraSound
              </span>
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                {isLateNight ? "Late Night Aware" : "Alive and Focused"}
              </span>
              {focusSessionActive ? (
                <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--text)]">
                  Focus Session {focusSessionLabel}
                </span>
              ) : null}
            </div>

            <div className="mt-6 max-w-3xl">
              <h1 className="text-4xl font-semibold tracking-[-0.08em] text-gradient sm:text-6xl lg:text-7xl">
                AuraSound
              </h1>
              <p className="mt-3 text-lg text-[color:var(--muted-strong)] sm:text-xl">
                Your mind deserves better silence.
              </p>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
                A living focus and mood space for work, rest, and emotional clarity. Mix ambiences, step into
                handcrafted scenes, and let the interface soften around what matters.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onApplySuggestedScene}
                className="ripple-button rounded-full border border-white/12 bg-white/10 px-4 py-2.5 text-sm font-medium text-[color:var(--text)] transition hover:bg-white/14"
              >
                {isLateNight ? "Suggested tonight:" : "Try this:"} {suggestedScene.label}
              </button>
              <span className="rounded-full border border-white/8 bg-white/5 px-4 py-2.5 text-sm text-[color:var(--muted)]">
                No autoplay. Just a gentle nudge.
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <motion.button
                type="button"
                whileTap={animationsEnabled ? { scale: 0.98 } : undefined}
                onClick={onToggleFocusSession}
                className="ripple-button flex items-center gap-3 rounded-full border border-white/14 bg-white/12 px-5 py-3 text-sm font-semibold text-[color:var(--text)] shadow-soft transition hover:bg-white/16"
              >
                <PlayCircle className="h-4 w-4" />
                {focusSessionActive ? "End Focus Session" : "Start Focus Session"}
              </motion.button>

              <button
                type="button"
                onClick={onShareScene}
                className="ripple-button flex items-center gap-3 rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-medium text-[color:var(--text)] transition hover:bg-white/10"
              >
                <Share2 className="h-4 w-4" />
                Share your mood scene
              </button>

              <button
                type="button"
                onClick={onToggleScreenshotMode}
                className="ripple-button flex items-center gap-3 rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-medium text-[color:var(--text)] transition hover:bg-white/10"
              >
                <Camera className="h-4 w-4" />
                {screenshotMode ? "Exit Screenshot Mode" : "Screenshot Mode"}
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Today
                </p>
                <p className="mt-1 text-sm font-semibold text-[color:var(--text)]">{todayFocus}</p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Streak
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[color:var(--text)]">
                  <Flame className="h-4 w-4" />
                  {streakCount} day{streakCount === 1 ? "" : "s"}
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Mantra
                </p>
                <p className="mt-1 text-sm font-semibold text-[color:var(--text)]">{motivationalText}</p>
              </div>
            </div>

            <AnimatePresence>
              {statusMessage ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-5 max-w-2xl rounded-[24px] border border-white/10 bg-white/8 px-4 py-3 text-sm text-[color:var(--muted-strong)]"
                >
                  {statusMessage}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {shareStatus ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 max-w-2xl rounded-[24px] border border-white/10 bg-white/8 px-4 py-3 text-sm text-[color:var(--muted-strong)]"
                >
                  {shareStatus}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="relative">
            <div
              className="glass-panel relative overflow-hidden rounded-[38px] border border-white/12 p-4 shadow-glow"
              style={{
                backgroundImage: `radial-gradient(circle at 15% 20%, ${featuredSound.glow}, transparent 36%), linear-gradient(145deg, ${selectedScene.background[0]}, ${selectedScene.background[1]}, ${selectedScene.background[2]})`,
              }}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_52%)]" />
              <div className="relative">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-[26px] border border-white/14 bg-white/10 p-4">
                      <SceneIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
                        Active mood scene
                      </p>
                      <h2 className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-white">
                        {selectedScene.label}
                      </h2>
                    </div>
                  </div>

                  <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                    {featuredSound.mood}
                  </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-[30px] border border-white/10 bg-black/10">
                  <div className="h-[320px] sm:h-[380px]">
                    <Visualizer
                      featuredSound={featuredSound}
                      sceneTint={selectedScene.tint}
                      activityLevel={visualizerIntensity}
                      isPlaying={isPlaying}
                      animationsEnabled={animationsEnabled}
                      isLateNight={isLateNight}
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>
                    <p className="text-sm font-semibold text-white">{featuredSound.name}</p>
                    <p className="mt-1 text-sm leading-6 text-white/68">{selectedScene.note}</p>
                  </div>

                  <div className="flex items-center gap-2 rounded-[24px] border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/78">
                    <FeaturedIcon className="h-4 w-4" />
                    {featuredSound.description}
                  </div>
                </div>

                {screenshotMode ? (
                  <div className="mt-6 flex items-center justify-between rounded-[24px] border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/70">
                    <span>Made with AuraSound</span>
                    <span>{selectedScene.shareCaption}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <AnimatePresence initial={false}>
        {!focusSessionActive && !screenshotMode ? (
          <motion.section
            key="scene-strip"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel neo-surface rounded-[34px] border border-white/10 px-5 py-5"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Mood scenes
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[color:var(--text)]">
                  One tap atmospheres
                </h3>
              </div>

              <div className="hidden rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)] sm:block">
                Swipe on mobile
              </div>
            </div>

            <div
              className="mt-5 flex gap-3 overflow-x-auto pb-1 hide-scrollbar"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {moodScenes.map((scene) => {
                const active = scene.id === selectedScene.id;
                const Icon = scene.icon;

                return (
                  <motion.button
                    key={scene.id}
                    whileHover={animationsEnabled ? { y: -4 } : undefined}
                    whileTap={animationsEnabled ? { scale: 0.98 } : undefined}
                    type="button"
                    onClick={() => onSelectScene(scene.id)}
                    className={[
                      "ripple-button min-w-[260px] rounded-[28px] border p-4 text-left transition",
                      active
                        ? "border-white/14 bg-white/12 text-[color:var(--text)]"
                        : "border-white/8 bg-white/5 text-[color:var(--muted)]",
                    ].join(" ")}
                    style={{
                      backgroundImage: active
                        ? `radial-gradient(circle at top right, ${scene.tint}, transparent 40%), linear-gradient(145deg, ${scene.background[0]}28, transparent 70%)`
                        : undefined,
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="rounded-[22px] border border-white/10 bg-white/8 p-3">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                        {scene.shortLabel}
                      </span>
                    </div>
                    <h4 className="mt-4 text-lg font-semibold tracking-[-0.04em]">{scene.label}</h4>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{scene.tagline}</p>
                  </motion.button>
                );
              })}
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {!focusSessionActive && !screenshotMode ? (
          <motion.section
            key="mixer"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel neo-surface rounded-[34px] border border-white/10 px-5 py-5 sm:px-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Mixer
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[color:var(--text)]">
                  Floating sound chips
                </h3>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-[color:var(--muted)]">
                <CloudMoon className="h-4 w-4" />
                {activeSoundIds.length} active blend
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sounds.map((sound) => (
                <SoundCard
                  key={sound.id}
                  sound={sound}
                  enabled={activeSoundIds.includes(sound.id)}
                  featured={featuredSound.id === sound.id}
                  volume={soundVolumes[sound.id]}
                  animationsEnabled={animationsEnabled}
                  onToggle={() => onToggleSound(sound.id)}
                  onSelect={() => onSelectSound(sound.id)}
                  onVolumeChange={(value) => onSoundVolumeChange(sound.id, value)}
                />
              ))}
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {focusSessionActive && !screenshotMode ? (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel neo-surface rounded-[34px] border border-white/10 px-5 py-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                Focus flow
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[color:var(--text)]">
                One task. One moment.
              </h3>
            </div>

            <div className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-[color:var(--text)]">
              {focusSessionLabel}
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-[color:var(--text)]">Stay here.</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                The extra controls have faded back so your attention can stay with the work.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-[color:var(--text)]">Breathe.</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                Let the room move slowly around you while the sound mix keeps everything soft.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-[color:var(--text)]">Made with AuraSound</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                Quiet enough to share. Calm enough to stay.
              </p>
            </div>
          </div>
        </motion.section>
      ) : null}

      <div className="pb-6 text-center text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
        Made with AuraSound
      </div>
    </div>
  );
}
