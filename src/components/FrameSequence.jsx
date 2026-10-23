import { useEffect, useRef } from "react";
import "./FrameSequence.css";

const FRAME_COUNT = 270;
const FPS = 12;

function frameSrc(index) {
  return `/frames/sequence/${String(index).padStart(5, "0")}.jpg`;
}

export default function FrameSequence() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: false });
    const images = new Array(FRAME_COUNT);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let cancelled = false;
    let primed = false;
    let visible = false;
    let playing = false;
    let frame = 0;
    let raf = 0;
    let lastTime = 0;

    const resize = () => {
      const image = images.find((item) => item?.naturalWidth);
      const width = canvas.clientWidth;
      if (!width) return;
      const ratio = image ? image.naturalHeight / image.naturalWidth : 1024 / 983;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(width * ratio * dpr);
    };

    const draw = (index) => {
      const image = images[index];
      if (!image?.complete || !image.naturalWidth || !canvas.width) return;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    };

    const stop = () => {
      playing = false;
      cancelAnimationFrame(raf);
    };

    const tick = (time) => {
      if (cancelled || !playing) return;
      if (!lastTime) lastTime = time;
      const interval = 1000 / FPS;
      const elapsed = time - lastTime;
      if (elapsed >= interval) {
        const next = (frame + 1) % FRAME_COUNT;
        if (images[next]?.naturalWidth) {
          frame = next;
          lastTime = time - (elapsed % interval);
          draw(frame);
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const playIfReady = () => {
      if (cancelled || reduceMotion || !primed || !visible || playing) return;
      playing = true;
      lastTime = 0;
      raf = requestAnimationFrame(tick);
    };

    const loadFrame = (index) =>
      new Promise((resolve) => {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => {
          if (!cancelled && index === 0) {
            primed = true;
            resize();
            draw(0);
            queueMicrotask(() => {
              updateVisibility();
              playIfReady();
            });
          }
          resolve();
        };
        image.onerror = () => resolve();
        image.src = frameSrc(index);
        images[index] = image;
      });

    const queue = Array.from({ length: FRAME_COUNT }, (_, index) => index);
    const pump = async () => {
      while (queue.length && !cancelled) {
        await loadFrame(queue.shift());
      }
    };
    Array.from({ length: 6 }, () => pump());

    const updateVisibility = () => {
      const rect = canvas.getBoundingClientRect();
      const shown = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      const nextVisible = rect.height > 0 && shown / rect.height >= 0.2;
      if (nextVisible === visible) return;
      visible = nextVisible;
      if (visible) playIfReady();
      else stop();
    };

    const onResize = () => {
      resize();
      draw(frame);
      updateVisibility();
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(canvas);
    window.addEventListener("scroll", updateVisibility, { capture: true, passive: true });
    updateVisibility();

    return () => {
      cancelled = true;
      stop();
      resizeObserver.disconnect();
      window.removeEventListener("scroll", updateVisibility, { capture: true });
    };
  }, []);

  return (
    <div className="home-frame">
      <canvas
        ref={canvasRef}
        className="home-frame__canvas"
        role="img"
        aria-label="Animated sequence"
      />
    </div>
  );
}
