import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import "./FloatTiles.css";

gsap.registerPlugin(useGSAP);

const TILES = [
  { w: 280 },
  { w: 386 },
  { w: 246 },
  { w: 333 },
  { w: 294 },
  { w: 414 },
  { w: 260 },
  { w: 353 },
];

export default function FloatTiles() {
  const rootRef = useRef(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const row = root.querySelector(".float-tiles__row");
      if (!row) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.fromTo(
        row,
        { x: 0 },
        { x: -row.scrollWidth / 2, duration: 28, ease: "none", repeat: -1 }
      );
    },
    { scope: rootRef }
  );

  return (
    <div className="float-tiles" ref={rootRef} aria-hidden="true">
      <div className="float-tiles__row">
        {[...TILES, ...TILES].map((tile, index) => (
          <div
            className="float-tiles__tile"
            key={index}
            style={{ width: tile.w }}
          />
        ))}
      </div>
    </div>
  );
}
