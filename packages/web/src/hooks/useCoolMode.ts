// from https://github.com/rainbow-me/rainbowkit/blob/32c67201570efb959446485d18bbc106589f9909/packages/rainbowkit/src/components/RainbowKitProvider/useCoolMode.ts

import { useEffect, useRef } from 'react';
import { useAsyncImage } from './useAsyncImage';

interface Particle {
  element: HTMLElement;
  left: number; // px
  top: number; // px
  size: number; // px
  vx: number; // px/frame
  vy: number; // px/frame (negative up)
}

export interface CoolSprayOptions {
  // kinematics
  meanAngleDeg?: number; // 0=right, -90=up
  spreadDeg?: number; // half-cone (deg)
  minSpeed?: number; // px/frame
  maxSpeed?: number; // px/frame
  gravity?: number; // px/frame^2
  drag?: number; // 0..1 linear
  mirrorByMouseDirection?: boolean; // auto flip L/R with mouse
  alignWithVelocity?: boolean; // rotate sprite to follow trajectory
  headingOffsetDeg?: number; // adjust sprite's base orientation

  // burst-only emission with intra-burst flux
  burstCount?: number; // total particles per burst (default 30)
  burstIntervalSec?: number; // seconds between burst starts (default 0.5)
  initialBurstDelaySec?: number; // delay before first burst (default 0)
  burstDurationSec?: number; // spread particles over this duration (default 0.18s)
  burstJitterSec?: number; // extra randomness added to interval (default 0.03s)

  maxParticles?: number; // cap simultaneous particles (default 220)
}

export function useCoolMode(
  imageUrl: string | (() => Promise<string>),
  coolModeEnabled = true,
  options: CoolSprayOptions = {}
) {
  const ref = useRef<HTMLElement>(null);
  const resolvedImageUrl = useAsyncImage(imageUrl);

  useEffect(() => {
    if (coolModeEnabled && ref.current && resolvedImageUrl) {
      return makeElementCool(ref.current, resolvedImageUrl, options);
    }
  }, [coolModeEnabled, resolvedImageUrl, options]);

  return ref as React.MutableRefObject<HTMLElement | null>;
}

const getContainer = () => {
  const id = "_rk_coolMode";
  const existingContainer = document.getElementById(id);
  if (existingContainer) return existingContainer;
  const container = document.createElement("div");
  container.id = id;
  container.style.cssText = [
    "overflow:hidden",
    "position:fixed",
    "height:100%",
    "top:0",
    "left:0",
    "right:0",
    "bottom:0",
    "pointer-events:none",
    "z-index:2147483647",
  ].join(";");
  document.body.appendChild(container);
  return container;
};

let instanceCounter = 0;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;
const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function makeElementCool(
  element: HTMLElement,
  imageUrl: string,
  opts: CoolSprayOptions
): () => void {
  instanceCounter++;

  // defaults (burst-only)
  const sizes = [15, 20, 25, 35, 45];
  const maxParticles = opts.maxParticles ?? 220;

  const meanAngleDeg = opts.meanAngleDeg ?? -60;
  const spreadDeg = clamp(opts.spreadDeg ?? 12, 0, 89);
  const minSpeed = opts.minSpeed ?? 18;
  const maxSpeed = opts.maxSpeed ?? 32;
  const gravity = opts.gravity ?? 0.7;
  const drag = clamp(opts.drag ?? 0.02, 0, 0.2);
  const mirrorByMouseDirection = opts.mirrorByMouseDirection ?? true;
  const alignWithVelocity = opts.alignWithVelocity ?? true;
  const headingOffsetDeg = opts.headingOffsetDeg ?? 90; // SVG points up

  const burstCount = Math.max(1, Math.floor(opts.burstCount ?? 30));
  const burstIntervalSec = Math.max(0.05, opts.burstIntervalSec ?? 0.5);
  const initialBurstDelaySec = Math.max(0, opts.initialBurstDelaySec ?? 0);
  const burstDurationSec = Math.max(0.05, opts.burstDurationSec ?? 0.18);
  const burstJitterSec = Math.max(0, opts.burstJitterSec ?? 0.03);

  let particles: Particle[] = [];
  let autoAddParticle = false;
  let mouseX = 0;
  let mouseY = 0;
  let prevMouseX = 0;
  let facingSign = 1; // +1 right, -1 left
  let lastTs = 0;
  let nextBurstAt = 0; // ms timestamp for next burst start

  // intra-burst stagger state
  let burstEmitRemaining = 0; // how many left to emit in current burst
  let burstAcc = 0; // accumulator within the burst

  const container = getContainer();

  function createParticle() {
    const size = sizes[(Math.random() * sizes.length) | 0];
    const top = mouseY - size / 2;
    const left = mouseX - size / 2;

    let angleDeg = meanAngleDeg + rand(-spreadDeg, spreadDeg);
    if (mirrorByMouseDirection && facingSign < 0) angleDeg = 180 - angleDeg; // mirror horizontally
    const angle = toRad(angleDeg);

    const speed = rand(minSpeed, maxSpeed);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed; // negative up

    const particle = document.createElement("div");
    particle.innerHTML = `<img src="${imageUrl}" width="${size}" height="${size}" style="border-radius:25%;transform-origin:50% 50%;image-rendering:auto;">`;
    const style = particle.style;
    style.position = "absolute";
    style.willChange = "transform";
    style.top = `${top}px`;
    style.left = `${left}px`;

    container.appendChild(particle);
    particles.push({ element: particle, left, top, size, vx, vy });
  }

  function updateParticles() {
    const bottomLimit = Math.max(window.innerHeight, document.body.clientHeight);
    // iterate backwards to allow in-place removal without copying the array
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vx *= 1 - drag;
      p.vy = p.vy * (1 - drag) + gravity;
      p.left += p.vx;
      p.top += p.vy;

      if (p.top >= bottomLimit + p.size) {
        p.element.remove();
        particles.splice(i, 1);
        continue;
      }

      const angleDeg = toDeg(Math.atan2(p.vy, p.vx));
      const rotateDeg = alignWithVelocity ? angleDeg + headingOffsetDeg : 0;

      const style = p.element.style;
      style.top = `${p.top}px`;
      style.left = `${p.left}px`;
      style.transform = `rotate(${rotateDeg}deg)`;
    }
  }

  let animationFrame: number | undefined;
  function loop(ts?: number) {
    const now = ts ?? performance.now();
    if (!lastTs) lastTs = now;
    const dt = (now - lastTs) / 1000;
    lastTs = now;

    if (autoAddParticle) {
      const room = maxParticles - particles.length;

      // start new burst if time and nothing currently scheduled
      if (now >= nextBurstAt && burstEmitRemaining === 0) {
        burstEmitRemaining = burstCount;
        burstAcc = 0;
        const jitterMs = burstJitterSec > 0 ? Math.random() * burstJitterSec * 1000 : 0;
        nextBurstAt = now + burstIntervalSec * 1000 + jitterMs;
      }

      // drain current burst over burstDurationSec (staggered flux)
      if (burstEmitRemaining > 0 && room > 0) {
        const rate = burstCount / burstDurationSec; // particles per second within burst
        const noise = (Math.random() - 0.5) * rate * 0.05; // ±5% micro jitter
        burstAcc += Math.max(0, rate + noise) * dt;
        let n = Math.min(Math.floor(burstAcc), burstEmitRemaining, room);
        const frac = burstAcc - Math.floor(burstAcc);
        if (n < burstEmitRemaining && n < room && Math.random() < frac) n += 1; // probabilistic rounding
        for (let i = 0; i < n; i++) createParticle();
        burstAcc = Math.max(0, burstAcc - n);
        burstEmitRemaining -= n;
      }
    }

    updateParticles();
    animationFrame = requestAnimationFrame(loop);
  }
  loop();

  // --- Input handling (pointer events only, no fallbacks) --------------------
  const onMove = (e: PointerEvent) => {
    prevMouseX = mouseX;
    mouseX = e.clientX;
    mouseY = e.clientY;
    const dx = mouseX - prevMouseX;
    if (Math.abs(dx) > 1) facingSign = dx >= 0 ? 1 : -1;
  };

  const onDown = (e: PointerEvent) => {
    onMove(e);
    autoAddParticle = true;
    const now = performance.now();
    nextBurstAt = now + initialBurstDelaySec * 1000;
    burstEmitRemaining = 0;
    burstAcc = 0;
  };

  const stopEmission = () => {
    autoAddParticle = false;
    burstEmitRemaining = 0;
    burstAcc = 0;
  };

  const onVisibility = () => {
    if (document.hidden) stopEmission();
  };

  element.addEventListener("pointermove", onMove, { passive: true });
  element.addEventListener("pointerdown", onDown);

  window.addEventListener("pointerup", stopEmission, { passive: true });
  window.addEventListener("pointercancel", stopEmission, { passive: true });
  window.addEventListener("blur", stopEmission, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  element.addEventListener("pointerleave", stopEmission);

  return () => {
    element.removeEventListener("pointermove", onMove);
    element.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", stopEmission);
    window.removeEventListener("pointercancel", stopEmission);
    window.removeEventListener("blur", stopEmission);
    document.removeEventListener("visibilitychange", onVisibility);
    element.removeEventListener("pointerleave", stopEmission);

    const interval = setInterval(() => {
      if (animationFrame && particles.length === 0) {
        cancelAnimationFrame(animationFrame);
        clearInterval(interval);
        if (--instanceCounter === 0) {
          const c = document.getElementById("_rk_coolMode");
          if (c) c.remove();
        }
      }
    }, 500);
  };
}
