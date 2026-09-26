import { useEffect, useRef } from "react";
import gsap from "gsap";
import "./CardsBreadcrumb.css";

/**
 * Floating left/right control — expands when `active`, collapses off-screen when not.
 */
export default function CardsBreadcrumb({ active, onPrev, onNext }) {
  const wrapRef = useRef(null);
  const pillRef = useRef(null);
  const visibleRef = useRef(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const pill = pillRef.current;
    if (!wrap || !pill) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.set(wrap, { autoAlpha: 0, y: 28, pointerEvents: "none" });
    gsap.set(pill, { width: 52 });

    return () => {
      gsap.killTweensOf([wrap, pill]);
    };
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const pill = pillRef.current;
    if (!wrap || !pill) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduced ? 0 : 0.62;
    const ease = "power3.inOut";

    if (active && !visibleRef.current) {
      visibleRef.current = true;
      gsap.set(wrap, { pointerEvents: "auto" });
      gsap
        .timeline({ defaults: { ease } })
        .to(wrap, { autoAlpha: 1, y: 0, duration: duration * 0.85 }, 0)
        .fromTo(
          pill,
          { width: 52 },
          { width: 128, duration, ease: "power3.out" },
          0.04
        );
    }

    if (!active && visibleRef.current) {
      visibleRef.current = false;
      gsap
        .timeline({
          defaults: { ease },
          onComplete: () => {
            gsap.set(wrap, { pointerEvents: "none" });
          },
        })
        .to(pill, { width: 52, duration: duration * 0.85 }, 0)
        .to(wrap, { autoAlpha: 0, y: 28, duration: duration * 0.9 }, 0.06);
    }
  }, [active]);

  return (
    <div className="cards-crumb" ref={wrapRef} aria-hidden={!active}>
      <div className="cards-crumb__pill" ref={pillRef}>
        <button
          className="cards-crumb__btn"
          type="button"
          aria-label="Previous card"
          onClick={onPrev}
          tabIndex={active ? 0 : -1}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button
          className="cards-crumb__btn"
          type="button"
          aria-label="Next card"
          onClick={onNext}
          tabIndex={active ? 0 : -1}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
