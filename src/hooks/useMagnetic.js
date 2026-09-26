import { useEffect, useRef } from "react";

const DEFAULTS = {
  max: 12,
  strength: 0.32,
  lerp: 0.18,
  pressScale: 0.97,
};

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Makes an element float toward the cursor on hover (lerped).
 * Returns a ref to put on a button / clickable.
 */
export function useMagnetic(options = {}) {
  const ref = useRef(null);
  const opts = { ...DEFAULTS, ...options };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const state = {
      mx: 0,
      my: 0,
      tx: 0,
      ty: 0,
      sx: 1,
      tsx: 1,
      hovering: false,
      pressing: false,
      raf: 0,
    };

    const write = () => {
      const idle =
        Math.abs(state.mx) < 0.03 &&
        Math.abs(state.my) < 0.03 &&
        Math.abs(state.sx - 1) < 0.001;

      if (idle && !state.hovering && !state.pressing) {
        el.style.transform = "";
        return;
      }

      el.style.transform = `translate3d(${state.mx.toFixed(2)}px, ${state.my.toFixed(2)}px, 0) scale(${state.sx.toFixed(4)})`;
    };

    const tick = () => {
      const lerp = state.pressing ? 0.4 : opts.lerp;
      state.mx += (state.tx - state.mx) * lerp;
      state.my += (state.ty - state.my) * lerp;
      state.sx += (state.tsx - state.sx) * (state.pressing ? 0.4 : 0.22);
      write();

      const settled =
        Math.abs(state.tx - state.mx) < 0.05 &&
        Math.abs(state.ty - state.my) < 0.05 &&
        Math.abs(state.tsx - state.sx) < 0.001;

      if (!settled || state.hovering || state.pressing) {
        state.raf = requestAnimationFrame(tick);
      } else {
        state.mx = state.tx;
        state.my = state.ty;
        state.sx = state.tsx;
        write();
        state.raf = 0;
      }
    };

    const start = () => {
      if (!state.raf) state.raf = requestAnimationFrame(tick);
    };

    const onEnter = () => {
      state.hovering = true;
      start();
    };

    const onLeave = () => {
      state.hovering = false;
      state.pressing = false;
      state.tx = 0;
      state.ty = 0;
      state.tsx = 1;
      start();
    };

    const onMove = (event) => {
      if (state.pressing) return;
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width * 0.5);
      const dy = event.clientY - (rect.top + rect.height * 0.5);
      state.tx = clamp(dx * opts.strength, -opts.max, opts.max);
      state.ty = clamp(dy * opts.strength, -opts.max, opts.max);
      start();
    };

    const onDown = (event) => {
      if (event.button != null && event.button !== 0) return;
      state.pressing = true;
      state.tx *= 0.35;
      state.ty *= 0.35;
      state.tsx = opts.pressScale;
      start();
    };

    const onUp = () => {
      state.pressing = false;
      state.tsx = 1;
      if (!state.hovering) {
        state.tx = 0;
        state.ty = 0;
      }
      start();
    };

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);

    return () => {
      cancelAnimationFrame(state.raf);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.style.transform = "";
    };
  }, [opts.max, opts.strength, opts.lerp, opts.pressScale]);

  return ref;
}

/** Auto-enhances every button under a root element. */
export function useMagneticRoot() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const cleanups = new Map();

    const enhance = (el) => {
      if (!(el instanceof HTMLElement)) return;
      if (el.dataset.magnetic === "off") return;
      if (!el.matches("button:not(:disabled), [data-magnetic]")) return;
      if (cleanups.has(el)) return;

      // Local copy of magnetic behavior per element
      const state = {
        mx: 0,
        my: 0,
        tx: 0,
        ty: 0,
        sx: 1,
        tsx: 1,
        hovering: false,
        pressing: false,
        raf: 0,
      };

      const max = Number(el.dataset.magneticMax) || DEFAULTS.max;
      const strength = Number(el.dataset.magneticStrength) || DEFAULTS.strength;

      const write = () => {
        const idle =
          Math.abs(state.mx) < 0.03 &&
          Math.abs(state.my) < 0.03 &&
          Math.abs(state.sx - 1) < 0.001;
        if (idle && !state.hovering && !state.pressing) {
          el.style.transform = "";
          return;
        }
        el.style.transform = `translate3d(${state.mx.toFixed(2)}px, ${state.my.toFixed(2)}px, 0) scale(${state.sx.toFixed(4)})`;
      };

      const tick = () => {
        const lerp = state.pressing ? 0.4 : DEFAULTS.lerp;
        state.mx += (state.tx - state.mx) * lerp;
        state.my += (state.ty - state.my) * lerp;
        state.sx += (state.tsx - state.sx) * (state.pressing ? 0.4 : 0.22);
        write();
        const settled =
          Math.abs(state.tx - state.mx) < 0.05 &&
          Math.abs(state.ty - state.my) < 0.05 &&
          Math.abs(state.tsx - state.sx) < 0.001;
        if (!settled || state.hovering || state.pressing) {
          state.raf = requestAnimationFrame(tick);
        } else {
          state.mx = state.tx;
          state.my = state.ty;
          state.sx = state.tsx;
          write();
          state.raf = 0;
        }
      };

      const start = () => {
        if (!state.raf) state.raf = requestAnimationFrame(tick);
      };

      const onEnter = () => {
        state.hovering = true;
        start();
      };
      const onLeave = () => {
        state.hovering = false;
        state.pressing = false;
        state.tx = 0;
        state.ty = 0;
        state.tsx = 1;
        start();
      };
      const onMove = (event) => {
        if (state.pressing) return;
        const rect = el.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width * 0.5);
        const dy = event.clientY - (rect.top + rect.height * 0.5);
        state.tx = clamp(dx * strength, -max, max);
        state.ty = clamp(dy * strength, -max, max);
        start();
      };
      const onDown = (event) => {
        if (event.button != null && event.button !== 0) return;
        state.pressing = true;
        state.tx *= 0.35;
        state.ty *= 0.35;
        state.tsx = DEFAULTS.pressScale;
        start();
      };
      const onUp = () => {
        state.pressing = false;
        state.tsx = 1;
        if (!state.hovering) {
          state.tx = 0;
          state.ty = 0;
        }
        start();
      };

      el.addEventListener("pointerenter", onEnter);
      el.addEventListener("pointerleave", onLeave);
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerdown", onDown);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onUp);

      cleanups.set(el, () => {
        cancelAnimationFrame(state.raf);
        el.removeEventListener("pointerenter", onEnter);
        el.removeEventListener("pointerleave", onLeave);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerdown", onDown);
        el.removeEventListener("pointerup", onUp);
        el.removeEventListener("pointercancel", onUp);
        el.style.transform = "";
      });
    };

    const scan = () => {
      root.querySelectorAll("button:not(:disabled), [data-magnetic]").forEach(enhance);
    };

    scan();

    const observer = new MutationObserver(() => scan());
    observer.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cleanups.forEach((fn) => fn());
      cleanups.clear();
    };
  }, []);

  return rootRef;
}
