/**
 * Osmos motion — library-wide magnetic hover + tactile press.
 * Subtle lerp follow, springy press, GPU transforms. Opt out: data-osmos-motion="off"
 */
(function () {
  const STYLE_ID = "osmos-motion-style";
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");

  const TOKENS = {
    easeOut: "cubic-bezier(0.22, 1, 0.36, 1)",
    easeSpring: "cubic-bezier(0.34, 1.4, 0.64, 1)",
    easeSoft: "cubic-bezier(0.32, 0.72, 0, 1)",
    durationFast: 0.16,
    durationPress: 0.18,
    magneticMax: 6,
    magneticStrength: 0.16,
    magneticLerp: 0.16,
    releaseLerp: 0.2,
    pressLerp: 0.38,
    pressScale: 0.98,
    pressSquishY: 0.985,
    pressSquishX: 1.01,
  };

  const SELECTOR = [
    "button:not(:disabled):not([data-osmos-motion='off'])",
    "a[href]:not([data-osmos-motion='off'])",
    "[role='button']:not([data-osmos-motion='off'])",
    "[data-osmos-magnetic]",
    ".control:not(:disabled)",
    ".osmos-magnetic",
  ].join(",");

  const SKIP_CLOSEST = [
    "[data-osmos-motion='off']",
    "[data-scroll]",
    ".card-slot",
    ".card-stretch",
    ".process-card",
  ].join(",");

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
:root {
  --osmos-ease-out: ${TOKENS.easeOut};
  --osmos-ease-spring: ${TOKENS.easeSpring};
  --osmos-ease-soft: ${TOKENS.easeSoft};
  --osmos-duration-fast: ${TOKENS.durationFast}s;
  --osmos-duration-press: ${TOKENS.durationPress}s;
  --osmos-press-scale: ${TOKENS.pressScale};
  --osmos-magnetic-max: ${TOKENS.magneticMax}px;
}

.osmos-motion-target {
  touch-action: manipulation;
  backface-visibility: hidden;
  -webkit-tap-highlight-color: transparent;
}

.osmos-motion-target.osmos-is-active {
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  .osmos-motion-target.osmos-is-active {
    will-change: auto;
  }
}
`;
    document.head.appendChild(style);
  }

  function shouldSkip(el) {
    if (!el || el.nodeType !== 1) return true;
    if (el.dataset.osmosMotion === "off") return true;
    if (el.closest(SKIP_CLOSEST)) return true;
    // Scroll-scrubbed showcase cards — leave those to GSAP.
    if (
      el.classList.contains("card") &&
      el.closest(".stage, .gallery, [data-scroll-container], .process-steps")
    ) {
      return true;
    }
    return false;
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function isPressable(el) {
    return el.matches(
      "button, [role='button'], .control, a[href], [data-osmos-press]"
    );
  }

  function createTarget(el) {
    if (el.__osmosMotion || shouldSkip(el)) return null;
    el.__osmosMotion = true;
    el.classList.add("osmos-motion-target");

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
        el.classList.remove("osmos-is-active");
        return;
      }

      el.classList.add("osmos-is-active");
      el.style.transform = `translate3d(${state.mx.toFixed(2)}px, ${state.my.toFixed(2)}px, 0) scale(${state.sx.toFixed(4)}, ${state.sy.toFixed(4)})`;
    }

    function tick() {
      if (REDUCED.matches) {
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
      if (REDUCED.matches || state.pressing) return;
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
      if (REDUCED.matches || !isPressable(el)) return;
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

    return state;
  }

  function enhance(root = document) {
    if (REDUCED.matches) return;
    root.querySelectorAll(SELECTOR).forEach((el) => createTarget(el));
  }

  function boot() {
    injectStyles();
    enhance(document);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.matches?.(SELECTOR)) createTarget(node);
          else if (node.querySelectorAll) enhance(node);
        });
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  window.OsmosMotion = { enhance, tokens: TOKENS };
})();
