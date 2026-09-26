/**
 * Subtle magnetic hover + tactile press for interactive controls.
 * GPU translate/scale via rAF lerp. Opt out: data-magnetic="off"
 */

const TOKENS = {
  magneticMax: 7,
  magneticStrength: 0.18,
  magneticLerp: 0.16,
  releaseLerp: 0.2,
  pressLerp: 0.36,
  pressScale: 0.98,
  pressSquishY: 0.985,
  pressSquishX: 1.012,
};

const SELECTOR = [
  "button:not(:disabled):not([data-magnetic='off'])",
  "a.magnetic:not([data-magnetic='off'])",
  "[data-magnetic]:not([data-magnetic='off'])",
  ".image-row__control:not(:disabled)",
].join(",");

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function isPressable(el) {
  return el.matches("button, [role='button'], a[href], [data-magnetic-press], .image-row__control");
}

function enhanceElement(el) {
  if (!el || el.__magneticMotion || el.dataset.magnetic === "off") return;
  el.__magneticMotion = true;
  el.classList.add("magnetic-target");

  const state = {
    mx: 0,
    my: 0,
    tx: 0,
    ty: 0,
    sx: 1,
    sy: 1,
    tsx: 1,
    tsy: 1,
    hovering: false,
    pressing: false,
    raf: 0,
  };

  function write() {
    const idle =
      Math.abs(state.mx) < 0.02 &&
      Math.abs(state.my) < 0.02 &&
      Math.abs(state.sx - 1) < 0.001 &&
      Math.abs(state.sy - 1) < 0.001;

    if (idle && !state.hovering && !state.pressing) {
      el.style.removeProperty("transform");
      el.classList.remove("is-magnetic-active");
      return;
    }

    el.classList.add("is-magnetic-active");
    el.style.transform = `translate3d(${state.mx.toFixed(2)}px, ${state.my.toFixed(2)}px, 0) scale(${state.sx.toFixed(4)}, ${state.sy.toFixed(4)})`;
  }

  function tick() {
    if (prefersReducedMotion()) {
      state.mx = state.my = 0;
      state.sx = state.sy = 1;
      state.tx = state.ty = 0;
      state.tsx = state.tsy = 1;
      write();
      state.raf = 0;
      return;
    }

    const posLerp = state.hovering ? TOKENS.magneticLerp : TOKENS.releaseLerp;
    const scaleLerp = state.pressing ? TOKENS.pressLerp : TOKENS.releaseLerp;

    state.mx += (state.tx - state.mx) * posLerp;
    state.my += (state.ty - state.my) * posLerp;
    state.sx += (state.tsx - state.sx) * scaleLerp;
    state.sy += (state.tsy - state.sy) * scaleLerp;
    write();

    const settled =
      Math.abs(state.tx - state.mx) < 0.04 &&
      Math.abs(state.ty - state.my) < 0.04 &&
      Math.abs(state.tsx - state.sx) < 0.0008 &&
      Math.abs(state.tsy - state.sy) < 0.0008;

    if (!settled || state.hovering || state.pressing) {
      state.raf = requestAnimationFrame(tick);
    } else {
      state.mx = state.tx;
      state.my = state.ty;
      state.sx = state.tsx;
      state.sy = state.tsy;
      write();
      state.raf = 0;
    }
  }

  function start() {
    if (!state.raf) state.raf = requestAnimationFrame(tick);
  }

  function onEnter() {
    state.hovering = true;
    start();
  }

  function onLeave() {
    state.hovering = false;
    state.pressing = false;
    state.tx = 0;
    state.ty = 0;
    state.tsx = 1;
    state.tsy = 1;
    start();
  }

  function onMove(event) {
    if (prefersReducedMotion() || state.pressing) return;
    const rect = el.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width * 0.5);
    const dy = event.clientY - (rect.top + rect.height * 0.5);
    const max = TOKENS.magneticMax;
    state.tx = clamp(dx * TOKENS.magneticStrength, -max, max);
    state.ty = clamp(dy * TOKENS.magneticStrength, -max, max);
    start();
  }

  function onDown(event) {
    if (event.button != null && event.button !== 0) return;
    if (prefersReducedMotion() || !isPressable(el)) return;
    state.pressing = true;
    state.tx *= 0.4;
    state.ty *= 0.4;
    state.tsx = TOKENS.pressSquishX * TOKENS.pressScale;
    state.tsy = TOKENS.pressSquishY * TOKENS.pressScale;
    start();
  }

  function onUp() {
    if (!state.pressing) return;
    state.pressing = false;
    state.tsx = 1;
    state.tsy = 1;
    if (!state.hovering) {
      state.tx = 0;
      state.ty = 0;
    }
    start();
  }

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
    el.style.removeProperty("transform");
    el.classList.remove("is-magnetic-active", "magnetic-target");
    delete el.__magneticMotion;
  };
}

export function enhanceMagnetic(root = document) {
  if (prefersReducedMotion()) return () => {};
  const cleanups = [];
  root.querySelectorAll(SELECTOR).forEach((el) => {
    const cleanup = enhanceElement(el);
    if (cleanup) cleanups.push(cleanup);
  });
  return () => cleanups.forEach((fn) => fn());
}

export function startMagneticMotion(root = document) {
  if (typeof window === "undefined" || prefersReducedMotion()) {
    return () => {};
  }

  const cleanups = new Set();
  let stopped = false;

  function scan(node = root) {
    if (stopped) return;
    const scope = node?.querySelectorAll ? node : root;
    scope.querySelectorAll?.(SELECTOR).forEach((el) => {
      if (el.__magneticMotion) return;
      const cleanup = enhanceElement(el);
      if (cleanup) cleanups.add(cleanup);
    });
    if (node?.matches?.(SELECTOR) && !node.__magneticMotion) {
      const cleanup = enhanceElement(node);
      if (cleanup) cleanups.add(cleanup);
    }
  }

  scan(root);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) scan(node);
      });
    }
  });

  observer.observe(root === document ? document.documentElement : root, {
    childList: true,
    subtree: true,
  });

  return () => {
    stopped = true;
    observer.disconnect();
    cleanups.forEach((fn) => fn());
    cleanups.clear();
  };
}

export { TOKENS as magneticTokens };
