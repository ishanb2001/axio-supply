import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import BrandLogo from "./BrandLogo";
import "./DynamicNav.css";

gsap.registerPlugin(useGSAP, CustomEase, ScrollTrigger);

const S_CURVE_EASE = CustomEase.create(
  "easyEase",
  "M0,0 C0.86,0 0.14,1 1,1"
);
const REST_HEIGHT = 52;
const SCROLLED_HEIGHT = 46;
const COMPACT_DURATION = 0.48;
const COMPACT_EASE = "power2.out";

export default function DynamicNav({ onNavigate }) {
  const rootRef = useRef(null);
  const drawerRef = useRef(null);
  const drawerBackdropRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useGSAP(
    () => {
      const siteNav = rootRef.current;
      if (!siteNav) return;

      const navPanel = siteNav.querySelector(".site-nav__panel");
      const navTop = siteNav.querySelector(".nav-top");
      if (!navPanel || !navTop) return;

      const triggers = gsap.utils.toArray(".nav-trigger", siteNav);
      const panels = gsap.utils.toArray(".menu-panel", siteNav);
      const closeOnHover = gsap.utils.toArray(
        ".nav-link, .nav-cta, .brand-logo",
        siteNav
      );
      const allAnimItems = gsap.utils.toArray(".anim-item", siteNav);
      let activePanel = null;
      let closeTimeout = null;
      let lastSwitchAt = 0;
      let compact = false;
      const QUICK_SWITCH_MS = 280;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const darkSections = Array.from(
        document.querySelectorAll(".home-cinema")
      );

      const themeTriggers = darkSections.map((section) =>
        ScrollTrigger.create({
          trigger: section,
          start: "top 72px",
          end: "bottom 20px",
          onToggle: ({ isActive }) => {
            siteNav.classList.toggle("is-over-dark", isActive);
          },
        })
      );

      const barHeight = () => (compact ? SCROLLED_HEIGHT : REST_HEIGHT);

      const compactBar = (height) => {
        gsap.to(siteNav, {
          height,
          duration: COMPACT_DURATION,
          ease: COMPACT_EASE,
          overwrite: "auto",
        });
        gsap.to(navTop, {
          height,
          duration: COMPACT_DURATION,
          ease: COMPACT_EASE,
          overwrite: "auto",
        });
        if (!activePanel) {
          gsap.to(navPanel, {
            height,
            duration: COMPACT_DURATION,
            ease: COMPACT_EASE,
            overwrite: "auto",
          });
        }
      };

      const onScroll = () => {
        const next = window.scrollY > 4;
        if (next === compact) return;
        compact = next;
        compactBar(barHeight());
      };

      const animateNavHeight = (height, duration, onComplete) => {
        const currentHeight = navPanel.getBoundingClientRect().height;

        gsap.killTweensOf(navPanel, "height");
        return gsap.fromTo(
          navPanel,
          { height: currentHeight },
          {
            height,
            duration,
            ease: S_CURVE_EASE,
            overwrite: true,
            onComplete,
          }
        );
      };

      const hidePanel = (panel) => {
        panel.classList.remove("active");
        gsap.set(panel, { opacity: 0, visibility: "hidden" });
        gsap.set(panel.querySelectorAll(".anim-item"), { y: 0, opacity: 0 });
      };

      const cancelClose = () => {
        if (closeTimeout) {
          clearTimeout(closeTimeout);
          closeTimeout = null;
        }
      };

      const openDropdown = (targetPanel, trigger) => {
        cancelClose();

        triggers.forEach((t) => t.classList.remove("active"));
        if (trigger) trigger.classList.add("active");

        const targetNavHeight = barHeight() + targetPanel.offsetHeight + 40;
        const now = performance.now();
        const isQuickSwitch =
          Boolean(activePanel) &&
          activePanel !== targetPanel &&
          now - lastSwitchAt < QUICK_SWITCH_MS;
        lastSwitchAt = now;

        if (activePanel && activePanel !== targetPanel) {
          const oldPanel = activePanel;
          const newItems = targetPanel.querySelectorAll(".anim-item");
          const oldItems = oldPanel.querySelectorAll(".anim-item");

          gsap.killTweensOf([oldPanel, targetPanel, ...oldItems, ...newItems]);

          if (isQuickSwitch) {
            hidePanel(oldPanel);
            targetPanel.classList.add("active");
            gsap.set(newItems, { y: 0 });
            gsap.set(targetPanel, { visibility: "visible" });
            gsap.fromTo(
              targetPanel,
              { opacity: 0 },
              {
                opacity: 1,
                duration: 0.16,
                ease: S_CURVE_EASE,
                overwrite: true,
              }
            );
            gsap.fromTo(
              newItems,
              { opacity: 0 },
              {
                opacity: 1,
                duration: 0.16,
                ease: S_CURVE_EASE,
                overwrite: true,
              }
            );
            animateNavHeight(targetNavHeight, 0.35);
            activePanel = targetPanel;
            return;
          }

          gsap.to(oldItems, {
            opacity: 0,
            duration: 0.16,
            ease: S_CURVE_EASE,
            overwrite: true,
          });
          gsap.to(oldPanel, {
            opacity: 0,
            duration: 0.2,
            ease: S_CURVE_EASE,
            overwrite: true,
            onComplete: () => hidePanel(oldPanel),
          });

          targetPanel.classList.add("active");
          gsap.set(targetPanel, { visibility: "visible" });
          gsap.to(targetPanel, {
            opacity: 1,
            duration: 0.25,
            ease: S_CURVE_EASE,
            overwrite: true,
          });

          animateNavHeight(targetNavHeight, 0.55);

          gsap.fromTo(
            newItems,
            { y: 10, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.3,
              stagger: 0.015,
              ease: S_CURVE_EASE,
              overwrite: true,
            }
          );

          activePanel = targetPanel;
          return;
        }

        activePanel = targetPanel;
        targetPanel.classList.add("active");
        gsap.set(targetPanel, { visibility: "visible", opacity: 1 });

        animateNavHeight(targetNavHeight, 0.7);

        const animItems = targetPanel.querySelectorAll(".anim-item");
        gsap.fromTo(
          animItems,
          { y: 14, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            stagger: 0.018,
            ease: S_CURVE_EASE,
            delay: 0.12,
            overwrite: true,
          }
        );
      };

      const closeDropdown = () => {
        triggers.forEach((t) => t.classList.remove("active"));
        if (!activePanel) return;

        const currentPanel = activePanel;
        const animItems = currentPanel.querySelectorAll(".anim-item");
        lastSwitchAt = 0;

        gsap.killTweensOf([currentPanel, ...animItems]);

        gsap.to(animItems, {
          y: 6,
          opacity: 0,
          duration: 0.18,
          ease: S_CURVE_EASE,
          overwrite: true,
        });

        gsap.to(currentPanel, {
          opacity: 0,
          duration: 0.2,
          ease: S_CURVE_EASE,
          overwrite: true,
        });

        animateNavHeight(barHeight(), 0.65, () => {
          panels.forEach((p) => hidePanel(p));
          activePanel = null;
        });
      };

      const scheduleClose = () => {
        cancelClose();
        closeTimeout = setTimeout(closeDropdown, 120);
      };

      const removeTriggerListeners = triggers.map((trigger) => {
        const targetId = trigger.getAttribute("data-target");
        const targetPanel = siteNav.querySelector(`#panel-${targetId}`);
        if (!targetPanel) return () => {};

        const onEnter = () => {
          if (window.matchMedia("(max-width: 820px)").matches) return;
          openDropdown(targetPanel, trigger);
        };
        trigger.addEventListener("mouseenter", onEnter);
        return () => trigger.removeEventListener("mouseenter", onEnter);
      });

      const removeCloseListeners = closeOnHover.map((el) => {
        const onEnter = () => {
          cancelClose();
          closeDropdown();
        };
        el.addEventListener("mouseenter", onEnter);
        return () => el.removeEventListener("mouseenter", onEnter);
      });

      siteNav.addEventListener("mouseleave", scheduleClose);

      if (!reduced) {
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
      }

      return () => {
        cancelClose();
        removeTriggerListeners.forEach((removeListener) => removeListener());
        removeCloseListeners.forEach((removeListener) => removeListener());
        siteNav.removeEventListener("mouseleave", scheduleClose);
        window.removeEventListener("scroll", onScroll);
        themeTriggers.forEach((trigger) => trigger.kill());
        siteNav.classList.remove("is-over-dark");
        gsap.killTweensOf([siteNav, navTop, navPanel, ...panels, ...allAnimItems]);
      };
    },
    { scope: rootRef }
  );

  const closeMenu = () => {
    setMenuOpen(false);
    window.setTimeout(() => document.body.classList.remove("is-menu-open"), 420);
  };

  const openMenu = () => {
    setMenuOpen(true);
    document.body.classList.add("is-menu-open");
  };

  const go = (detail) => {
    closeMenu();
    onNavigate?.("library", detail);
  };

  return (
    <header className="site-nav" id="siteNav" ref={rootRef}>
      <div className="site-nav__panel">
      <div className="nav-top">
        <button
          className="brand-logo"
          type="button"
          aria-label="Home"
          onClick={() => {
            onNavigate?.("home");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <BrandLogo />
        </button>

        <nav className="navbar">
          <ul className="nav-list">
            <li>
              <button
                className="nav-trigger"
                type="button"
                data-target="library"
                onClick={() => onNavigate?.("library")}
              >
                Library
              </button>
            </li>
            <li>
              <button
                className="nav-trigger"
                type="button"
                data-target="motion"
                onClick={() => onNavigate?.("library", { category: "Animation" })}
              >
                Motion
              </button>
            </li>
            <li>
              <button className="nav-link" type="button" onClick={() => onNavigate?.("library")}>
                Components
              </button>
            </li>
          </ul>
        </nav>

        <div className="nav-actions">
          <button className="nav-cta" type="button" onClick={() => onNavigate?.("library")}>
            Launch
          </button>
        </div>
        <button
          className={`nav-toggle${menuOpen ? " is-open" : ""}`}
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => (menuOpen ? closeMenu() : openMenu())}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className="dropdown-wrapper" id="dropdownWrapper">
        <div className="menu-panel" id="panel-library">
          <div className="menu-grid">
            <div className="menu-col">
              <span className="col-header">Browse</span>
              <div className="primary-links">
                <a href="/library" className="primary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library"); }}>
                  All components
                </a>
                <a href="/library" className="primary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library", { category: "Navigation" }); }}>Navigation</a>
                <a href="/library" className="primary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library", { category: "Cards" }); }}>Cards</a>
                <a href="/library" className="primary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library", { category: "Animation" }); }}>Animation</a>
                <a href="/library" className="primary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library", { category: "Gallery" }); }}>Gallery</a>
              </div>
              <div className="secondary-links">
                <a href="/library" className="secondary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library", { tier: "free" }); }}>Free pieces</a>
                <a href="/library" className="secondary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library", { tier: "pro" }); }}>Pro pieces</a>
              </div>
            </div>
            <div className="menu-col">
              <span className="col-header">Use it</span>
              <div className="secondary-links">
                <a href="/library" className="secondary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library"); }}>Preview live</a>
                <a href="/library" className="secondary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library"); }}>Open in CodePen</a>
                <a href="/library" className="secondary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library"); }}>Search the library</a>
                <a href="/library" className="secondary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library"); }}>Copy a component</a>
                <a href="/library" className="secondary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library"); }}>Filter by category</a>
              </div>
            </div>
            <div className="menu-col">
              <span className="col-header">What’s inside</span>
              <div className="secondary-links">
                <a href="/library" className="secondary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library", { query: "Glass" }); }}>Glass interfaces</a>
                <a href="/library" className="secondary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library", { category: "Animation" }); }}>Scroll interactions</a>
                <a href="/library" className="secondary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library", { query: "Hover" }); }}>Hover states</a>
                <a href="/library" className="secondary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library", { category: "Navigation" }); }}>Tabs and navigation</a>
                <a href="/library" className="secondary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library"); }}>New this week</a>
              </div>
            </div>
          </div>
        </div>

        <div className="menu-panel" id="panel-motion">
          <div className="menu-grid">
            <div className="menu-col">
              <span className="col-header">Motion</span>
              <div className="primary-links">
                <a href="/library" className="primary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library", { query: "Card Frame" }); }}>Card Frame</a>
                <a href="/library" className="primary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library", { query: "Wind Row" }); }}>Wind Row</a>
                <a href="/library" className="primary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library", { query: "Chroma" }); }}>Chroma Word Wipe</a>
                <a href="/library" className="primary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library", { query: "Horizontal Image Row" }); }}>Horizontal Image Row</a>
              </div>
              <div className="secondary-links">
                <a href="/library" className="secondary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library", { category: "Animation" }); }}>Easing studies</a>
                <a href="/library" className="secondary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library", { category: "Animation" }); }}>Scroll-linked motion</a>
              </div>
            </div>
            <div className="menu-col">
              <span className="col-header">Interaction</span>
              <div className="secondary-links">
                <a href="/library" className="secondary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library", { query: "Hover" }); }}>Hover highlights</a>
                <a href="/library" className="secondary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library"); }}>Press states</a>
                <a href="/library" className="secondary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library", { query: "Collaboration" }); }}>Sticky stacks</a>
                <a href="/library" className="secondary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library", { category: "Gallery" }); }}>Drag and settle</a>
              </div>
            </div>
            <div className="menu-col">
              <span className="col-header">Build with it</span>
              <div className="secondary-links">
                <a href="/library" className="secondary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library", { category: "Animation" }); }}>GSAP timelines</a>
                <a href="/library" className="secondary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library"); }}>Preview before you ship</a>
                <a href="/library" className="secondary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library"); }}>Drop into a page</a>
                <a href="/library" className="secondary-link anim-item" onClick={(event) => { event.preventDefault(); onNavigate?.("library"); }}>Match your type system</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      {createPortal(
        <>
          <div
            className={`nav-drawer__backdrop${menuOpen ? " is-open" : ""}`}
            ref={drawerBackdropRef}
            onClick={closeMenu}
          />
          <aside className={`nav-drawer${menuOpen ? " is-open" : ""}`} ref={drawerRef} aria-hidden={!menuOpen}>
            <button className="nav-drawer__link" type="button" onClick={() => go()}>
              Library
            </button>
            <button className="nav-drawer__link" type="button" onClick={() => go({ category: "Animation" })}>
              Motion
            </button>
            <button className="nav-drawer__link" type="button" onClick={() => go()}>
              Components
            </button>
            <button className="nav-drawer__link nav-drawer__link--cta" type="button" onClick={() => go()}>
              Launch
            </button>
          </aside>
        </>,
        document.body
      )}
    </header>
  );
}
