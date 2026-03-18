import { CloudMoon, CloudRain, Coffee, Headphones, MoonStar, Share2, Trees, Waves } from "lucide-react";

export const SOUND_LIBRARY = [
  {
    id: "rain",
    name: "Rain",
    mood: "Calm focus",
    description: "Soft rain with distant thunder and cool city air.",
    icon: CloudRain,
    gradient: ["#274477", "#16233f", "#080c13"],
    glow: "rgba(102, 149, 255, 0.42)",
    accent: "#7ba7ff",
    defaultVolume: 0.42,
    chipText: "Weathered quiet",
  },
  {
    id: "cafe",
    name: "Cafe",
    mood: "Warm productivity",
    description: "Coffeehouse murmur, cups, movement, and soft social blur.",
    icon: Coffee,
    gradient: ["#855236", "#2f1e17", "#09080b"],
    glow: "rgba(233, 161, 103, 0.34)",
    accent: "#f3ab73",
    defaultVolume: 0.4,
    chipText: "Comfort chatter",
  },
  {
    id: "white-noise",
    name: "White Noise",
    mood: "Deep work",
    description: "Clean broadband masking that keeps the outside world soft.",
    icon: Headphones,
    gradient: ["#334a66", "#161d2a", "#07090d"],
    glow: "rgba(188, 210, 247, 0.28)",
    accent: "#d6e3ff",
    defaultVolume: 0.46,
    chipText: "Pure focus",
  },
  {
    id: "ocean",
    name: "Ocean",
    mood: "Release",
    description: "Blue swells, distant surf, and slow tidal drift.",
    icon: Waves,
    gradient: ["#1775b4", "#0d2445", "#04070d"],
    glow: "rgba(88, 204, 255, 0.34)",
    accent: "#7cdfff",
    defaultVolume: 0.46,
    chipText: "Open water",
  },
  {
    id: "night",
    name: "Night",
    mood: "Stillness",
    description: "Low air, midnight insects, and a little distance from the day.",
    icon: CloudMoon,
    gradient: ["#4a3a78", "#171123", "#05070b"],
    glow: "rgba(190, 154, 255, 0.34)",
    accent: "#d0bbff",
    defaultVolume: 0.34,
    chipText: "Moonlit hush",
  },
  {
    id: "forest",
    name: "Forest",
    mood: "Grounding",
    description: "Leaves, wind, and soft woodland movement around you.",
    icon: Trees,
    gradient: ["#215f49", "#10261f", "#05090a"],
    glow: "rgba(96, 219, 166, 0.3)",
    accent: "#85e9bb",
    defaultVolume: 0.38,
    chipText: "Green stillness",
  },
];

export const SOUND_INDEX = Object.fromEntries(SOUND_LIBRARY.map((sound) => [sound.id, sound]));

export const MOOD_SCENES = [
  {
    id: "rainy-night-focus",
    label: "Rainy Night Focus",
    shortLabel: "Rainy Night",
    tagline: "A private little weather system for serious concentration.",
    note: "Rain, white noise, and midnight hush tuned for uninterrupted focus.",
    icon: CloudRain,
    tint: "rgba(110, 143, 255, 0.22)",
    background: ["#0e1630", "#0a101c", "#05070c"],
    shareCaption: "Rainy Night Focus on AuraSound",
    mantra: ["Stay here.", "One task. One moment.", "Let the room disappear."],
    focusMinutes: 45,
    activeSoundIds: ["rain", "white-noise", "night"],
    volumes: {
      rain: 0.5,
      "white-noise": 0.28,
      night: 0.16,
    },
    primarySoundId: "rain",
  },
  {
    id: "cozy-cafe-study",
    label: "Cozy Cafe Study",
    shortLabel: "Cozy Cafe",
    tagline: "Warmth, motion, and just enough life to keep you moving.",
    note: "Cafe ambience with a touch of rain for soft edges and long study blocks.",
    icon: Coffee,
    tint: "rgba(233, 156, 103, 0.22)",
    background: ["#30190f", "#1a1110", "#070708"],
    shareCaption: "Cozy Cafe Study on AuraSound",
    mantra: ["You're in the flow.", "Keep it gentle.", "Small progress counts."],
    focusMinutes: 50,
    activeSoundIds: ["cafe", "rain"],
    volumes: {
      cafe: 0.56,
      rain: 0.18,
    },
    primarySoundId: "cafe",
  },
  {
    id: "deep-ocean-calm",
    label: "Deep Ocean Calm",
    shortLabel: "Deep Ocean",
    tagline: "Broad horizons, slower breath, less noise in the mind.",
    note: "Ocean swells and soft white noise for emotional reset and clean attention.",
    icon: Waves,
    tint: "rgba(82, 205, 255, 0.2)",
    background: ["#0a2440", "#08111d", "#03060c"],
    shareCaption: "Deep Ocean Calm on AuraSound",
    mantra: ["Breathe.", "Release the extra weight.", "Let it soften."],
    focusMinutes: 30,
    activeSoundIds: ["ocean", "white-noise"],
    volumes: {
      ocean: 0.58,
      "white-noise": 0.16,
    },
    primarySoundId: "ocean",
  },
  {
    id: "midnight-isolation",
    label: "Midnight Isolation",
    shortLabel: "Midnight",
    tagline: "When the world goes quiet enough to hear your own attention.",
    note: "Night air, faint rain, and a clean focus mask built for late-night work.",
    icon: MoonStar,
    tint: "rgba(180, 154, 255, 0.24)",
    background: ["#120f24", "#090b13", "#040508"],
    shareCaption: "Midnight Isolation on AuraSound",
    mantra: ["The room is enough.", "Protect this hour.", "Keep the silence close."],
    focusMinutes: 60,
    activeSoundIds: ["night", "white-noise", "rain"],
    volumes: {
      night: 0.32,
      "white-noise": 0.24,
      rain: 0.16,
    },
    primarySoundId: "night",
  },
  {
    id: "forest-meditation",
    label: "Forest Meditation",
    shortLabel: "Forest",
    tagline: "Green air, softer thoughts, and a calmer nervous system.",
    note: "Forest texture with distant water for grounding, breathing, and reset.",
    icon: Trees,
    tint: "rgba(102, 219, 172, 0.2)",
    background: ["#11261f", "#09100d", "#040707"],
    shareCaption: "Forest Meditation on AuraSound",
    mantra: ["Slow down.", "Root into the moment.", "Nothing else is needed."],
    focusMinutes: 25,
    activeSoundIds: ["forest", "ocean"],
    volumes: {
      forest: 0.54,
      ocean: 0.14,
    },
    primarySoundId: "forest",
  },
];

export const SCENE_INDEX = Object.fromEntries(MOOD_SCENES.map((scene) => [scene.id, scene]));

export const SETTINGS_OPTIONS = [
  {
    id: "share",
    label: "Share your mood scene",
    icon: Share2,
  },
];

export const DEFAULT_QUALITY = "high";
export const DEFAULT_SCENE = "rainy-night-focus";
export const TIMER_PRESETS = [15, 30, 45, 60];

export function createDefaultSoundVolumes() {
  return Object.fromEntries(SOUND_LIBRARY.map((sound) => [sound.id, sound.defaultVolume]));
}

export function getSound(soundId) {
  return SOUND_INDEX[soundId] ?? SOUND_LIBRARY[0];
}

export function getScene(sceneId) {
  return SCENE_INDEX[sceneId] ?? MOOD_SCENES[0];
}
