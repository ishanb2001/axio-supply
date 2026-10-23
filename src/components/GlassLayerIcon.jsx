import { useEffect, useRef } from "react";

export default function GlassLayerIcon({ kind = "motion", className = "" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let alive = true;
    let teardown = () => {};
    const boot = () => {
      if (!alive) return;
      import("./glassScene.js").then(({ mountGlassScene, scheduleGlassBoot }) => {
        if (!alive) return;
        scheduleGlassBoot(() => {
          if (!alive) return;
          teardown = mountGlassScene(canvas, kind);
        });
      });
    };
    const nearViewport = () => {
      const rect = canvas.getBoundingClientRect();
      return rect.bottom > -160 && rect.top < window.innerHeight + 160;
    };
    const gate = new IntersectionObserver(
      ([entry]) => {
        if (!alive || !entry?.isIntersecting) return;
        gate.disconnect();
        window.removeEventListener("scroll", onScroll, { capture: true });
        boot();
      },
      { rootMargin: "160px 0px" }
    );
    const onScroll = () => {
      if (!alive || !nearViewport()) return;
      gate.disconnect();
      window.removeEventListener("scroll", onScroll, { capture: true });
      boot();
    };

    gate.observe(canvas);
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    onScroll();

    return () => {
      alive = false;
      gate.disconnect();
      window.removeEventListener("scroll", onScroll, { capture: true });
      teardown();
    };
  }, [kind]);

  return (
    <canvas
      ref={canvasRef}
      className={`glass-layer-icon ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
