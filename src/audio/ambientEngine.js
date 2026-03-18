const SCENE_FADE_SECONDS = 0.85;
const MASTER_FADE_SECONDS = 0.8;

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function wait(ms, tokenRef, token) {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve(tokenRef.current === token);
    }, ms);
  });
}

function getAudioContextCtor() {
  return window.AudioContext || window.webkitAudioContext || null;
}

const noiseBufferCache = new Map();

function getNoiseBuffer(context, color, durationSeconds) {
  const cacheKey = `${context.sampleRate}:${color}:${durationSeconds.toFixed(2)}`;

  if (noiseBufferCache.has(cacheKey)) {
    return noiseBufferCache.get(cacheKey);
  }

  const frameCount = Math.max(1, Math.floor(context.sampleRate * durationSeconds));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const channel = buffer.getChannelData(0);

  if (color === "pink") {
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;

    for (let i = 0; i < frameCount; i += 1) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      channel[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  } else if (color === "brown") {
    let lastOut = 0;

    for (let i = 0; i < frameCount; i += 1) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      channel[i] = lastOut * 3.5;
    }
  } else {
    for (let i = 0; i < frameCount; i += 1) {
      channel[i] = Math.random() * 2 - 1;
    }
  }

  noiseBufferCache.set(cacheKey, buffer);
  return buffer;
}

function createSceneShell(context) {
  const cleanupFns = [];
  const output = context.createGain();
  output.gain.value = 0.0001;

  return {
    output,
    addCleanup(fn) {
      cleanupFns.push(fn);
      return fn;
    },
    addNode(node) {
      cleanupFns.push(() => {
        try {
          node.disconnect();
        } catch (error) {
          // Ignore disconnect errors during teardown.
        }
      });
      return node;
    },
    addSource(source) {
      cleanupFns.push(() => {
        try {
          source.stop();
        } catch (error) {
          // Source may already be stopped.
        }

        try {
          source.disconnect();
        } catch (error) {
          // Ignore disconnect errors during teardown.
        }
      });
      return source;
    },
    stop() {
      while (cleanupFns.length > 0) {
        const cleanup = cleanupFns.pop();

        try {
          cleanup();
        } catch (error) {
          // Best-effort teardown.
        }
      }

      try {
        output.disconnect();
      } catch (error) {
        // Ignore disconnect errors during teardown.
      }
    },
  };
}

function createLoopingNoiseSource(scene, context, color, durationSeconds, playbackRate = 1) {
  const source = scene.addSource(context.createBufferSource());
  source.buffer = getNoiseBuffer(context, color, durationSeconds);
  source.loop = true;
  source.playbackRate.value = playbackRate;
  source.start();
  return source;
}

function scheduleRandomLoop(scene, callback, minDelayMs, maxDelayMs, immediate = false) {
  let timeoutId = null;
  let cancelled = false;

  function queueNext() {
    if (cancelled) {
      return;
    }

    const delay = minDelayMs + Math.random() * (maxDelayMs - minDelayMs);
    timeoutId = window.setTimeout(() => {
      callback();
      queueNext();
    }, delay);
  }

  if (immediate) {
    callback();
  }

  queueNext();

  scene.addCleanup(() => {
    cancelled = true;

    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  });
}

function attachOptionalPanner(context, inputNode, destination, pan = 0) {
  if (typeof context.createStereoPanner === "function") {
    const panner = context.createStereoPanner();
    panner.pan.value = pan;
    inputNode.connect(panner);
    panner.connect(destination);
    return () => {
      try {
        panner.disconnect();
      } catch (error) {
        // Ignore teardown issues.
      }
    };
  }

  inputNode.connect(destination);
  return () => {};
}

function spawnRainDrop(context, destination, depth = 1) {
  const now = context.currentTime;
  const source = context.createBufferSource();
  source.buffer = getNoiseBuffer(context, "white", 0.2);

  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1200 + Math.random() * 2600;
  filter.Q.value = 2.4 + Math.random() * 5;

  const gain = context.createGain();
  const peak = (0.01 + Math.random() * 0.028) * depth;
  const duration = 0.12 + Math.random() * 0.18;

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.016);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  source.connect(filter);
  filter.connect(gain);
  const detachPanner = attachOptionalPanner(context, gain, destination, Math.random() * 1.4 - 0.7);

  source.onended = () => {
    source.disconnect();
    filter.disconnect();
    gain.disconnect();
    detachPanner();
  };

  source.start(now);
  source.stop(now + duration + 0.05);
}

function spawnThunder(context, destination, depth = 1) {
  const now = context.currentTime;
  const rumble = context.createOscillator();
  const rumbleGain = context.createGain();
  const rumbleFilter = context.createBiquadFilter();
  const noise = context.createBufferSource();
  const noiseFilter = context.createBiquadFilter();
  const noiseGain = context.createGain();

  rumble.type = "sine";
  rumble.frequency.setValueAtTime(54 + Math.random() * 10, now);
  rumble.frequency.exponentialRampToValueAtTime(33 + Math.random() * 6, now + 3.8);

  rumbleFilter.type = "lowpass";
  rumbleFilter.frequency.value = 160;
  rumbleGain.gain.setValueAtTime(0.0001, now);
  rumbleGain.gain.exponentialRampToValueAtTime(0.025 * depth, now + 0.8);
  rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.6);

  noise.buffer = getNoiseBuffer(context, "brown", 3.4);
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = 210;
  noiseGain.gain.setValueAtTime(0.0001, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.016 * depth, now + 0.9);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.8);

  rumble.connect(rumbleFilter);
  rumbleFilter.connect(rumbleGain);
  const detachRumble = attachOptionalPanner(context, rumbleGain, destination, Math.random() * 0.6 - 0.3);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  const detachNoise = attachOptionalPanner(context, noiseGain, destination, Math.random() * 0.6 - 0.3);

  rumble.onended = () => {
    rumble.disconnect();
    rumbleFilter.disconnect();
    rumbleGain.disconnect();
    noise.disconnect();
    noiseFilter.disconnect();
    noiseGain.disconnect();
    detachRumble();
    detachNoise();
  };

  rumble.start(now);
  noise.start(now);
  rumble.stop(now + 4.9);
  noise.stop(now + 4.9);
}

function spawnCafeClink(context, destination, depth = 1) {
  const now = context.currentTime;
  const primary = context.createOscillator();
  const overtone = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const baseFrequency = 1300 + Math.random() * 1200;

  primary.type = "triangle";
  primary.frequency.setValueAtTime(baseFrequency, now);
  overtone.type = "sine";
  overtone.frequency.setValueAtTime(baseFrequency * 1.52, now);

  filter.type = "highpass";
  filter.frequency.value = 700;

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime((0.006 + Math.random() * 0.008) * depth, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

  primary.connect(filter);
  overtone.connect(filter);
  filter.connect(gain);
  const detach = attachOptionalPanner(context, gain, destination, Math.random() * 0.8 - 0.4);

  primary.onended = () => {
    primary.disconnect();
    overtone.disconnect();
    filter.disconnect();
    gain.disconnect();
    detach();
  };

  primary.start(now);
  overtone.start(now);
  primary.stop(now + 0.36);
  overtone.stop(now + 0.32);
}

function spawnOceanSwell(context, destination, depth = 1) {
  const now = context.currentTime;
  const source = context.createBufferSource();
  source.buffer = getNoiseBuffer(context, "pink", 2.6);

  const lowpass = context.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 1300;

  const bandpass = context.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = 540 + Math.random() * 180;
  bandpass.Q.value = 0.45;

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime((0.05 + Math.random() * 0.045) * depth, now + 1.4);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.3);

  source.connect(lowpass);
  lowpass.connect(bandpass);
  bandpass.connect(gain);
  const detach = attachOptionalPanner(context, gain, destination, Math.random() * 0.9 - 0.45);

  source.onended = () => {
    source.disconnect();
    lowpass.disconnect();
    bandpass.disconnect();
    gain.disconnect();
    detach();
  };

  source.start(now);
  source.stop(now + 4.4);
}

function spawnBirdCall(context, destination, depth = 1) {
  const now = context.currentTime;
  const oscA = context.createOscillator();
  const oscB = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  const base = 1100 + Math.random() * 1200;

  oscA.type = "sine";
  oscB.type = "triangle";
  oscA.frequency.setValueAtTime(base, now);
  oscA.frequency.exponentialRampToValueAtTime(base * 1.7, now + 0.14);
  oscA.frequency.exponentialRampToValueAtTime(base * 1.2, now + 0.28);
  oscB.frequency.setValueAtTime(base * 1.98, now);

  filter.type = "bandpass";
  filter.frequency.value = base * 1.18;
  filter.Q.value = 2.2;

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime((0.01 + Math.random() * 0.016) * depth, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

  oscA.connect(filter);
  oscB.connect(filter);
  filter.connect(gain);
  const detach = attachOptionalPanner(context, gain, destination, Math.random() * 1.2 - 0.6);

  oscA.onended = () => {
    oscA.disconnect();
    oscB.disconnect();
    filter.disconnect();
    gain.disconnect();
    detach();
  };

  oscA.start(now);
  oscB.start(now);
  oscA.stop(now + 0.36);
  oscB.stop(now + 0.28);
}

function spawnCricket(context, destination, depth = 1) {
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const tremolo = context.createOscillator();
  const tremoloGain = context.createGain();

  oscillator.type = "square";
  oscillator.frequency.value = 4300 + Math.random() * 700;
  tremolo.type = "square";
  tremolo.frequency.value = 16 + Math.random() * 8;
  tremoloGain.gain.value = 0.005 * depth;

  gain.gain.value = 0.0001;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.004 * depth, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.44);

  tremolo.connect(tremoloGain);
  tremoloGain.connect(gain.gain);
  oscillator.connect(gain);
  const detach = attachOptionalPanner(context, gain, destination, Math.random() * 1.2 - 0.6);

  oscillator.onended = () => {
    oscillator.disconnect();
    tremolo.disconnect();
    tremoloGain.disconnect();
    gain.disconnect();
    detach();
  };

  oscillator.start(now);
  tremolo.start(now);
  oscillator.stop(now + 0.44);
  tremolo.stop(now + 0.44);
}

function createRainScene(context, qualityScale) {
  const scene = createSceneShell(context);

  const rainfall = createLoopingNoiseSource(scene, context, "pink", 2.8);
  const rainfallHigh = scene.addNode(context.createBiquadFilter());
  rainfallHigh.type = "highpass";
  rainfallHigh.frequency.value = 460;

  const rainfallLow = scene.addNode(context.createBiquadFilter());
  rainfallLow.type = "lowpass";
  rainfallLow.frequency.value = 6100;

  const rainfallGain = scene.addNode(context.createGain());
  rainfallGain.gain.value = 0.22;

  rainfall.connect(rainfallHigh);
  rainfallHigh.connect(rainfallLow);
  rainfallLow.connect(rainfallGain);
  rainfallGain.connect(scene.output);

  const shimmer = createLoopingNoiseSource(scene, context, "white", 2.2, 1.02);
  const shimmerFilter = scene.addNode(context.createBiquadFilter());
  shimmerFilter.type = "bandpass";
  shimmerFilter.frequency.value = 3600;
  shimmerFilter.Q.value = 0.8;

  const shimmerGain = scene.addNode(context.createGain());
  shimmerGain.gain.value = 0.03;

  shimmer.connect(shimmerFilter);
  shimmerFilter.connect(shimmerGain);
  shimmerGain.connect(scene.output);

  scheduleRandomLoop(
    scene,
    () => {
      const count = 1 + Math.floor(Math.random() * (2 + Math.round(qualityScale * 2)));

      for (let index = 0; index < count; index += 1) {
        spawnRainDrop(context, scene.output, 0.9 + qualityScale * 0.25);
      }
    },
    90 / qualityScale,
    220 / qualityScale,
    true,
  );

  scheduleRandomLoop(
    scene,
    () => {
      spawnThunder(context, scene.output, 0.7 + qualityScale * 0.3);
    },
    13000 / qualityScale,
    22000 / qualityScale,
  );

  return scene;
}

function createCafeScene(context, qualityScale) {
  const scene = createSceneShell(context);

  const roomTone = createLoopingNoiseSource(scene, context, "brown", 3.2);
  const roomLow = scene.addNode(context.createBiquadFilter());
  roomLow.type = "lowpass";
  roomLow.frequency.value = 880;

  const roomGain = scene.addNode(context.createGain());
  roomGain.gain.value = 0.048;

  roomTone.connect(roomLow);
  roomLow.connect(roomGain);
  roomGain.connect(scene.output);

  const murmurBands = [
    { frequency: 270, q: 0.45, gain: 0.036, variation: 0.016 },
    { frequency: 620, q: 0.75, gain: 0.03, variation: 0.014 },
    { frequency: 1120, q: 1.05, gain: 0.018, variation: 0.01 },
  ];

  murmurBands.forEach((band, index) => {
    const source = createLoopingNoiseSource(scene, context, "pink", 2.5 + index * 0.35, 0.98 + index * 0.04);
    const filter = scene.addNode(context.createBiquadFilter());
    filter.type = "bandpass";
    filter.frequency.value = band.frequency;
    filter.Q.value = band.q;

    const gain = scene.addNode(context.createGain());
    gain.gain.value = band.gain;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(scene.output);

    scheduleRandomLoop(
      scene,
      () => {
        const now = context.currentTime;
        const nextGain = band.gain + (Math.random() * 2 - 1) * band.variation * qualityScale;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(clamp(nextGain, 0.004, 0.08), now + 1.4 + Math.random() * 1.4);
      },
      900 / qualityScale,
      2200 / qualityScale,
      true,
    );
  });

  const hum = scene.addSource(context.createOscillator());
  hum.type = "sine";
  hum.frequency.value = 124;

  const humGain = scene.addNode(context.createGain());
  humGain.gain.value = 0.0065;

  hum.connect(humGain);
  humGain.connect(scene.output);
  hum.start();

  scheduleRandomLoop(
    scene,
    () => {
      spawnCafeClink(context, scene.output, 0.9 + qualityScale * 0.18);
    },
    2600 / qualityScale,
    5600 / qualityScale,
  );

  return scene;
}

function createWhiteNoiseScene(context) {
  const scene = createSceneShell(context);

  const source = createLoopingNoiseSource(scene, context, "white", 2.8);
  const highpass = scene.addNode(context.createBiquadFilter());
  highpass.type = "highpass";
  highpass.frequency.value = 120;

  const lowpass = scene.addNode(context.createBiquadFilter());
  lowpass.type = "lowpass";
  lowpass.frequency.value = 7600;

  const toneShape = scene.addNode(context.createBiquadFilter());
  toneShape.type = "peaking";
  toneShape.frequency.value = 2400;
  toneShape.Q.value = 0.75;
  toneShape.gain.value = 2.5;

  const gain = scene.addNode(context.createGain());
  gain.gain.value = 0.24;

  source.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(toneShape);
  toneShape.connect(gain);
  gain.connect(scene.output);

  return scene;
}

function createOceanScene(context, qualityScale) {
  const scene = createSceneShell(context);

  const bed = createLoopingNoiseSource(scene, context, "pink", 3.2, 0.92);
  const bedLow = scene.addNode(context.createBiquadFilter());
  bedLow.type = "lowpass";
  bedLow.frequency.value = 1800;

  const bedHigh = scene.addNode(context.createBiquadFilter());
  bedHigh.type = "highpass";
  bedHigh.frequency.value = 80;

  const bedGain = scene.addNode(context.createGain());
  bedGain.gain.value = 0.11;

  const tideLfo = scene.addSource(context.createOscillator());
  tideLfo.type = "sine";
  tideLfo.frequency.value = 0.05;
  const tideDepth = scene.addNode(context.createGain());
  tideDepth.gain.value = 700;

  tideLfo.connect(tideDepth);
  tideDepth.connect(bedLow.frequency);

  bed.connect(bedLow);
  bedLow.connect(bedHigh);
  bedHigh.connect(bedGain);
  bedGain.connect(scene.output);
  tideLfo.start();

  scheduleRandomLoop(
    scene,
    () => {
      spawnOceanSwell(context, scene.output, 0.85 + qualityScale * 0.2);
    },
    2400 / qualityScale,
    4200 / qualityScale,
    true,
  );

  return scene;
}

function createForestScene(context, qualityScale) {
  const scene = createSceneShell(context);

  const breeze = createLoopingNoiseSource(scene, context, "pink", 3.4, 0.96);
  const breezeLow = scene.addNode(context.createBiquadFilter());
  breezeLow.type = "lowpass";
  breezeLow.frequency.value = 1500;

  const breezeHigh = scene.addNode(context.createBiquadFilter());
  breezeHigh.type = "highpass";
  breezeHigh.frequency.value = 170;

  const breezeGain = scene.addNode(context.createGain());
  breezeGain.gain.value = 0.075;

  breeze.connect(breezeLow);
  breezeLow.connect(breezeHigh);
  breezeHigh.connect(breezeGain);
  breezeGain.connect(scene.output);

  scheduleRandomLoop(
    scene,
    () => {
      spawnBirdCall(context, scene.output, 0.85 + qualityScale * 0.24);
    },
    2600 / qualityScale,
    5200 / qualityScale,
    true,
  );

  return scene;
}

function createNightScene(context, qualityScale) {
  const scene = createSceneShell(context);

  const air = createLoopingNoiseSource(scene, context, "brown", 3.1, 0.98);
  const airLow = scene.addNode(context.createBiquadFilter());
  airLow.type = "lowpass";
  airLow.frequency.value = 900;

  const airGain = scene.addNode(context.createGain());
  airGain.gain.value = 0.04;

  air.connect(airLow);
  airLow.connect(airGain);
  airGain.connect(scene.output);

  const pad = scene.addSource(context.createOscillator());
  pad.type = "triangle";
  pad.frequency.value = 92;

  const padGain = scene.addNode(context.createGain());
  padGain.gain.value = 0.005;
  pad.connect(padGain);
  padGain.connect(scene.output);
  pad.start();

  scheduleRandomLoop(
    scene,
    () => {
      const chirpCount = 2 + Math.floor(Math.random() * (2 + Math.round(qualityScale * 2)));

      for (let index = 0; index < chirpCount; index += 1) {
        window.setTimeout(() => {
          spawnCricket(context, scene.output, 0.8 + qualityScale * 0.15);
        }, index * (90 + Math.random() * 65));
      }
    },
    2000 / qualityScale,
    4200 / qualityScale,
    true,
  );

  return scene;
}

const SCENE_FACTORIES = {
  rain: createRainScene,
  cafe: createCafeScene,
  "white-noise": createWhiteNoiseScene,
  ocean: createOceanScene,
  forest: createForestScene,
  night: createNightScene,
};

export function createAmbientEngine() {
  let context = null;
  let masterGain = null;
  const scenes = new Map();
  const tokenRef = { current: 0 };
  let currentQuality = "high";
  let destinationAttached = false;

  async function ensureContext() {
    const AudioContextCtor = getAudioContextCtor();

    if (!AudioContextCtor) {
      throw new Error("This browser does not support immersive audio playback.");
    }

    if (!context) {
      context = new AudioContextCtor({ latencyHint: "interactive" });
      masterGain = context.createGain();
      masterGain.gain.value = 0.0001;
    }

    if (context.state !== "running") {
      await context.resume();
    }

    if (!destinationAttached) {
      masterGain.connect(context.destination);
      destinationAttached = true;
    }

    return context;
  }

  function rampGain(gainNode, target, seconds) {
    if (!context) {
      return;
    }

    const now = context.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(Math.max(gainNode.gain.value, 0), now);
    gainNode.gain.linearRampToValueAtTime(clamp(target), now + seconds);
  }

  async function applyState({ activeSoundIds, soundVolumes, masterVolume, playing, quality }) {
    const token = ++tokenRef.current;
    const requestedIds = activeSoundIds.filter((soundId) => SCENE_FACTORIES[soundId]);

    if (!playing || requestedIds.length === 0) {
      if (!context || !masterGain) {
        return;
      }

      rampGain(masterGain, 0, MASTER_FADE_SECONDS);
      const completed = await wait(MASTER_FADE_SECONDS * 1000, tokenRef, token);

      if (!completed) {
        return;
      }

      scenes.forEach((scene) => {
        scene.stop();
      });
      scenes.clear();
      return;
    }

    await ensureContext();

    if (token !== tokenRef.current) {
      return;
    }

    if (quality !== currentQuality && scenes.size > 0) {
      rampGain(masterGain, 0, 0.4);
      const completed = await wait(420, tokenRef, token);

      if (!completed) {
        return;
      }

      scenes.forEach((scene) => {
        scene.stop();
      });
      scenes.clear();
      currentQuality = quality;
    } else {
      currentQuality = quality;
    }

    const qualityScale = quality === "high" ? 1 : 0.62;
    rampGain(masterGain, masterVolume, MASTER_FADE_SECONDS);

    requestedIds.forEach((soundId) => {
      let scene = scenes.get(soundId);

      if (!scene) {
        scene = SCENE_FACTORIES[soundId](context, qualityScale);
        scene.output.connect(masterGain);
        scenes.set(soundId, scene);
      }

      rampGain(scene.output, soundVolumes[soundId] ?? 0.4, SCENE_FADE_SECONDS);
    });

    const removalPromises = [];
    scenes.forEach((scene, soundId) => {
      if (requestedIds.includes(soundId)) {
        return;
      }

      rampGain(scene.output, 0, 0.45);
      removalPromises.push(
        wait(460, tokenRef, token).then((completed) => {
          if (!completed) {
            return;
          }

          const currentScene = scenes.get(soundId);

          if (currentScene === scene) {
            scene.stop();
            scenes.delete(soundId);
          }
        }),
      );
    });

    await Promise.all(removalPromises);
  }

  async function dispose() {
    tokenRef.current += 1;
    scenes.forEach((scene) => {
      scene.stop();
    });
    scenes.clear();

    if (masterGain) {
      try {
        masterGain.disconnect();
      } catch (error) {
        // Ignore disconnect errors during cleanup.
      }
    }

    if (context && context.state !== "closed") {
      await context.close();
    }
  }

  return {
    applyState,
    dispose,
  };
}
