import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import "./SortMenu.css";

gsap.registerPlugin(CustomEase);

const OPEN_EASE = CustomEase.create("sortOpen", "M0,0 C0.16,1 0.3,1 1,1");

export default function SortMenu({ items, value, onChange }) {
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const current = items.find((item) => item.id === value) || items[0];

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    gsap.set(panel, { height: 0, autoAlpha: 0, overflow: "hidden" });
  }, []);

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

  function openPanel() {
    const panel = panelRef.current;
    if (!panel) return;
    setOpen(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.set(panel, { height: "auto", autoAlpha: 1 });
    const height = panel.offsetHeight;
    gsap.fromTo(
      panel,
      { height: 0, autoAlpha: 0 },
      {
        height,
        autoAlpha: 1,
        duration: reduced ? 0 : 0.55,
        ease: OPEN_EASE,
        overwrite: "auto",
      }
    );
    gsap.fromTo(
      panel.querySelectorAll(".sort-menu__option"),
      { y: 10, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: reduced ? 0 : 0.45,
        stagger: 0.05,
        delay: reduced ? 0 : 0.06,
        ease: OPEN_EASE,
        overwrite: "auto",
      }
    );
  }

  function close() {
    const panel = panelRef.current;
    if (!panel) {
      setOpen(false);
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.to(panel.querySelectorAll(".sort-menu__option"), {
      y: 6,
      autoAlpha: 0,
      duration: reduced ? 0 : 0.18,
      stagger: 0.02,
      ease: "power2.in",
      overwrite: "auto",
    });
    gsap.to(panel, {
      height: 0,
      autoAlpha: 0,
      duration: reduced ? 0 : 0.38,
      ease: "power2.inOut",
      overwrite: "auto",
      onComplete: () => setOpen(false),
    });
  }

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
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
