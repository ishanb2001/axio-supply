import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LocomotiveScroll from "locomotive-scroll";
import "locomotive-scroll/locomotive-scroll.css";
import { projects, demoSrc } from "./data/projects";
import CardThumb from "./components/CardThumb";
import DemoPreview from "./components/DemoPreview";
import HomePage from "./components/HomePage";
import DynamicNav from "./components/DynamicNav";
import FilterTabs from "./components/FilterTabs";
import LibrarySidebar from "./components/LibrarySidebar";
import SortMenu from "./components/SortMenu";
import CodeBlock from "./components/CodeBlock";
import { openOnCodePen } from "./utils/openCodePen";
import "./App.css";
import "./components/FeatureCards.css";
import "./components/DynamicNav.css";

function splitDemoSource(html) {
  const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((match) => match[1].trim())
    .filter(Boolean)
    .join("\n\n");
  const js = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1].trim())
    .filter(Boolean)
    .join("\n\n");
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  const withoutStyles = withoutScripts.replace(/<style[\s\S]*?<\/style>/gi, "");
  const body = withoutStyles.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const markup = (body ? body[1] : withoutStyles).trim();
  return { html: markup, css, js };
}

gsap.registerPlugin(useGSAP, CustomEase, ScrollTrigger);
CustomEase.create("premium", "M0,0 C0.32,0.72 0,1 1,1");
CustomEase.create("libraryFilter", "M0,0 C0.16,1 0.3,1 1,1");
CustomEase.create("sheetEase", "M0,0 C0.08,0.82 0.16,1 1,1");

const LIBRARY_FILTER_EASE = "libraryFilter";

const canHover =
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

const DEVICES = [
  { id: "desktop", label: "Desktop" },
  { id: "tablet", label: "Tablet" },
  { id: "mobile", label: "Mobile" },
];

const TIERS = [
  { id: "all", label: "All" },
  { id: "free", label: "Free" },
  { id: "pro", label: "Pro" },
];

const SORTS = [
  { id: "default", label: "Default" },
  { id: "newest", label: "Newest" },
];

function projectStatus(project) {
  return project.cat === "Navigation" || project.cat === "Cards" ? "Pro" : "Free";
}

export default function App() {
  const rootRef = useRef(null);
  const pageRef = useRef(null);
  const overlayRef = useRef(null);
  const backdropRef = useRef(null);
  const modalRef = useRef(null);
  const visualWrapRef = useRef(null);
  const infoPanelRef = useRef(null);
  const previewFrameRef = useRef(null);
  const sheetScrollRef = useRef(null);
  const flairRef = useRef(null);
  const itemRefs = useRef([]);
  const openTlRef = useRef(null);
  const isOpenRef = useRef(false);
  const pointerRef = useRef({ x: 0, y: 0 });
  const xToRef = useRef(null);
  const yToRef = useRef(null);
  const locomotiveRef = useRef(null);
  const wipeRef = useRef(null);
  const wipePanelRef = useRef(null);
  const galleryShellRef = useRef(null);
  const galleryRef = useRef(null);
  const galleryAnimRef = useRef(null);
  const viewRef = useRef("home");
  const transitioningRef = useRef(false);
  const enterPendingRef = useRef(false);
  const transitionToRef = useRef(null);
  const sceneRef = useRef(null);
  const openProjectRef = useRef(null);

  const [view, setView] = useState(() =>
    window.location.pathname.startsWith("/library") ? "library" : "home"
  );
  viewRef.current = view;
  const [active, setActive] = useState(projects[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [device, setDevice] = useState("desktop");
  const [codePenLoading, setCodePenLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [source, setSource] = useState({ html: "", css: "", js: "" });
  const [libraryQuery, setLibraryQuery] = useState("");
  const [libraryTier, setLibraryTier] = useState("all");
  const [librarySort, setLibrarySort] = useState("default");
  const [libraryCat, setLibraryCat] = useState("all");
  const [libraryMenuOpen, setLibraryMenuOpen] = useState(false);
  const visibleProjects = useMemo(() => {
    const needle = libraryQuery.trim().toLowerCase();
    let list = projects.filter((project) => {
      const status = projectStatus(project).toLowerCase();
      const matchesTier = libraryTier === "all" || status === libraryTier;
      const matchesCat = libraryCat === "all" || project.cat === libraryCat;
      const matchesQuery =
        !needle ||
        project.title.toLowerCase().includes(needle) ||
        project.desc.toLowerCase().includes(needle) ||
        project.cat.toLowerCase().includes(needle);
      return matchesTier && matchesCat && matchesQuery;
    });

    if (librarySort === "newest") {
      list = [...list].reverse();
    }

    return list;
  }, [libraryQuery, libraryTier, librarySort, libraryCat]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const locomotive = new LocomotiveScroll({
      scrollCallback: ScrollTrigger.update,
      lenisOptions: {
        lerp: 0.09,
        smoothWheel: true,
        syncTouch: false,
      },
    });

    locomotiveRef.current = locomotive;

    return () => {
      locomotive.destroy();
      locomotiveRef.current = null;
    };
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      locomotiveRef.current?.resize();
      ScrollTrigger.refresh();
    });

    document.documentElement.style.setProperty(
      "--library-sidebar",
      view === "library" && window.innerWidth > 860 ? "260px" : "0px"
    );

    return () => {
      window.cancelAnimationFrame(frame);
      document.documentElement.style.removeProperty("--library-sidebar");
    };
  }, [view]);

  useEffect(() => {
    const locomotive = locomotiveRef.current;
    if (!locomotive) return;

    if (isOpen) {
      locomotive.stop();
    } else {
      locomotive.start();
      locomotive.resize();
    }
  }, [isOpen]);

  function applyRoute(nextView, { push = true } = {}) {
    if (push) {
      const path = nextView === "library" ? "/library" : "/";
      if (window.location.pathname !== path) {
        window.history.pushState({ view: nextView }, "", path);
      }
    }
    setIsOpen(false);
    isOpenRef.current = false;
    document.body.classList.remove("is-locked");
    if (locomotiveRef.current) {
      locomotiveRef.current.scrollTo(0, { immediate: true, force: true });
    } else {
      window.scrollTo(0, 0);
    }
    enterPendingRef.current = true;
    setView(nextView);
  }

  function onLibraryQuery(value) {
    setLibraryQuery(value);
  }

  function swapGallery(apply) {
    const shell = galleryShellRef.current;
    const grid = galleryRef.current;
    const cards = grid ? gsap.utils.toArray(".feature-card", grid) : [];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || !shell || !grid || !cards.length) {
      apply();
      return;
    }

    const oldHeight = shell.getBoundingClientRect().height;
    gsap.killTweensOf(cards);
    gsap.killTweensOf(shell);

    gsap.to(cards, {
      opacity: 0,
      y: 18,
      duration: 0.22,
      stagger: 0.02,
      ease: "power2.in",
      overwrite: true,
      onComplete: () => {
        galleryAnimRef.current = { oldHeight };
        gsap.set(shell, { height: oldHeight, overflow: "hidden" });
        apply();
      },
    });
  }

  function transitionTo(nextView, { push = true } = {}) {
    if (nextView === viewRef.current || transitioningRef.current) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const outgoing = document.querySelector(".page-view");

    if (reduced || !outgoing) {
      applyRoute(nextView, { push });
      return;
    }

    transitioningRef.current = true;
    gsap.killTweensOf(outgoing);
    gsap.to(outgoing, {
      autoAlpha: 0,
      duration: 0.32,
      ease: "power2.inOut",
      overwrite: true,
      onComplete: () => {
        flushSync(() => applyRoute(nextView, { push }));
      },
    });
  }

  transitionToRef.current = transitionTo;

  function navigate(nextView, detail = {}) {
    if (nextView === "library") {
      setLibraryCat(detail.category ?? "all");
      setLibraryTier(detail.tier ?? "all");
      setLibraryQuery(detail.query ?? "");
    }
    transitionTo(nextView, { push: true });
  }

  useLayoutEffect(() => {
    if (!enterPendingRef.current) return;
    enterPendingRef.current = false;

    const page = document.querySelector(".page-view");
    if (!page) {
      transitioningRef.current = false;
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(page, { clearProps: "transform,opacity,visibility" });
      transitioningRef.current = false;
      return;
    }

    gsap.fromTo(
      page,
      { autoAlpha: 0 },
      {
        autoAlpha: 1,
        duration: 0.4,
        ease: "power2.out",
        overwrite: true,
        onComplete: () => {
          transitioningRef.current = false;
        },
      }
    );
  }, [view]);

  useLayoutEffect(() => {
    const state = galleryAnimRef.current;
    if (!state || view !== "library") return;
    galleryAnimRef.current = null;

    const shell = galleryShellRef.current;
    const grid = galleryRef.current;
    const cards = grid ? gsap.utils.toArray(".feature-card", grid) : [];
    if (!shell || !grid) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!cards.length) {
      gsap.set(shell, { clearProps: "height,overflow" });
      return;
    }

    gsap.fromTo(
      cards,
      { opacity: 0, y: 28 },
      {
        opacity: 1,
        y: 0,
        duration: reduced ? 0 : 0.68,
        stagger: reduced ? 0 : 0.06,
        ease: LIBRARY_FILTER_EASE,
        overwrite: true,
      }
    );

    gsap.fromTo(
      shell,
      { height: state.oldHeight },
      {
        height: grid.offsetHeight,
        duration: reduced ? 0 : 0.62,
        ease: LIBRARY_FILTER_EASE,
        overwrite: true,
        onComplete: () => {
          gsap.set(shell, { clearProps: "height,overflow" });
        },
      }
    );
  }, [view, visibleProjects]);

  useGSAP(
    (context, contextSafe) => {
      const onPopState = contextSafe(() => {
        const next = window.location.pathname.startsWith("/library")
          ? "library"
          : "home";
        transitionToRef.current?.(next, { push: false });
      });
      window.addEventListener("popstate", onPopState);

      if (view !== "library") {
        return () => window.removeEventListener("popstate", onPopState);
      }

      const backdrop = backdropRef.current;
      const modal = modalRef.current;
      const visualWrap = visualWrapRef.current;
      const infoPanel = infoPanelRef.current;
      const previewFrame = previewFrameRef.current;
      const page = pageRef.current;
      const flair = flairRef.current;
      const overlay = overlayRef.current;
      const items = itemRefs.current.filter(Boolean);

      if (!backdrop || !modal || !page || !overlay) {
        return () => window.removeEventListener("popstate", onPopState);
      }

      const infoBits = gsap.utils.toArray(
        overlay.querySelectorAll(".modal__title, .modal__desc, .modal__preview, .modal__code-bar, .modal__code")
      );

      gsap.set(backdrop, { opacity: 0 });
      gsap.set(modal, { yPercent: 108 });
      gsap.set(page, { filter: "blur(0px) saturate(1)" });
      gsap.set(flair, { xPercent: -50, yPercent: -50, scale: 0, autoAlpha: 0 });

      xToRef.current = gsap.quickTo(flair, "x", { duration: 0.6, ease: "power3" });
      yToRef.current = gsap.quickTo(flair, "y", { duration: 0.6, ease: "power3" });

      const showFlair = contextSafe(() => {
        if (!canHover || isOpenRef.current) return;
        gsap.killTweensOf(flair, "scale,autoAlpha");
        gsap.to(flair, {
          scale: 1,
          autoAlpha: 1,
          duration: 0.35,
          ease: "power2.out",
        });
      });

      const hideFlair = contextSafe(() => {
        gsap.killTweensOf(flair, "scale,autoAlpha");
        gsap.to(flair, {
          scale: 0,
          autoAlpha: 0,
          duration: 0.25,
          ease: "power2.inOut",
        });
      });

      const itemIndexUnderPointer = () => {
        const el = document.elementFromPoint(
          pointerRef.current.x,
          pointerRef.current.y
        );
        if (!el) return -1;
        return items.findIndex((item) => item.contains(el));
      };

      const syncFlairToPointer = contextSafe(() => {
        if (isOpenRef.current) {
          hideFlair();
          return;
        }
        if (itemIndexUnderPointer() >= 0) showFlair();
        else hideFlair();
      });

      const openOverlay = contextSafe((data, originEl) => {
        if (isOpenRef.current) return;
        isOpenRef.current = true;
        setIsOpen(true);
        setActive(data);
        setDevice("desktop");
        hideFlair();
        document.body.classList.add("is-locked");
        overlay.classList.add("is-open");
        overlay.setAttribute("aria-hidden", "false");

        if (openTlRef.current) openTlRef.current.kill();

        let origin = "50% 50%";
        if (originEl) {
          const media =
            originEl.querySelector(".feature-card__stage") ||
            originEl.querySelector(".item__media");
          if (media) {
            const rect = media.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            origin = `${(cx / window.innerWidth) * 100}% ${(cy / window.innerHeight) * 100}%`;
            gsap.fromTo(
              media,
              { scale: 0.985 },
              { scale: 1, duration: 0.45, ease: "premium" }
            );
          }
        }

        if (sheetScrollRef.current) sheetScrollRef.current.scrollTop = 0;

        gsap.set(backdrop, { opacity: 0 });
        gsap.set(modal, { yPercent: 108 });

        openTlRef.current = gsap.timeline({ defaults: { ease: "sheetEase" } });

        openTlRef.current
          .to(backdrop, { opacity: 1, duration: 0.7 }, 0)
          .to(page, { filter: "blur(8px) saturate(0.94)", duration: 0.85 }, 0)
          .fromTo(
            modal,
            { yPercent: 108 },
            { yPercent: 0, duration: 1.12, ease: "sheetEase" },
            0.02
          );
      });

      openProjectRef.current = openOverlay;

      const closeOverlay = contextSafe(() => {
        if (!isOpenRef.current) return;
        if (openTlRef.current) openTlRef.current.kill();

        openTlRef.current = gsap.timeline({
          defaults: { ease: "sheetEase" },
          onComplete: () => {
            isOpenRef.current = false;
            setIsOpen(false);
            document.body.classList.remove("is-locked");
            overlay.classList.remove("is-open");
            overlay.setAttribute("aria-hidden", "true");
            gsap.set(modal, { clearProps: "transformOrigin" });
            gsap.set(page, { filter: "blur(0px) saturate(1)" });
            syncFlairToPointer();
          },
        });

        openTlRef.current
          .to(page, { filter: "blur(0px) saturate(1)", duration: 0.4 }, 0)
          .to(backdrop, { opacity: 0, duration: 0.4 }, 0)
          .to(modal, { yPercent: 108, duration: 0.78 }, 0);
      });

      const onPointerMove = contextSafe((e) => {
        pointerRef.current.x = e.clientX;
        pointerRef.current.y = e.clientY;
        xToRef.current?.(e.clientX);
        yToRef.current?.(e.clientY);
      });

      const onKeyDown = contextSafe((e) => {
        if (e.key === "Escape") closeOverlay();
      });

      if (canHover) {
        window.addEventListener("pointermove", onPointerMove);
      }

      window.addEventListener("keydown", onKeyDown);

      const enterHandlers = [];
      const leaveHandlers = [];
      const clickHandlers = [];

      items.forEach((item, index) => {
        const onEnter = contextSafe(() => {
          if (isOpenRef.current) return;
          showFlair();
        });
        const onLeave = contextSafe(() => {
          requestAnimationFrame(syncFlairToPointer);
        });
        const onClick = contextSafe(() => {
          const id = item.dataset.projectId;
          const project = projects.find((entry) => entry.id === id) || visibleProjects[index];
          openOverlay(project, item);
        });

        enterHandlers.push(onEnter);
        leaveHandlers.push(onLeave);
        clickHandlers.push(onClick);

        item.addEventListener("pointerenter", onEnter);
        item.addEventListener("pointerleave", onLeave);
        item.addEventListener("click", onClick);
      });

      const closeBtns = overlay.querySelectorAll("[data-close]");
      const closeHandlers = [];
      closeBtns.forEach((btn) => {
        const handler = contextSafe(() => closeOverlay());
        closeHandlers.push({ btn, handler });
        btn.addEventListener("click", handler);
      });

      return () => {
        window.removeEventListener("popstate", onPopState);

        if (canHover) {
          window.removeEventListener("pointermove", onPointerMove);
        }
        window.removeEventListener("keydown", onKeyDown);

        items.forEach((item, index) => {
          item.removeEventListener("pointerenter", enterHandlers[index]);
          item.removeEventListener("pointerleave", leaveHandlers[index]);
          item.removeEventListener("click", clickHandlers[index]);
        });

        closeHandlers.forEach(({ btn, handler }) => {
          btn.removeEventListener("click", handler);
        });

        document.body.classList.remove("is-locked");
      };
    },
    { scope: rootRef, dependencies: [view, libraryQuery, libraryTier, librarySort, libraryCat] }
  );

  useEffect(() => {
    const sheet = sheetScrollRef.current;
    if (!isOpen || !sheet) return undefined;

    const onWheel = (event) => {
      const max = sheet.scrollHeight - sheet.clientHeight;
      if (max <= 0) return;
      const scrollingUp = event.deltaY < 0;
      const scrollingDown = event.deltaY > 0;
      const atTop = sheet.scrollTop <= 0;
      const atBottom = sheet.scrollTop >= max - 1;
      if ((scrollingUp && atTop) || (scrollingDown && atBottom)) return;
      event.stopPropagation();
    };

    sheet.addEventListener("wheel", onWheel, { passive: false });
    return () => sheet.removeEventListener("wheel", onWheel);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !active?.file) return undefined;
    let cancelled = false;
    setSource({ html: "", css: "", js: "" });
    setCopied(false);
    fetch(demoSrc(active.file))
      .then((response) => response.text())
      .then((html) => {
        if (!cancelled) setSource(splitDemoSource(html));
      })
      .catch(() => {
        if (!cancelled) setSource({ html: "", css: "", js: "" });
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, active]);

  async function copyAllCode() {
    const text = [
      "<!-- HTML -->",
      source.html,
      "",
      "/* CSS */",
      source.css,
      "",
      "// JavaScript",
      source.js,
    ].join("\n");
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error("clipboard unavailable");
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      if (ok) {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      } else {
        console.error(error);
      }
    }
  }

  async function handleViewCodePen() {
    if (codePenLoading) return;
    setCodePenLoading(true);
    try {
      await openOnCodePen({
        title: active.title,
        src: demoSrc(active.file),
      });
    } catch (error) {
      console.error(error);
      window.alert("Could not open CodePen for this demo. Please try again.");
    } finally {
      setCodePenLoading(false);
    }
  }

  const wipe = (
    <div className="page-wipe" ref={wipeRef} aria-hidden="true">
      <div className="page-wipe__panel" ref={wipePanelRef} />
    </div>
  );

  if (view === "home") {
    return (
      <>
        <HomePage onNavigate={navigate} />
        {wipe}
      </>
    );
  }

  return (
    <>
    <div className="library-page page-view" ref={rootRef}>
      <LibrarySidebar
        category={libraryCat}
        mobileOpen={libraryMenuOpen}
        onMobileClose={() => setLibraryMenuOpen(false)}
        onCategoryChange={(id) => {
          if (id === libraryCat) return;
          swapGallery(() => setLibraryCat(id));
        }}
        onNavigate={navigate}
        query={libraryQuery}
        onQueryChange={onLibraryQuery}
      />
      <div className="library-page__scene" ref={sceneRef}>
      <main className="page page--library" ref={pageRef}>
        <header className="library-hero">
          <div className="library-hero__bar">
            <button
              className="library-menu-btn"
              type="button"
              aria-label="Open library menu"
              onClick={() => setLibraryMenuOpen(true)}
            >
              <span />
              <span />
              <span />
            </button>
            <h1 className="library-hero__title">Find something that fits.</h1>
          </div>
          <p className="library-hero__lede">
            Preview live components, then pick the ones that match the product you&apos;re building.
          </p>

          <div className="library-toolbar">
            <FilterTabs
              items={TIERS}
              value={libraryTier}
              onChange={(id) => {
                if (id === libraryTier) return false;
                swapGallery(() => setLibraryTier(id));
                return true;
              }}
              label="Filter by access"
              variant="blob"
              tone="light"
            />

            <SortMenu
              items={SORTS}
              value={librarySort}
              onChange={(id) => {
                if (id === librarySort) return;
                swapGallery(() => setLibrarySort(id));
              }}
            />
          </div>
        </header>

        <section className="library-latest">
          <div className="gallery-shell" ref={galleryShellRef}>
          <div className="gallery" ref={galleryRef}>
            {visibleProjects.map((project, index) => {
              const status = projectStatus(project);
              const isNew = projects.findIndex((entry) => entry.id === project.id) < 5;

              return (
                <button
                  key={project.id}
                  className="feature-card"
                  type="button"
                  data-magnetic="off"
                  data-project-id={project.id}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                    itemRefs.current.length = visibleProjects.length;
                  }}
                >
                  <div className="feature-card__stage">
                    {isNew ? (
                      <p className="feature-card__badge">
                        <span />
                        New
                      </p>
                    ) : null}
                    <CardThumb project={project} />
                  </div>
                  <div className="feature-card__meta">
                    <h3>{project.title}</h3>
                    <p>
                      <span className="feature-card__free-icon" aria-hidden="true" />
                      {status}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          </div>
        </section>
      </main>
      </div>

      <div
        className={`overlay${isOpen ? " is-open" : ""}`}
        ref={overlayRef}
        aria-hidden={!isOpen}
      >
        <div className="overlay__backdrop" ref={backdropRef} data-close />
        <div className="modal" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button className="modal__close" type="button" aria-label="Close" data-close>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M1 1l12 12M13 1L1 13" strokeLinecap="round" />
              </svg>
            </button>
            <div className="modal__scroll" ref={sheetScrollRef} data-lenis-prevent>
              <div className="modal__heading">
                <h2 className="modal__title" id="modal-title">{active.title}</h2>
                <p className="modal__desc">{active.desc}</p>
              </div>
              <div className="modal__preview">
                {isOpen && (
                  <DemoPreview
                    key={active.id}
                    file={active.file}
                    background={active.background}
                    interactive
                    title={`${active.title} preview`}
                  />
                )}
              </div>
              <div className="modal__code-bar">
                <button
                  className={`modal__copy${copied ? " is-copied" : ""}`}
                  type="button"
                  aria-label={copied ? "Copied" : "Copy all the code"}
                  onClick={copyAllCode}
                >
                  <span className="modal__copy-icon" aria-hidden="true">
                    <span className="modal__copy-icon-track">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
                        <path d="M10.5 5.5V3.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1H5.5" />
                      </svg>
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M3.5 8.5l3 3 6-6.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </span>
                  <span className="modal__copy-label">
                    <span>Copy all the code</span>
                    <span>Copied</span>
                  </span>
                </button>
                <button
                  className="modal__codepen"
                  type="button"
                  onClick={handleViewCodePen}
                  disabled={codePenLoading}
                >
                  {codePenLoading ? "Opening…" : "View on CodePen"}
                </button>
              </div>
              <CodeBlock label="HTML" code={source.html} />
              <CodeBlock label="CSS" code={source.css} />
              <CodeBlock label="JavaScript" code={source.js} />
            </div>
          </div>
      </div>

      <div className="flair" ref={flairRef} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
    {wipe}
    </>
  );
}
