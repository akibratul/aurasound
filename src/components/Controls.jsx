import { AnimatePresence, motion } from "framer-motion";
import {
  Clock3,
  Pause,
  Play,
  Settings2,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";

function formatTime(seconds) {
  const totalSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function Controls({
  featuredSound,
  activeSoundIds,
  isPlaying,
  masterVolume,
  onVolumeChange,
  onPlayPause,
  onPrevious,
  onNext,
  timerOpen,
  onToggleTimerPanel,
  selectedTimerMinutes,
  customTimerMinutes,
  onCustomTimerChange,
  onApplyCustomTimer,
  onSelectTimer,
  timerPresets,
  timerRemainingSeconds,
  timerProgress,
  timerActive,
  focusSessionActive,
  sessionClockLabel,
  screenshotMode,
  onOpenSettings,
}) {
  const FeaturedIcon = featuredSound.icon;
  const circumference = 2 * Math.PI * 38;
  const dashOffset = circumference * (1 - timerProgress);

  if (screenshotMode) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-4 sm:px-6">
      <motion.section
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass-panel neo-surface pointer-events-auto mx-auto max-w-7xl rounded-[34px] border border-white/12 px-4 py-4 sm:px-6"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[24px] border border-white/12"
              style={{
                backgroundImage: `linear-gradient(145deg, ${featuredSound.gradient[0]}, ${featuredSound.gradient[1]})`,
                boxShadow: `0 0 30px ${featuredSound.glow}`,
              }}
            >
              <FeaturedIcon className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-[-0.02em] text-[color:var(--text)]">
                {featuredSound.name}
              </p>
              <p className="truncate text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                {activeSoundIds.length} live layer{activeSoundIds.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center gap-3 sm:gap-5">
            <button
              type="button"
              onClick={onPrevious}
              className="ripple-button rounded-full border border-white/10 bg-white/6 p-3 text-[color:var(--text)] transition hover:bg-white/12"
              aria-label="Previous sound"
            >
              <SkipBack className="h-5 w-5" />
            </button>

            <div className="relative flex items-center justify-center">
              <svg className="absolute h-[102px] w-[102px] -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="5"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke={featuredSound.accent}
                  strokeLinecap="round"
                  strokeWidth="5"
                  strokeDasharray={circumference}
                  strokeDashoffset={timerActive ? dashOffset : circumference}
                  className="transition-all duration-500 ease-out"
                />
              </svg>

              <button
                type="button"
                onClick={onPlayPause}
                className="ripple-button relative z-10 flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/10 text-[color:var(--text)] shadow-glow transition hover:scale-[1.02]"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="ml-1 h-8 w-8" />}
              </button>
            </div>

            <button
              type="button"
              onClick={onNext}
              className="ripple-button rounded-full border border-white/10 bg-white/6 p-3 text-[color:var(--text)] transition hover:bg-white/12"
              aria-label="Next sound"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-3 lg:min-w-[320px] lg:max-w-[360px] lg:flex-1">
            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4 text-[color:var(--muted)]" />
              <input
                className="range-input"
                type="range"
                min="0"
                max="100"
                value={Math.round(masterVolume * 100)}
                onChange={(event) => onVolumeChange(Number(event.target.value) / 100)}
                aria-label="Master volume"
              />
              <span className="min-w-[42px] text-right text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                {Math.round(masterVolume * 100)}%
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <button
                type="button"
                onClick={onToggleTimerPanel}
                className="ripple-button flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-[color:var(--text)] transition hover:bg-white/10"
              >
                <Clock3 className="h-4 w-4" />
                {timerActive
                  ? formatTime(timerRemainingSeconds)
                  : selectedTimerMinutes
                    ? `${selectedTimerMinutes} min`
                    : "Timer"}
              </button>

              {focusSessionActive ? (
                <span className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-[color:var(--text)]">
                  {sessionClockLabel}
                </span>
              ) : null}

              <button
                type="button"
                onClick={onOpenSettings}
                className="ripple-button flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-[color:var(--text)] transition hover:bg-white/10"
              >
                <Settings2 className="h-4 w-4" />
                Settings
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {timerOpen ? (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="mt-4 rounded-[26px] border border-white/10 bg-white/6 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                Focus timer
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onSelectTimer(null)}
                  className={[
                    "ripple-button rounded-full border px-3 py-2 text-sm",
                    selectedTimerMinutes === null
                      ? "border-white/16 bg-white/12 text-[color:var(--text)]"
                      : "border-white/8 bg-white/5 text-[color:var(--muted)]",
                  ].join(" ")}
                >
                  Off
                </button>

                {timerPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onSelectTimer(preset)}
                    className={[
                      "ripple-button rounded-full border px-3 py-2 text-sm",
                      selectedTimerMinutes === preset
                        ? "border-white/16 bg-white/12 text-[color:var(--text)]"
                        : "border-white/8 bg-white/5 text-[color:var(--muted)]",
                    ].join(" ")}
                  >
                    {preset} min
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-[22px] border border-white/10 bg-black/10 p-3">
                <label className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Custom minutes
                </label>
                <div className="mt-3 flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={customTimerMinutes}
                    onChange={(event) => onCustomTimerChange(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--muted)]"
                    placeholder="45"
                  />
                  <button
                    type="button"
                    onClick={onApplyCustomTimer}
                    className="ripple-button rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-[color:var(--text)]"
                  >
                    Set
                  </button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.section>
    </div>
  );
}
