import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, Sparkles, X, Zap } from "lucide-react";

function ToggleButton({ active, label, onClick, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "ripple-button flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition",
        active
          ? "border-white/16 bg-white/12 text-[color:var(--text)]"
          : "border-white/8 bg-white/5 text-[color:var(--muted)]",
      ].join(" ")}
    >
      <span className="rounded-xl border border-white/10 bg-white/8 p-2">
        <Icon className="h-4 w-4" />
      </span>
      {label}
    </button>
  );
}

export default function Settings({
  open,
  animationsEnabled,
  quality,
  onClose,
  onAnimationsChange,
  onQualityChange,
  onReset,
}) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm"
            aria-label="Close settings"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 p-5 sm:p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Settings
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[color:var(--text)]">
                  Keep it calm
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="ripple-button rounded-full border border-white/10 bg-white/6 p-3 text-[color:var(--text)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-8 space-y-6 overflow-y-auto pr-1 hide-scrollbar">
              <section className="rounded-[28px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Motion
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  Keep the app alive and drifting, or freeze it into a quieter still frame.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <ToggleButton
                    active={animationsEnabled}
                    label="Animations On"
                    onClick={() => onAnimationsChange(true)}
                    icon={Sparkles}
                  />
                  <ToggleButton
                    active={!animationsEnabled}
                    label="Animations Off"
                    onClick={() => onAnimationsChange(false)}
                    icon={Zap}
                  />
                </div>
              </section>

              <section className="rounded-[28px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Sound Quality
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  High quality adds more layered detail. Low quality eases CPU load and battery drain.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <ToggleButton
                    active={quality === "low"}
                    label="Low"
                    onClick={() => onQualityChange("low")}
                    icon={Zap}
                  />
                  <ToggleButton
                    active={quality === "high"}
                    label="High"
                    onClick={() => onQualityChange("high")}
                    icon={Sparkles}
                  />
                </div>
              </section>

              <section className="rounded-[28px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Session Memory
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  Clear your saved scene, sound mix, focus stats, screenshot mode, and share state.
                </p>
                <button
                  type="button"
                  onClick={onReset}
                  className="ripple-button mt-4 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-100"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset session
                </button>
              </section>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
