import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import "./MapShadowCard.css";

gsap.registerPlugin(useGSAP);

export default function MapShadowCard() {
  const rootRef = useRef(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const track = root.querySelector(".map-card__headline-track");
      if (!track) return;

      const distance = track.scrollWidth / 2;
      gsap.to(track, {
        x: -distance,
        duration: 14,
        ease: "none",
        repeat: -1,
      });
    },
    { scope: rootRef }
  );

  return (
    <article className="map-card" ref={rootRef}>
      <button className="map-card__arrow" type="button" aria-label="Open">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 17L17 7M17 7H9M17 7V15"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="map-card__headline" aria-hidden="true">
        <div className="map-card__headline-track">
          <span>TOGETHER LET’S</span>
          <span>TOGETHER LET’S</span>
        </div>
      </div>

      <p className="map-card__pill">Get a 5-Day Trial for $9.00 USD •</p>
    </article>
  );
}
