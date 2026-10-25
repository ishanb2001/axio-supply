import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import motionBg from "../assets/bg-cards-2.jpg";
import componentsBg from "../assets/bg-4.jpg";
import systemsBg from "../assets/bg-5.jpg";
import "./ExpandCards.css";

gsap.registerPlugin(useGSAP, CustomEase, ScrollTrigger);

const CARD_EASE = CustomEase.create("expandCardEase", "M0,0 C0.4,0 0.2,1 1,1");
const HOVER_EASE = CustomEase.create("expandCardHover", "0.22, 1, 0.36, 1");
const CARD_GAP = 16;
const CARD_NUDGES = [
  { x: -7, y: -10, rotation: -1.4 },
  { x: 0, y: -13, rotation: 0.5 },
  { x: 8, y: -9, rotation: 1.6 },
];

const LAYERS = [
  {
    kind: "motion",
    index: "01",
    tone: "blue",
    lines: ["Scroll and hover.", "Already in motion."],
  },
  {
    kind: "components",
    index: "02",
    tone: "orange",
    lines: ["Nav, cards, type.", "Open and running."],
  },
  {
    kind: "systems",
    index: "03",
    tone: "black",
    lines: ["Glass and layout.", "Made to sit together."],
  },
];

const CARD_BACKGROUNDS = {
  motion: motionBg,
  components: componentsBg,
  systems: systemsBg,
};

export default function ExpandCards() {
  const rootRef = useRef(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;

      const root = rootRef.current;
      if (!root) return;

      const cards = gsap.utils.toArray(".home-expand__card", root);
      const hoverCleanups = cards.map((card, index) => {
        const nudge = CARD_NUDGES[index] ?? CARD_NUDGES[0];
        const onEnter = () => {
          gsap.to(card, {
            ...nudge,
            duration: 0.55,
            ease: HOVER_EASE,
            overwrite: "auto",
          });
        };
        const onLeave = () => {
          gsap.to(card, {
            x: 0,
            y: 0,
            rotation: 0,
            duration: 0.65,
            ease: HOVER_EASE,
            overwrite: "auto",
          });
        };
        card.addEventListener("pointerenter", onEnter);
        card.addEventListener("pointerleave", onLeave);
        return () => {
          card.removeEventListener("pointerenter", onEnter);
          card.removeEventListener("pointerleave", onLeave);
        };
      });

      try {
        const blue = root.querySelector(".home-expand__col--blue");
        const orange = root.querySelector(".home-expand__col--orange");
        const black = root.querySelector(".home-expand__col--black");

        if (blue && orange && black) {
          const mm = gsap.matchMedia();
          mm.add("(min-width: 861px)", () => {
            const section = root.closest(".home-expand") || root;
            const measurePitch = () => {
              const width = root.getBoundingClientRect().width;
              return (width + CARD_GAP) / 3;
            };
            let pitch = measurePitch();
            const onResize = () => {
              pitch = measurePitch();
            };
            window.addEventListener("resize", onResize);

            gsap.set([blue, orange, black], {
              y: 0,
              rotation: 0,
              scale: 1,
              force3D: true,
              transformOrigin: "50% 50%",
            });
            gsap.set(blue, { x: pitch, zIndex: 3 });
            gsap.set(orange, { x: 0, zIndex: 2 });
            gsap.set(black, { x: -pitch, zIndex: 1 });

            const tl = gsap.timeline({
              defaults: { ease: "none", overwrite: "auto" },
              scrollTrigger: {
                trigger: section,
                start: "top 78%",
                end: "center 42%",
                scrub: 0.7,
                invalidateOnRefresh: true,
              },
            });

            tl.fromTo(orange, { rotation: 0 }, { rotation: -9, duration: 0.7 }, 0);
            tl.fromTo(
              black,
              { x: () => -pitch, rotation: 0 },
              { x: () => -pitch, rotation: 9, duration: 0.7 },
              0.03
            );
            tl.fromTo(
              blue,
              { x: () => pitch, rotation: 0 },
              { x: () => pitch, rotation: 0, duration: 0.4 },
              0
            );

            const openAt = 0.4;
            tl.to(
              blue,
              { x: 0, rotation: 0, duration: 1.6, ease: CARD_EASE },
              openAt
            );
            tl.to(
              orange,
              { x: 0, y: 0, rotation: 0, duration: 1.6, ease: CARD_EASE },
              openAt
            );
            tl.to(
              black,
              { x: 0, y: 0, rotation: 0, duration: 1.7, ease: CARD_EASE },
              openAt + 0.06
            );

            return () => window.removeEventListener("resize", onResize);
          });
        }
      } catch (error) {
        console.error(error);
      }

      return () => {
        hoverCleanups.forEach((cleanup) => cleanup());
      };
    },
    { scope: rootRef }
  );

  return (
    <div className="home-expand__cards" ref={rootRef}>
      {LAYERS.map((layer) => (
        <div
          className={`home-expand__col home-expand__col--${layer.tone}`}
          key={layer.kind}
        >
          <article
            className={`home-expand__card home-expand__card--${layer.tone}`}
          >
            <span className="home-expand__label">{layer.index}</span>
            <p className="home-expand__headline">
              {layer.lines[0]}
              <br />
              {layer.lines[1]}
            </p>
            <div
              className="home-expand__glass"
              style={{ backgroundImage: `url(${CARD_BACKGROUNDS[layer.kind]})` }}
            />
          </article>
        </div>
      ))}
    </div>
  );
}
