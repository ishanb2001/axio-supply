import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";
import { projects, projectStatus } from "../data/projects";
import motionBg from "../assets/bg-cards-2.jpg";
import componentsBg from "../assets/bg-4.jpg";
import systemsBg from "../assets/bg-5.jpg";
import faceOne from "../assets/pexels-emilianovittoriosi-20797574.jpg";
import faceTwo from "../assets/pexels-ezeguna_graphy-sulaiman-muhammad-2153324075-34689847.jpg";
import faceThree from "../assets/pexels-michelangelo-buonarroti-8726735.jpg";
import faceFour from "../assets/pexels-nguy-n-danh-91089729-9119804.jpg";
import "./FeatureCards.css";

gsap.registerPlugin(useGSAP, CustomEase);

const ARROW_EASE = CustomEase.create("libraryArrow", "0.76, 0, 0.24, 1");
const LETTER_EASE = CustomEase.create("libraryLetter", "0.32, 0.72, 0, 1");
const CUBE_EASE = CustomEase.create("featureCube", "0.76, 0, 0.24, 1");
const FOLD = 46;
const CARD_GAP = 28;

const CAPTION = "Live in the browser.\nYours if it fits.";
const LIBRARY_LABEL = "View the library";
const TRUST_FACES = [
  { src: faceOne, position: "center 18%" },
  { src: faceTwo, position: "center 22%" },
  { src: faceThree, position: "center 18%" },
  { src: faceFour, position: "center 28%" },
];

const RING_COPIES = 2;

export const PIECES = [
  { id: "violet", image: motionBg },
  { id: "amber", image: componentsBg },
  { id: "sunset", image: systemsBg },
  { id: "coral", gradient: "radial-gradient(circle at 28% 18%, #ffd0a8 0%, #ff6a3d 38%, #9a1848 100%)" },
  { id: "tide", gradient: "linear-gradient(145deg, #123a4a 0%, #1f8a8a 46%, #d7f36a 100%)" },
  { id: "bloom", gradient: "radial-gradient(circle at 70% 30%, #ffe27a 0%, #ff4f9a 42%, #3a1570 100%)" },
  { id: "dusk", gradient: "linear-gradient(160deg, #1b1440 0%, #6d28d9 48%, #f43f5e 100%)" },
].map((piece, index) => {
  const project = projects[index % projects.length];
  return {
    ...piece,
    title: project?.title ?? "Untitled",
    status: project ? projectStatus(project) : "Free",
    caption: CAPTION,
    index: String(index + 1).padStart(2, "0"),
  };
});

export default function FeatureCards({ onOpen }) {
  const rootRef = useRef(null);
  const viewportRef = useRef(null);
  const rowRef = useRef(null);
  const cursorRef = useRef(null);

  useGSAP(
    (_context, contextSafe) => {
      const root = rootRef.current;
      const viewport = viewportRef.current;
      const row = rowRef.current;
      const cursor = cursorRef.current;
      if (!root || !viewport || !row || !cursor) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const panels = gsap.utils.toArray(".feature-cards__panel", row);
      const count = panels.length;
      const spin = { index: 0 };
      const arrow = cursor.querySelector(".feature-cards__cursor-arrow");
      let spinTween = null;
      let goal = 0;
      let orbit = 480;
      let facing = 1;

      const isCompact = () => window.matchMedia("(max-width: 1024px)").matches;

      const layout = () => {
        const target = viewport.clientWidth;
        if (isCompact()) {
          const width = Math.min(Math.max(target - 80, 200), 300);
          const height = Math.round(width * 0.7);
          viewport.style.setProperty("--panel-w", `${width}px`);
          viewport.style.setProperty("--panel-h", `${height}px`);
          const foldRad = (FOLD * Math.PI) / 180;
          const cos = Math.cos(foldRad);
          const sin = Math.sin(foldRad);
          orbit = (height / 2) * (sin / (1 - cos)) + 16 / sin;
          return;
        }

        const foldRad = (FOLD * Math.PI) / 180;
        const cos = Math.cos(foldRad);
        const sin = Math.sin(foldRad);
        const scene = viewport.querySelector(".feature-cards__scene");
        const perspective = parseFloat(getComputedStyle(scene).perspective);
        const span = 1 + 2 * cos;
        let width = (target - CARD_GAP * 2) / span;
        if (Number.isFinite(perspective) && perspective > 0) {
          const half =
            ((target / 2) * perspective -
              CARD_GAP * (perspective + ((target / 2) * (cos - 1)) / sin)) /
            (span * perspective - target * sin);
          if (half > 0) width = half * 2;
        }
        width = Math.max(220, width);
        const height = Math.round(24 + (width - 24) * (10 / 16) + 44);
        orbit = (width / 2) * (sin / (1 - cos)) + CARD_GAP / sin;
        viewport.style.setProperty("--panel-w", `${width}px`);
        viewport.style.setProperty("--panel-h", `${height}px`);
      };

      const wrap = (value) => {
        let offset = value % count;
        if (offset > count / 2) offset -= count;
        if (offset < -count / 2) offset += count;
        return offset;
      };

      const apply = () => {
        if (isCompact()) {
          panels.forEach((panel, index) => {
            const offset = wrap(index - spin.index);
            const away = Math.abs(offset);
            if (away > 1.7) {
              gsap.set(panel, { autoAlpha: 0, zIndex: 0, rotationX: 0, rotationY: 0 });
              return;
            }
            const phi = offset * FOLD;
            const rad = (phi * Math.PI) / 180;
            const z = (Math.cos(rad) - 1) * orbit;
            gsap.set(panel, {
              xPercent: -50,
              yPercent: -50,
              x: 0,
              y: Math.sin(rad) * orbit,
              z,
              rotationX: -phi,
              rotationY: 0,
              rotation: 0,
              scale: 1,
              transformOrigin: "50% 50%",
              autoAlpha: gsap.utils.clamp(0, 1, gsap.utils.mapRange(1.7, 1.15, 0, 1, away)),
              zIndex: Math.round(200 + z),
              force3D: true,
            });
          });
          return;
        }

        panels.forEach((panel, index) => {
          const offset = wrap(index - spin.index);
          const away = Math.abs(offset);
          if (away > 1.7) {
            gsap.set(panel, { autoAlpha: 0, zIndex: 0 });
            return;
          }
          const phi = offset * FOLD;
          const rad = (phi * Math.PI) / 180;
          const z = (Math.cos(rad) - 1) * orbit;
          gsap.set(panel, {
            xPercent: -50,
            yPercent: -50,
            x: Math.sin(rad) * orbit,
            y: 0,
            z,
            rotationX: 0,
            rotationY: phi,
            rotation: 0,
            transformOrigin: "50% 50%",
            autoAlpha: gsap.utils.clamp(0, 1, gsap.utils.mapRange(1.7, 1.15, 0, 1, away)),
            zIndex: Math.round(200 + z),
            force3D: true,
          });
        });
      };

      const rotateBy = contextSafe((direction) => {
        goal += direction;
        spinTween?.kill();
        const distance = Math.abs(goal - spin.index);
        if (reduced || distance < 0.001) {
          spin.index = goal;
          apply();
          return;
        }
        spinTween = gsap.to(spin, {
          index: goal,
          duration: gsap.utils.clamp(0.75, 1.2, 0.9 * distance),
          ease: CUBE_EASE,
          overwrite: true,
          onUpdate: apply,
        });
      });

      gsap.set(cursor, { xPercent: -50, yPercent: -50, scale: 0, autoAlpha: 0 });
      if (arrow) gsap.set(arrow, { rotation: 0, transformOrigin: "50% 50%" });

      let lastWidth = viewport.clientWidth;
      const onResize = () => {
        lastWidth = viewport.clientWidth;
        layout();
        apply();
      };

      layout();
      apply();
      const watchWidth = () => {
        const next = viewport.clientWidth;
        if (next === lastWidth) return;
        onResize();
      };
      const observer = new ResizeObserver(watchWidth);
      observer.observe(viewport);
      window.addEventListener("resize", onResize);

      const placeCursor = (event) => {
        gsap.set(cursor, { x: event.clientX, y: event.clientY });
      };

      const onMove = (event) => {
        const rect = viewport.getBoundingClientRect();
        const next = event.clientX < rect.left + rect.width / 2 ? -1 : 1;
        placeCursor(event);
        if (next === facing || !arrow) return;
        facing = next;
        gsap.to(arrow, {
          rotation: facing < 0 ? 180 : 0,
          duration: reduced ? 0 : 0.35,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      const onEnter = (event) => {
        onMove(event);
        gsap.killTweensOf(cursor, "scale,autoAlpha");
        gsap.to(cursor, {
          scale: 1,
          autoAlpha: 1,
          duration: reduced ? 0 : 0.35,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      const onLeave = () => {
        gsap.killTweensOf(cursor, "scale,autoAlpha");
        gsap.to(cursor, {
          scale: 0,
          autoAlpha: 0,
          duration: reduced ? 0 : 0.25,
          ease: "power2.inOut",
          overwrite: "auto",
        });
      };

      const onClick = (event) => {
        if (touchGesture) {
          touchGesture = false;
          return;
        }
        const rect = viewport.getBoundingClientRect();
        rotateBy(event.clientX < rect.left + rect.width / 2 ? -1 : 1);
      };

      let swipeStartX = 0;
      let swipeStartY = 0;
      let touchGesture = false;
      const onPointerDown = (event) => {
        if (event.pointerType === "mouse") return;
        touchGesture = true;
        swipeStartX = event.clientX;
        swipeStartY = event.clientY;
      };
      const onPointerUp = (event) => {
        if (event.pointerType === "mouse") return;
        const deltaX = event.clientX - swipeStartX;
        const deltaY = event.clientY - swipeStartY;
        const vertical = isCompact() && Math.abs(deltaY) > Math.abs(deltaX);
        const delta = vertical ? deltaY : deltaX;
        if (Math.abs(delta) < 28) {
          if (isCompact()) {
            rotateBy(1);
            return;
          }
          const rect = viewport.getBoundingClientRect();
          rotateBy(event.clientX < rect.left + rect.width / 2 ? -1 : 1);
          return;
        }
        rotateBy(delta < 0 ? 1 : -1);
      };

      viewport.addEventListener("pointerenter", onEnter);
      viewport.addEventListener("pointermove", onMove);
      viewport.addEventListener("pointerleave", onLeave);
      viewport.addEventListener("click", onClick);
      viewport.addEventListener("pointerdown", onPointerDown);
      viewport.addEventListener("pointerup", onPointerUp);

      const libraryBtn = root.querySelector(".feature-cards__library");
      const square = libraryBtn?.querySelector(".feature-cards__library-square");
      const arrows = libraryBtn ? gsap.utils.toArray(".feature-cards__library-arrow", libraryBtn) : [];
      const chars = libraryBtn ? gsap.utils.toArray(".feature-cards__library-char", libraryBtn) : [];
      const glyphRows = chars.map((char) => gsap.utils.toArray(".feature-cards__library-glyph", char));
      const restingGlyphs = glyphRows.map((row) => row[0]).filter(Boolean);
      const incomingGlyphs = glyphRows.map((row) => row[1]).filter(Boolean);
      if (libraryBtn && square && arrows.length === 2 && restingGlyphs.length && restingGlyphs.length === incomingGlyphs.length) {
        gsap.set(arrows[1], { yPercent: 110 });
        gsap.set(incomingGlyphs, { yPercent: 110 });
        const letterStagger = { amount: 0.18, from: "start" };
        const hoverTl = gsap.timeline({ paused: true });
        hoverTl
          .to(square, {
            backgroundColor: "#2a2a2c",
            borderRadius: 14,
            scale: 0.9,
            duration: 0.45,
            ease: ARROW_EASE,
          }, 0)
          .to(arrows[0], { yPercent: -110, duration: 0.7, ease: ARROW_EASE }, 0)
          .fromTo(arrows[1], { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: ARROW_EASE, immediateRender: false }, 0)
          .to(restingGlyphs, {
            yPercent: -110,
            duration: 0.8,
            ease: LETTER_EASE,
            stagger: letterStagger,
          }, 0)
          .fromTo(incomingGlyphs, { yPercent: 110 }, {
            yPercent: 0,
            duration: 0.8,
            ease: LETTER_EASE,
            stagger: letterStagger,
            immediateRender: false,
          }, 0);
        const onEnter = () => {
          if (reduced) {
            gsap.set(square, { backgroundColor: "#2a2a2c", borderRadius: 14, scale: 0.9 });
            return;
          }
          hoverTl.play();
        };
        const onLeave = () => {
          if (reduced) {
            gsap.set(square, { backgroundColor: "#2f5bff", borderRadius: 0, scale: 1 });
            return;
          }
          hoverTl.reverse();
        };
        const onPress = () => {
          gsap.to(libraryBtn, { y: 8, duration: 0.12, ease: "power2.out", overwrite: "auto" });
        };
        const onRelease = () => {
          gsap.to(libraryBtn, { y: 0, duration: 0.45, delay: 0.07, ease: ARROW_EASE, overwrite: "auto" });
        };
        libraryBtn.addEventListener("pointerenter", onEnter);
        libraryBtn.addEventListener("pointerleave", onLeave);
        libraryBtn.addEventListener("pointerdown", onPress);
        libraryBtn.addEventListener("pointerup", onRelease);
        libraryBtn.addEventListener("pointerleave", onRelease);
        libraryBtn.addEventListener("pointercancel", onRelease);
        libraryBtn._arrowCleanup = () => {
          hoverTl.kill();
          libraryBtn.removeEventListener("pointerenter", onEnter);
          libraryBtn.removeEventListener("pointerleave", onLeave);
          libraryBtn.removeEventListener("pointerdown", onPress);
          libraryBtn.removeEventListener("pointerup", onRelease);
          libraryBtn.removeEventListener("pointerleave", onRelease);
          libraryBtn.removeEventListener("pointercancel", onRelease);
        };
      }

      return () => {
        viewport.removeEventListener("pointerenter", onEnter);
        viewport.removeEventListener("pointermove", onMove);
        viewport.removeEventListener("pointerleave", onLeave);
        viewport.removeEventListener("click", onClick);
        viewport.removeEventListener("pointerdown", onPointerDown);
        viewport.removeEventListener("pointerup", onPointerUp);
        observer.disconnect();
        window.removeEventListener("resize", onResize);
        spinTween?.kill();
        root.querySelector(".feature-cards__library")?._arrowCleanup?.();
      };
    },
    { scope: rootRef }
  );

  return (
    <section className="feature-cards" ref={rootRef}>
      <div className="feature-cards__intro">
        <p className="feature-cards__kicker">Newest pieces,</p>
        <h2 className="feature-cards__title">ready to open.</h2>
      </div>
      <div className="feature-cards__cylinder" ref={viewportRef}>
        <div className="feature-cards__cursor" ref={cursorRef} aria-hidden="true">
          <span className="feature-cards__cursor-arrow">
            <svg viewBox="0 0 24 24">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </div>
        <div className="feature-cards__scene">
          <div className="feature-cards__ring" ref={rowRef}>
          {Array.from({ length: RING_COPIES }, (_, copy) =>
            PIECES.map((piece) => (
              <article className="feature-cards__panel" key={`${piece.id}-${copy}`}>
                <div
                  className="feature-cards__stage"
                  style={{
                    backgroundImage: piece.image ? `url(${piece.image})` : piece.gradient,
                  }}
                />
                <div className="feature-cards__meta">
                  <h3>{piece.title}</h3>
                  <p>{piece.status}</p>
                </div>
              </article>
            ))
          )}
          </div>
        </div>
      </div>
      <div className="feature-cards__foot">
        <div className="feature-cards__trust">
          <div className="feature-cards__faces" aria-hidden="true">
            {TRUST_FACES.map((face) => (
              <img
                className="feature-cards__face"
                key={face.src}
                src={face.src}
                alt=""
                style={{ objectPosition: face.position }}
              />
            ))}
            <span className="feature-cards__mark">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.5v19M3.8 7.2l16.4 9.6M20.2 7.2 3.8 16.8" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
              </svg>
            </span>
          </div>
          <p>
            Trusted by 10,000+
            <br />
            designers and agencies
          </p>
        </div>
        <button className="feature-cards__library" type="button" aria-label={LIBRARY_LABEL} onClick={onOpen}>
          <span className="feature-cards__library-label" aria-hidden="true">
            {LIBRARY_LABEL.split("").map((char, index) => (
              <span className="feature-cards__library-char" key={`${char}-${index}`}>
                <span className="feature-cards__library-glyph">{char === " " ? "\u00a0" : char}</span>
                <span className="feature-cards__library-glyph">{char === " " ? "\u00a0" : char}</span>
              </span>
            ))}
          </span>
          <span className="feature-cards__library-square" aria-hidden="true">
            <span className="feature-cards__library-arrow">
              <svg viewBox="0 0 24 24">
                <path d="M4 12h16M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="feature-cards__library-arrow">
              <svg viewBox="0 0 24 24">
                <path d="M4 12h16M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </span>
        </button>
      </div>
    </section>
  );
}
