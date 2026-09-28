import { useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";
import { projects } from "../data/projects";
import BrandLogo from "./BrandLogo";
import "./LibrarySidebar.css";

gsap.registerPlugin(useGSAP, CustomEase);

const SLIDE_EASE = CustomEase.create("sidebarSlide", "0.77, 0, 0.18, 1");
const HOVER_EASE = CustomEase.create("sidebarHover", "0.4, 0, 0.2, 1");

function Icon({ name }) {
  if (name === "vault") {
    return (
      <span className="library-sidebar__vault-icon" aria-hidden="true">
        <svg viewBox="0 0 16 16" fill="none">
          <rect x="2.2" y="2.2" width="11.6" height="11.6" rx="2.2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="8" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </span>
    );
  }

  const paths = {
    snippets: (
      <>
        <rect x="4" y="3.5" width="10" height="12" rx="1.6" />
        <path d="M7 7.5h4M7 10.5h3" />
        <path d="M3.2 5.2 6 8.1l-2.8 2.8" />
      </>
    ),
    icons: (
      <>
        <path d="M4 5.2h10v9.2H4z" />
        <path d="M4 7.6h10" />
      </>
    ),
    learn: (
      <>
        <path d="M3.5 5.2c2.2-1.2 4.4-1.2 6.5 0 2.1-1.2 4.3-1.2 6.5 0v8.2c-2.2-1.1-4.4-1.1-6.5 0-2.1-1.1-4.3-1.1-6.5 0z" />
        <path d="M10 5.4v8.2" />
      </>
    ),
    easings: (
      <>
        <rect x="3.4" y="3.4" width="11.2" height="11.2" rx="1.6" />
        <path d="M5.4 11.6c2.2-6.4 7-6.4 7.2-1.2" />
      </>
    ),
    pack: (
      <>
        <path d="M9 3.4 14.4 6.2 9 9 3.6 6.2z" />
        <path d="M3.6 6.2V11L9 14.2V9" />
        <path d="M14.4 6.2V11L9 14.2" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export default function LibrarySidebar({
  category,
  onCategoryChange,
  onNavigate,
  query = "",
  onQueryChange,
  mobileOpen = false,
  onMobileClose,
}) {
  const rootRef = useRef(null);
  const backdropRef = useRef(null);
  const [activeId, setActiveId] = useState(category === "all" ? "all" : category);

  const categories = useMemo(() => {
    const counts = projects.reduce((map, project) => {
      map[project.cat] = (map[project.cat] || 0) + 1;
      return map;
    }, {});

    return Object.entries(counts)
      .map(([id, count]) => ({ id, count, label: id }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, []);

  useLayoutEffect(() => {
    if (category === "all" || categories.some((item) => item.id === category)) {
      setActiveId(category === "all" ? "all" : category);
    }
  }, [category, categories]);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const items = gsap.utils.toArray(".library-sidebar__item", root);
      const hoverEl = root.querySelector(".library-sidebar__hover");
      const activeEl = root.querySelector(".library-sidebar__active");
      const menu = root.querySelector(".library-sidebar__menu");
      if (!items.length || !hoverEl || !activeEl || !menu) return;

      const hoverPos = { top: 0, bottom: 0 };
      const activePos = { top: 0, bottom: 0 };

      const paint = (el, pos) => {
        gsap.set(el, { top: pos.top, height: Math.max(0, pos.bottom - pos.top) });
      };

      const move = (el, pos, item, travel) => {
        const targetTop = item.offsetTop;
        const targetBottom = targetTop + item.offsetHeight;
        const visible = Number(gsap.getProperty(el, "opacity")) > 0.05;
        if (el === hoverEl) {
          gsap.to(el, { autoAlpha: 1, duration: reduced ? 0 : 0.16, ease: "power2.out", overwrite: "auto" });
        }
        if (reduced || !visible) {
          pos.top = targetTop;
          pos.bottom = targetBottom;
          paint(el, pos);
          gsap.set(el, { autoAlpha: 1, scaleX: 1 });
          return;
        }
        gsap.killTweensOf(pos);
        const duration = travel ? 0.55 : 0.32;
        gsap.to(pos, {
          top: targetTop,
          bottom: targetBottom,
          duration,
          ease: travel ? SLIDE_EASE : HOVER_EASE,
          onUpdate: () => paint(el, pos),
          overwrite: "auto",
        });
        if (travel) {
          gsap.killTweensOf(el, "scaleX");
          gsap.fromTo(el, { scaleX: 1 }, {
            scaleX: 0.975,
            duration: duration / 2,
            ease: SLIDE_EASE,
            yoyo: true,
            repeat: 1,
            overwrite: "auto",
          });
        }
      };

      const current = root.querySelector(".library-sidebar__item.is-active");
      if (current) {
        activePos.top = current.offsetTop;
        activePos.bottom = current.offsetTop + current.offsetHeight;
        paint(activeEl, activePos);
        gsap.set(activeEl, { autoAlpha: 1, scaleX: 1 });
      }

      const cleanups = items.map((item) => {
        const onEnter = () => {
          if (item.classList.contains("is-active")) {
            gsap.to(hoverEl, { autoAlpha: 0, duration: 0.16, overwrite: "auto" });
            return;
          }
          move(hoverEl, hoverPos, item, false);
        };
        const onPress = () => {
          gsap.to(item, { scale: 0.96, duration: 0.12, ease: "power2.out", overwrite: "auto" });
        };
        const onRelease = () => {
          gsap.to(item, { scale: 1, duration: 0.34, ease: SLIDE_EASE, overwrite: "auto" });
        };
        const onClick = () => {
          if (item.classList.contains("is-active")) return;
          gsap.to(hoverEl, { autoAlpha: 0, duration: 0.16, overwrite: "auto" });
          move(activeEl, activePos, item, true);
        };

        item.addEventListener("pointerenter", onEnter);
        item.addEventListener("pointerdown", onPress);
        item.addEventListener("pointerup", onRelease);
        item.addEventListener("pointerleave", onRelease);
        item.addEventListener("pointercancel", onRelease);
        item.addEventListener("click", onClick);

        return () => {
          item.removeEventListener("pointerenter", onEnter);
          item.removeEventListener("pointerdown", onPress);
          item.removeEventListener("pointerup", onRelease);
          item.removeEventListener("pointerleave", onRelease);
          item.removeEventListener("pointercancel", onRelease);
          item.removeEventListener("click", onClick);
        };
      });

      const onMenuLeave = () => {
        gsap.to(hoverEl, { autoAlpha: 0, duration: 0.2, ease: "power2.out", overwrite: "auto" });
      };
      menu.addEventListener("pointerleave", onMenuLeave);

      return () => {
        gsap.killTweensOf(hoverPos);
        gsap.killTweensOf(activePos);
        gsap.killTweensOf([hoverEl, activeEl]);
        menu.removeEventListener("pointerleave", onMenuLeave);
        cleanups.forEach((fn) => fn());
      };
    },
    { scope: rootRef, dependencies: [categories] }
  );

  function choose(id) {
    activate(id);
    onCategoryChange(id);
    onMobileClose?.();
  }

  function activate(id) {
    if (id === activeId) return;
    setActiveId(id);
  }

  return (
    <>
    <div
      className={`library-drawer-backdrop${mobileOpen ? " is-open" : ""}`}
      ref={backdropRef}
      onClick={() => onMobileClose?.()}
    />
    <aside className={`library-sidebar${mobileOpen ? " is-open" : ""}`} ref={rootRef}>
      <div className="library-sidebar__top">
      <button
        className="library-sidebar__brand"
        type="button"
        aria-label="Home"
        onClick={() => onNavigate?.("home")}
      >
        <BrandLogo />
      </button>
      <button
        className="library-sidebar__close"
        type="button"
        aria-label="Close menu"
        onClick={() => onMobileClose?.()}
      >
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M1 1l12 12M13 1L1 13" strokeLinecap="round" />
        </svg>
      </button>
      </div>

      <label className="library-sidebar__search">
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          placeholder="Search... (or just explore)"
          aria-label="Search the library"
          onChange={(event) => onQueryChange?.(event.target.value)}
        />
      </label>

      <div className="library-sidebar__menu">
        <div className="library-sidebar__hover" aria-hidden="true" />
        <div className="library-sidebar__active" aria-hidden="true" />

        <button
          className={`library-sidebar__item library-sidebar__vault-btn${activeId === "all" ? " is-active" : ""}`}
          type="button"
          data-sidebar-id="all"
          onClick={() => choose("all")}
        >
          <span className="library-sidebar__vault-left">
            <Icon name="vault" />
            The Library
          </span>
        </button>

        <ul className="library-sidebar__cats">
          {categories.map((item) => (
            <li key={item.id}>
              <button
                className={`library-sidebar__item library-sidebar__cat${activeId === item.id ? " is-active" : ""}`}
                type="button"
                data-sidebar-id={item.id}
                onClick={() => choose(item.id)}
              >
                <span>{String(item.count).padStart(2, "0")}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
    </>
  );
}
