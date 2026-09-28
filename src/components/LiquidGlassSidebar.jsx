import { useLayoutEffect, useRef, useState } from "react";
import "./LiquidGlassSidebar.css";

const ITEMS = [
  {
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
      </svg>
    ),
  },
  {
    label: "Search",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
  },
  {
    label: "Sales Analytics",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3" />
      </svg>
    ),
  },
  {
    label: "Notification",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 16V10a6 6 0 1 1 12 0v6l1.5 2h-15zM10 19a2 2 0 0 0 4 0" />
      </svg>
    ),
  },
  {
    label: "Account Settings",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
      </svg>
    ),
  },
];

export default function LiquidGlassSidebar() {
  const navRef = useRef(null);
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState(null);
  const [activeBox, setActiveBox] = useState({ top: 0, height: 0 });
  const [hoverBox, setHoverBox] = useState({ top: 0, height: 0 });

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const button = nav.querySelectorAll("button")[active];
    if (!button) return;
    setActiveBox({ top: button.offsetTop, height: button.offsetHeight });
  }, [active]);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav || hover == null) return;
    const button = nav.querySelectorAll("button")[hover];
    if (!button) return;
    setHoverBox({ top: button.offsetTop, height: button.offsetHeight });
  }, [hover]);

  return (
    <nav
      className="liquid-sidebar"
      ref={navRef}
      aria-label="Sidebar"
      onPointerLeave={() => setHover(null)}
    >
      <span
        className={`liquid-sidebar__pill liquid-sidebar__pill--hover${hover != null && hover !== active ? " is-on" : ""}`}
        style={{ top: hoverBox.top, height: hoverBox.height }}
        aria-hidden="true"
      />
      <span
        className="liquid-sidebar__pill liquid-sidebar__pill--active"
        style={{ top: activeBox.top, height: activeBox.height }}
        aria-hidden="true"
      />
      {ITEMS.map((item, index) => (
        <button
          key={item.label}
          type="button"
          aria-current={index === active ? "page" : undefined}
          onPointerEnter={() => setHover(index)}
          onClick={() => setActive(index)}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </nav>
  );
}
