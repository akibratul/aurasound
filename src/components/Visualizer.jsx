import { useEffect, useRef } from "react";

const DOT_COUNT = 22;

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  const normalized = value.length === 3 ? value.split("").map((part) => `${part}${part}`).join("") : value;
  const int = Number.parseInt(normalized, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function rgba(hex, alpha) {
  const color = hexToRgb(hex);
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

export default function Visualizer({
  featuredSound,
  sceneTint,
  activityLevel,
  isPlaying,
  animationsEnabled,
  isLateNight,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return undefined;
    }

    let rafId = 0;
    let width = 0;
    let height = 0;
    const particleSeed = Array.from({ length: DOT_COUNT }, (_, index) => ({
      offset: index * 0.6,
      lane: (index % 4) / 4,
    }));

    function resize() {
      const { clientWidth, clientHeight } = canvas;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = clientWidth * dpr;
      height = clientHeight * dpr;
      canvas.width = width;
      canvas.height = height;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(dpr, dpr);
    }

    function drawFrame(timestamp) {
      const time = timestamp / 1000;
      const visualWidth = canvas.clientWidth;
      const visualHeight = canvas.clientHeight;
      const baseAmplitude = Math.max(10, visualHeight * (0.08 + activityLevel * (isPlaying ? 0.1 : 0.03)));
      const speed = animationsEnabled ? (isLateNight ? 0.4 : 0.65) : 0;

      context.clearRect(0, 0, visualWidth, visualHeight);

      const gradient = context.createLinearGradient(0, 0, visualWidth, visualHeight);
      gradient.addColorStop(0, rgba(featuredSound.accent, 0.2));
      gradient.addColorStop(0.5, sceneTint);
      gradient.addColorStop(1, rgba(featuredSound.gradient[0], 0.05));
      context.fillStyle = gradient;
      context.fillRect(0, 0, visualWidth, visualHeight);

      [0, 1, 2].forEach((layer) => {
        context.beginPath();

        for (let x = 0; x <= visualWidth; x += 8) {
          const progress = x / visualWidth;
          const y =
            visualHeight * (0.5 + layer * 0.08) +
            Math.sin(progress * 8 + time * speed * (layer + 1.4)) * baseAmplitude * (0.3 + layer * 0.22) +
            Math.cos(progress * 4.5 - time * speed * 0.6) * baseAmplitude * 0.1;

          if (x === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }

        context.strokeStyle = rgba(featuredSound.accent, 0.22 + layer * 0.16);
        context.lineWidth = 1.2 + layer * 0.8;
        context.stroke();
      });

      particleSeed.forEach((particle, index) => {
        const drift = time * speed * (18 + index * 0.25);
        const x = ((drift * 26 + index * 33) % (visualWidth + 80)) - 40;
        const y =
          visualHeight * (0.22 + particle.lane * 0.48) +
          Math.sin(time * speed + particle.offset) * baseAmplitude * 0.55;
        const radius = 1.5 + (index % 3) * 1.15 + activityLevel * 1.2;

        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = rgba(featuredSound.accent, 0.18 + (index % 4) * 0.07);
        context.shadowBlur = 18;
        context.shadowColor = rgba(featuredSound.accent, 0.22);
        context.fill();
      });

      context.shadowBlur = 0;

      if (animationsEnabled) {
        rafId = window.requestAnimationFrame(drawFrame);
      }
    }

    resize();

    if (animationsEnabled) {
      rafId = window.requestAnimationFrame(drawFrame);
    } else {
      drawFrame(0);
    }

    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, [activityLevel, animationsEnabled, featuredSound, isLateNight, isPlaying, sceneTint]);

  return <canvas ref={canvasRef} className="h-full w-full rounded-[34px]" aria-hidden="true" />;
}
