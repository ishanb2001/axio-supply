import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";
import "./LibrarySearch.css";

gsap.registerPlugin(useGSAP, CustomEase);

const SEARCH_EASE = CustomEase.create("librarySearch", "0.76,0,0.24,1");
const SEARCH_OUT = CustomEase.create("librarySearchOut", "0.4,0,0.2,1");
const CARD_HEIGHT = 78;
const CARD_GAP = 8;
const LABEL_HEIGHT = 30;
const RESULTS_BOTTOM = 28;

function projectStatus(project) {
  return project.cat === "Navigation" || project.cat === "Cards" ? "Pro" : "Free";
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function LibrarySearch({
  query,
  onQueryChange,
  projects,
  onSelect,
  onOpenChange,
  sceneRef,
}) {
  const triggerRef = useRef(null);
  const dockRef = useRef(null);
  const layerRef = useRef(null);
  const veilRef = useRef(null);
  const fieldRef = useRef(null);
  const resultsRef = useRef(null);
  const inputRef = useRef(null);
  const displayRef = useRef(null);
  const placeholderRef = useRef(null);
  const caretRef = useRef(null);
  const prevLenRef = useRef(query.length);
  const openRef = useRef(false);
  const sourceRef = useRef("inline");
  const dockVisibleRef = useRef(false);
  const tlRef = useRef(null);
  const dockTlRef = useRef(null);
  const caretTlRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [dockVisible, setDockVisible] = useState(false);
  const [resultLimit, setResultLimit] = useState(4);
  openRef.current = open;
  dockVisibleRef.current = dockVisible;

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = !needle
      ? projects
      : projects.filter((project) => {
          return (
            project.title.toLowerCase().includes(needle) ||
            project.desc.toLowerCase().includes(needle) ||
            project.cat.toLowerCase().includes(needle)
          );
        });
    return list.slice(0, resultLimit);
  }, [projects, query, resultLimit]);

  function fieldDestination() {
    const width = Math.min(720, window.innerWidth * 0.88);
    return {
      top: Math.max(88, window.innerHeight * 0.16),
      left: (window.innerWidth - width) / 2,
      width,
      height: 64,
    };
  }

  function fitCount(dest = fieldDestination()) {
    const available =
      window.innerHeight - (dest.top + dest.height + 18) - RESULTS_BOTTOM;
    const n = Math.floor((available - LABEL_HEIGHT + CARD_GAP) / (CARD_HEIGHT + CARD_GAP));
    return Math.max(1, Math.min(8, n));
  }

  function resultsHeight(count) {
    if (!count) return LABEL_HEIGHT + 56;
    return LABEL_HEIGHT + count * CARD_HEIGHT + (count - 1) * CARD_GAP;
  }

  function placeResults(dest, count = resultLimit) {
    const resultsEl = resultsRef.current;
    if (!resultsEl) return;
    gsap.set(resultsEl, {
      top: dest.top + dest.height + 18,
      left: dest.left,
      width: dest.width,
      height: resultsHeight(count),
    });
  }

  function activeTrigger() {
    return sourceRef.current === "dock" ? dockRef.current : triggerRef.current;
  }

  function hideTriggers() {
    if (triggerRef.current) gsap.set(triggerRef.current, { autoAlpha: 0 });
    if (dockRef.current) gsap.set(dockRef.current, { autoAlpha: 0 });
  }

  function restoreTriggers() {
    if (triggerRef.current) {
      gsap.set(triggerRef.current, { autoAlpha: 1, clearProps: "opacity,visibility" });
    }
    if (dockRef.current) {
      gsap.set(dockRef.current, {
        xPercent: -50,
        autoAlpha: dockVisibleRef.current ? 1 : 0,
        y: dockVisibleRef.current ? 0 : 20,
        pointerEvents: dockVisibleRef.current ? "auto" : "none",
      });
    }
  }

  function openSearch(source = "inline") {
    if (openRef.current) {
      inputRef.current?.focus();
      return;
    }

    sourceRef.current = source;
    const trigger = activeTrigger();
    const layer = layerRef.current;
    const veil = veilRef.current;
    const field = fieldRef.current;
    const resultsEl = resultsRef.current;
    const scene = sceneRef?.current;
    if (!trigger || !layer || !veil || !field) return;

    const from = trigger.getBoundingClientRect();
    const dest = fieldDestination();
    const limit = fitCount(dest);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setResultLimit(limit);
    setOpen(true);
    onOpenChange?.(true);
    document.body.classList.add("is-locked");

    tlRef.current?.kill();
    hideTriggers();
    gsap.set(field, {
      top: from.top,
      left: from.left,
      width: from.width,
      height: from.height,
      borderRadius: 999,
    });
    placeResults(dest, limit);
    gsap.set(veil, { autoAlpha: 0 });
    gsap.set(resultsEl, { autoAlpha: 0, y: 20 });
    layer.classList.add("is-open");
    layer.setAttribute("aria-hidden", "false");

    if (reduced) {
      gsap.set(veil, { autoAlpha: 1 });
      gsap.set(field, { ...dest, borderRadius: 18, boxShadow: "0 0 0 1.5px #d6d6d6" });
      gsap.set(resultsEl, { autoAlpha: 1, y: 0 });
      if (scene) gsap.set(scene, { filter: "blur(14px) saturate(0.92)" });
      inputRef.current?.focus();
      return;
    }

    tlRef.current = gsap.timeline({
      defaults: { ease: SEARCH_EASE },
      onComplete: () => inputRef.current?.focus(),
    });

    tlRef.current.to(veil, { autoAlpha: 1, duration: 0.5 }, 0);

    if (scene) {
      tlRef.current.to(
        scene,
        { filter: "blur(14px) saturate(0.92)", duration: 0.55 },
        0
      );
    }

    tlRef.current
      .to(
        field,
        {
          top: dest.top,
          left: dest.left,
          width: dest.width,
          height: dest.height,
          borderRadius: 18,
          boxShadow: "0 0 0 1.5px #d6d6d6",
          duration: 0.62,
        },
        0.02
      )
      .to(resultsEl, { autoAlpha: 1, y: 0, duration: 0.48 }, 0.22);
  }

  function closeSearch({ after } = {}) {
    if (!openRef.current) {
      after?.();
      return;
    }

    const trigger = activeTrigger();
    const layer = layerRef.current;
    const veil = veilRef.current;
    const field = fieldRef.current;
    const resultsEl = resultsRef.current;
    const scene = sceneRef?.current;
    const from = trigger?.getBoundingClientRect();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const finish = () => {
      setOpen(false);
      onOpenChange?.(false);
      document.body.classList.remove("is-locked");
      layer?.classList.remove("is-open");
      layer?.setAttribute("aria-hidden", "true");
      restoreTriggers();
      if (scene) gsap.set(scene, { filter: "blur(0px) saturate(1)" });
      after?.();
    };

    tlRef.current?.kill();

    if (reduced || !from || !field) {
      finish();
      return;
    }

    tlRef.current = gsap.timeline({
      defaults: { ease: SEARCH_OUT },
      onComplete: finish,
    });

    tlRef.current
      .to(resultsEl, { autoAlpha: 0, y: 12, duration: 0.24 }, 0)
      .to(
        field,
        {
          top: from.top,
          left: from.left,
          width: from.width,
          height: from.height,
          duration: 0.45,
        },
        0.04
      )
      .to(veil, { autoAlpha: 0, duration: 0.4 }, 0.06);

    if (scene) {
      tlRef.current.to(
        scene,
        { filter: "blur(0px) saturate(1)", duration: 0.42 },
        0.06
      );
    }
  }

  useGSAP(
    (context, contextSafe) => {
      const onKey = contextSafe((event) => {
        if (!openRef.current) return;
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopImmediatePropagation();
          closeSearch();
        }
      });

      const syncDock = contextSafe(() => {
        if (openRef.current) return;
        const trigger = triggerRef.current;
        if (!trigger) return;
        setDockVisible(trigger.getBoundingClientRect().bottom < 12);
      });

      const io = new IntersectionObserver(
        ([entry]) => {
          if (openRef.current) return;
          setDockVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
        },
        { threshold: 0 }
      );

      if (triggerRef.current) io.observe(triggerRef.current);
      if (dockRef.current) {
        gsap.set(dockRef.current, {
          xPercent: -50,
          y: 20,
          autoAlpha: 0,
          pointerEvents: "none",
        });
      }

      window.addEventListener("keydown", onKey, true);
      window.addEventListener("scroll", syncDock, { passive: true });
      syncDock();

      return () => {
        io.disconnect();
        window.removeEventListener("keydown", onKey, true);
        window.removeEventListener("scroll", syncDock);
      };
    },
    { scope: layerRef }
  );

  useLayoutEffect(() => {
    const dock = dockRef.current;
    if (!dock || open) return;

    dockTlRef.current?.kill();
    dockTlRef.current = gsap.to(dock, {
      xPercent: -50,
      y: dockVisible ? 0 : 20,
      autoAlpha: dockVisible ? 1 : 0,
      pointerEvents: dockVisible ? "auto" : "none",
      duration: 0.48,
      ease: dockVisible ? SEARCH_EASE : SEARCH_OUT,
      overwrite: "auto",
    });
  }, [dockVisible, open]);

  useLayoutEffect(() => {
    if (!open) return;
    placeResults(fieldDestination(), results.length);
  }, [open, results.length]);

  useLayoutEffect(() => {
    if (!open) return;

    const dest = fieldDestination();
    const limit = fitCount(dest);
    setResultLimit(limit);
    placeResults(dest, limit);

    const onResize = () => {
      const next = fieldDestination();
      const nextLimit = fitCount(next);
      setResultLimit(nextLimit);
      if (fieldRef.current) gsap.set(fieldRef.current, next);
      placeResults(next, nextLimit);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;

    const display = displayRef.current;
    const placeholder = placeholderRef.current;
    if (!display) return;

    const chars = display.querySelectorAll(".library-search-layer__char");
    const prev = prevLenRef.current;
    const next = query.length;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (placeholder) {
      gsap.set(placeholder, { autoAlpha: next ? 0 : 1 });
    }

    if (!reduced && next > prev) {
      const added = Array.from(chars).slice(prev);
      gsap.fromTo(
        added,
        { y: 7 },
        {
          y: 0,
          duration: 0.18,
          stagger: 0.012,
          ease: SEARCH_EASE,
          overwrite: "auto",
        }
      );
    }

    prevLenRef.current = next;
  }, [query, open]);

  useLayoutEffect(() => {
    if (!open) return;
    const cards = resultsRef.current?.querySelectorAll(".library-search-hit");
    if (!cards?.length) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(cards, { autoAlpha: 1, y: 0 });
      return;
    }

    gsap.fromTo(
      cards,
      { y: 14, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.38,
        stagger: 0.03,
        ease: SEARCH_EASE,
        overwrite: true,
      }
    );
  }, [results, open]);

  useLayoutEffect(() => {
    const caret = caretRef.current;
    if (!open || !caret) {
      caretTlRef.current?.kill();
      return;
    }

    caretTlRef.current?.kill();
    caretTlRef.current = gsap.timeline({ repeat: -1 });
    caretTlRef.current
      .set(caret, { autoAlpha: 1 })
      .to(caret, { autoAlpha: 0, duration: 0, delay: 0.52 })
      .to(caret, { autoAlpha: 1, duration: 0, delay: 0.52 });

    return () => caretTlRef.current?.kill();
  }, [open, query]);

  const layer = (
    <div className="library-search-layer" ref={layerRef} aria-hidden={!open}>
      <button
        className="library-search-layer__veil"
        ref={veilRef}
        type="button"
        tabIndex={-1}
        aria-label="Close search"
        onClick={() => closeSearch()}
      />

      <div className="library-search-field library-search-layer__field" ref={fieldRef}>
        <SearchIcon />
        <div className="library-search-layer__track">
          <span className="library-search-layer__placeholder" ref={placeholderRef}>
            Search components
          </span>
          <div className="library-search-layer__display" ref={displayRef} aria-hidden="true">
            {query.split("").map((char, index) => (
              <span className="library-search-layer__char" key={`${index}-${char}`}>
                {char === " " ? "\u00a0" : char}
              </span>
            ))}
            <span className="library-search-layer__caret" ref={caretRef} />
          </div>
          <input
            ref={inputRef}
            className="library-search-layer__input"
            type="search"
            value={query}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            aria-label="Search components"
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
      </div>

      <div className="library-search-layer__results" ref={resultsRef}>
        <p className="library-search-layer__label">
          {query.trim() ? "Matches" : "Suggested"}
          <span>{results.length}</span>
        </p>

        {results.length ? (
          <ul>
            {results.map((project) => (
              <li key={project.id}>
                <button
                  className="library-search-hit"
                  type="button"
                  onPointerEnter={(event) => {
                    gsap.to(event.currentTarget, {
                      y: -2,
                      duration: 0.28,
                      ease: SEARCH_EASE,
                      overwrite: "auto",
                    });
                  }}
                  onPointerLeave={(event) => {
                    gsap.to(event.currentTarget, {
                      y: 0,
                      duration: 0.28,
                      ease: SEARCH_OUT,
                      overwrite: "auto",
                    });
                  }}
                  onClick={(event) => {
                    const origin = event.currentTarget;
                    closeSearch({
                      after: () => onSelect?.(project, origin),
                    });
                  }}
                >
                  <span
                    className="library-search-hit__thumb"
                    style={{ background: project.background }}
                  >
                    <img
                      src={`/thumbnails/${project.id}.jpg`}
                      alt=""
                      loading="lazy"
                      draggable={false}
                    />
                  </span>
                  <span className="library-search-hit__meta">
                    <span className="library-search-hit__title">{project.title}</span>
                    <span className="library-search-hit__sub">
                      {project.cat} · {projectStatus(project)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="library-search-layer__empty">Nothing matches that yet.</p>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        className="library-search-field"
        ref={triggerRef}
        type="button"
        onClick={() => openSearch("inline")}
      >
        <SearchIcon />
        <span>{query || "Search components"}</span>
      </button>

      {createPortal(
        <>
          <button
            className="library-search-field library-search-field--dock"
            ref={dockRef}
            type="button"
            onClick={() => openSearch("dock")}
            aria-hidden={!dockVisible}
            tabIndex={dockVisible && !open ? 0 : -1}
          >
            <SearchIcon />
            <span>{query || "Search components"}</span>
          </button>
          {layer}
        </>,
        document.body
      )}
    </>
  );
}
