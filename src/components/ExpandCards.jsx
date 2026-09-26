import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./ExpandCards.css";

gsap.registerPlugin(useGSAP, CustomEase, ScrollTrigger);

const CARD_EASE = CustomEase.create("expandCardEase", "M0,0 C0.4,0 0.2,1 1,1");
const CARD_GAP = 16;

const LAYERS = [
  { kind: "motion", label: "motion", index: "01", tone: "blue" },
  { kind: "components", label: "components", index: "02", tone: "orange" },
  { kind: "systems", label: "systems", index: "03", tone: "black" },
];

const STILLS = {
  motion: "/images/card-still-motion.jpg",
  components: "/images/card-still-components.jpg",
  systems: "/images/card-still-systems.jpg",
};

export default function ExpandCards() {
  const rootRef = useRef(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;

      const root = rootRef.current;
      if (!root) return;

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
            <div className="home-expand__glass">
              <img
                className="home-expand__still"
                src={STILLS[layer.kind]}
                alt=""
                draggable={false}
              />
            </div>
          </article>
          <h3 className="home-expand__caption">{layer.label}</h3>
        </div>
      ))}
    </div>
  );
}
