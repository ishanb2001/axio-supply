import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import "./SortMenu.css";

gsap.registerPlugin(useGSAP);

const OPEN_EASE = "power3.out";
const PANEL_ORIGIN = "right top";
const PANEL_SCALE_FROM = 0.2;

export default function SortMenu({ items, value, onChange }) {
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const current = items.find((item) => item.id === value) || items[0];

  const { contextSafe } = useGSAP(() => {
    const panel = panelRef.current;
    if (!panel) return;
    gsap.set(panel, { scale: PANEL_SCALE_FROM, autoAlpha: 0, transformOrigin: PANEL_ORIGIN });
  }, { scope: rootRef });

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) close();
    };
    const onKey = (event) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openPanel = contextSafe(() => {
    const panel = panelRef.current;
    if (!panel) return;
    setOpen(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const labels = panel.querySelectorAll(".sort-menu__option-text");
    gsap.killTweensOf([panel, ...labels]);
    gsap.fromTo(
      panel,
      { scale: PANEL_SCALE_FROM, autoAlpha: 0, transformOrigin: PANEL_ORIGIN },
      {
        scale: 1,
        autoAlpha: 1,
        duration: reduced ? 0 : 0.48,
        ease: OPEN_EASE,
        overwrite: "auto",
        transformOrigin: PANEL_ORIGIN,
      }
    );
    gsap.fromTo(
      labels,
      { yPercent: 110 },
      {
        yPercent: 0,
        duration: reduced ? 0 : 0.46,
        stagger: 0.05,
        ease: OPEN_EASE,
        overwrite: "auto",
      }
    );
  });

  const close = contextSafe(() => {
    const panel = panelRef.current;
    if (!panel) {
      setOpen(false);
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const labels = panel.querySelectorAll(".sort-menu__option-text");
    gsap.killTweensOf([panel, ...labels]);
    gsap.to(labels, {
      yPercent: 40,
      duration: reduced ? 0 : 0.16,
      stagger: 0.02,
      ease: "power2.in",
      overwrite: "auto",
    });
    gsap.to(panel, {
      scale: PANEL_SCALE_FROM,
      autoAlpha: 0,
      transformOrigin: PANEL_ORIGIN,
      duration: reduced ? 0 : 0.28,
      ease: "power2.in",
      overwrite: "auto",
      onComplete: () => setOpen(false),
    });
  });

  return (
    <div className={`sort-menu${open ? " is-open" : ""}`} ref={rootRef}>
      <button
        className="sort-menu__trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close() : openPanel())}
      >
        <span>{current?.label}</span>
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.2 4.2 6 8l3.8-3.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
      <div className="sort-menu__panel" ref={panelRef} role="listbox" aria-label="Sort components">
        {items.map((item) => (
          <button
            key={item.id}
            className={`sort-menu__option${item.id === value ? " is-active" : ""}`}
            type="button"
            role="option"
            aria-selected={item.id === value}
            onClick={() => {
              if (item.id !== value) onChange(item.id);
              close();
            }}
          >
            <span className="sort-menu__option-mask">
              <span className="sort-menu__option-text">{item.label}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
