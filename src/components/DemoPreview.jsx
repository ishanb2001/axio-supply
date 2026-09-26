import { useEffect, useRef, useState } from "react";
import { demoSrc } from "../data/projects";

const DEVICE_SIZES = {
  desktop: { width: 1280, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
};

export default function DemoPreview({
  file,
  background = "#f3f3f3",
  interactive = false,
  device = "desktop",
  title = "Demo preview",
  className = "",
}) {
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);
  const size = DEVICE_SIZES[device] || DEVICE_SIZES.desktop;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      setScale(Math.min(width / size.width, height / size.height));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [size.width, size.height, device]);

  return (
    <div
      ref={wrapRef}
      className={`demo-preview demo-preview--live demo-preview--${device} ${className}`.trim()}
      style={{ background }}
    >
      <iframe
        src={demoSrc(file)}
        title={title}
        loading="lazy"
        tabIndex={interactive ? 0 : -1}
        style={{
          width: size.width,
          height: size.height,
          transform: `scale(${scale})`,
        }}
        sandbox={
          interactive
            ? "allow-scripts allow-same-origin allow-forms allow-pointer-lock"
            : "allow-scripts allow-same-origin"
        }
      />
    </div>
  );
}
