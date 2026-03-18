import { motion } from "framer-motion";
import { SlidersHorizontal, Volume2 } from "lucide-react";

export default function SoundCard({
  sound,
  enabled,
  volume,
  featured,
  animationsEnabled,
  onToggle,
  onSelect,
  onVolumeChange,
}) {
  const Icon = sound.icon;

  return (
    <motion.article
      layout
      whileHover={animationsEnabled ? { y: -6, scale: 1.015 } : undefined}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="glass-panel neo-surface relative overflow-hidden rounded-[34px] border border-white/10 p-5"
      style={{
        backgroundImage: enabled
          ? `radial-gradient(circle at top, ${sound.glow}, transparent 40%), linear-gradient(180deg, ${sound.gradient[0]}18, transparent 70%)`
          : "linear-gradient(180deg, rgba(255,255,255,0.05), transparent 72%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div
          className="absolute left-1/2 top-5 h-28 w-28 -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: enabled ? sound.glow : "rgba(255,255,255,0.05)" }}
        />
      </div>

      <div className="relative flex flex-col items-center text-center">
        <motion.button
          type="button"
          onClick={onToggle}
          whileTap={animationsEnabled ? { scale: 0.96 } : undefined}
          animate={
            enabled && animationsEnabled
              ? {
                  boxShadow: [
                    `0 0 0 0 ${sound.glow}`,
                    `0 0 0 16px rgba(255,255,255,0)`,
                    `0 0 0 0 rgba(255,255,255,0)`,
                  ],
                  scale: [1, 1.03, 1],
                }
              : undefined
          }
          transition={{
            duration: 2.8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className={[
            "ripple-button relative flex h-24 w-24 items-center justify-center rounded-full border transition",
            enabled
              ? "border-white/20 bg-white/12 text-[color:var(--text)]"
              : "border-white/10 bg-white/6 text-[color:var(--muted)]",
          ].join(" ")}
        >
          <span
            className="absolute inset-2 rounded-full"
            style={{
              background: `linear-gradient(145deg, ${sound.gradient[0]}, ${sound.gradient[1]})`,
              opacity: enabled ? 1 : 0.32,
            }}
          />
          <Icon className="relative z-10 h-7 w-7" />
        </motion.button>

        <button
          type="button"
          onClick={onSelect}
          className="mt-4 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)] transition hover:border-white/15 hover:text-[color:var(--text)]"
        >
          {featured ? "Centered" : "Spotlight"}
        </button>

        <h3 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-[color:var(--text)]">{sound.name}</h3>
        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">{sound.chipText}</p>

        <div className="mt-5 flex w-full items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">Layer volume</span>
          <span>{Math.round(volume * 100)}%</span>
        </div>

        <div className="mt-2 flex w-full items-center gap-3">
          <Volume2 className="h-4 w-4 text-[color:var(--muted)]" />
          <input
            className="range-input"
            type="range"
            min="0"
            max="100"
            value={Math.round(volume * 100)}
            onChange={(event) => onVolumeChange(Number(event.target.value) / 100)}
            aria-label={`${sound.name} volume`}
          />
        </div>
      </div>
    </motion.article>
  );
}
