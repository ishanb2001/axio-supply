import { useRef } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";
import { projects, projectStatus } from "../data/projects";
import people01 from "../assets/pexels-eman-genatilan-3459781-6812785.jpg";
import people02 from "../assets/pexels-emilianovittoriosi-20797574.jpg";
import people03 from "../assets/pexels-ezeguna_graphy-sulaiman-muhammad-2153324075-34689847.jpg";
import people04 from "../assets/pexels-jibarofoto-1759530.jpg";
import people05 from "../assets/pexels-michelangelo-buonarroti-8726735.jpg";
import people06 from "../assets/pexels-nguy-n-danh-91089729-9119804.jpg";
import people07 from "../assets/pexels-zeal-creative-studios-58866141-39082416.jpg";
import "./FloatTiles.css";

gsap.registerPlugin(useGSAP, CustomEase);

const TILE_EASE = CustomEase.create("floatTileStep", "0.76, 0, 0.24, 1");

const PEOPLE = [people01, people02, people03, people04, people05, people06, people07];

export default function FloatTiles() {
  const rootRef = useRef(null);
  const cursorRef = useRef(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      const cursor = cursorRef.current;
      if (!root || !cursor) return;
      const arrow = cursor.querySelector(".float-tiles__cursor-arrow");

      const cards = gsap.utils.toArray(".float-tiles__tile", root);
      if (!cards.length) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const compactQuery = window.matchMedia("(max-width: 1024px)");
      let compact = compactQuery.matches;
      const onCompact = () => {
        compact = compactQuery.matches;
      };
      compactQuery.addEventListener("change", onCompact);
      let inView = true;
      const visibility = new IntersectionObserver(
        ([entry]) => {
          inView = entry.isIntersecting;
        },
        { rootMargin: "180px 0px" }
      );
      visibility.observe(root);
      const maxFocus = cards.length - 1;
      let focus = Math.round(maxFocus / 2);
      let velocity = 0;
      let dragging = false;
      let dragged = false;
      let originX = 0;
      let lastX = 0;
      let lastTime = 0;
      let facing = 1;
      let stepTween = null;

      const GAP = 32;
      let step = 500;

      const pose = (delta) => {
        const influence = Math.exp(-(delta * delta) * 4);
        const degrees = gsap.utils.clamp(-68, 68, delta * 28);
        const theta = (degrees * Math.PI) / 180;
        const scale = 0.92 + influence * 0.12;
        const z = (Math.cos(theta) - 1) * 980;
        return {
          degrees,
          scale,
          z,
          half: (cards[0].offsetWidth * scale * Math.abs(Math.cos(theta))) / 2,
          project: 1800 / (1800 - z),
        };
      };

      const wrapDelta = (index) => {
        const count = cards.length;
        let delta = index - focus;
        delta = ((delta % count) + count) % count;
        if (delta > count / 2) delta -= count;
        return delta;
      };

      const render = () => {
        if (window.matchMedia("(max-width: 1024px)").matches) {
          const width = cards[0].offsetWidth || 160;
          step = width + 14;
          cards.forEach((card, index) => {
            const delta = wrapDelta(index);
            const away = Math.abs(delta);
            gsap.set(card, {
              xPercent: -50,
              yPercent: -50,
              x: delta * step,
              y: 0,
              z: 0,
              rotationY: 0,
              scale: 1,
              autoAlpha: away > 2.15 ? 0 : 1,
              zIndex: Math.round(40 - away * 10),
              force3D: true,
            });
          });
          return;
        }

        const items = cards.map((card, index) => ({ card, delta: wrapDelta(index) }));
        items.sort((a, b) => a.delta - b.delta);
        const placed = items.map((item) => pose(item.delta));
        const along = [0];
        for (let index = 1; index < items.length; index += 1) {
          along[index] = along[index - 1] + placed[index - 1].half + GAP + placed[index].half;
        }

        let anchor = along[0];
        let stride = cards[0].offsetWidth;
        for (let index = 0; index < items.length; index += 1) {
          const delta = items[index].delta;
          const next = items[index + 1];
          if (next) stride = Math.max(1, along[index + 1] - along[index]);
          if (delta >= 0 || !next) {
            anchor = along[index];
            break;
          }
          if (next.delta >= 0) {
            const span = next.delta - delta || 1;
            anchor = along[index] + (along[index + 1] - along[index]) * ((0 - delta) / span);
            break;
          }
        }
        step = stride;

        items.forEach((item, index) => {
          const { degrees, scale, z, project } = placed[index];
          gsap.set(item.card, {
            xPercent: -50,
            yPercent: -50,
            x: (along[index] - anchor) / project,
            y: 0,
            z,
            rotationY: -degrees,
            scale,
            autoAlpha: 1,
            zIndex: Math.round((3 - Math.min(Math.abs(item.delta), 3)) * 40),
            force3D: true,
          });
        });
      };

      render();

      const tick = () => {
        if (!inView) return;
        if (compact) {
          if (!dragging && !reduced && !stepTween?.isActive()) {
            focus += 0.42 * (gsap.ticker.deltaRatio() / 60);
          }
          render();
          return;
        }
        if (dragging || reduced || stepTween?.isActive()) return;
        const dt = gsap.ticker.deltaRatio();
        if (Math.abs(velocity) >= 0.02) {
          focus += velocity * (dt / 60);
          velocity *= Math.pow(0.94, dt);
          render();
          return;
        }
        velocity = 0;
        const nearest = Math.round(focus);
        const delta = nearest - focus;
        if (Math.abs(delta) < 0.001) {
          if (focus !== nearest) {
            focus = nearest;
            render();
          }
          return;
        }
        focus += delta * Math.min(1, 0.16 * dt);
        render();
      };
      if (!reduced) gsap.ticker.add(tick);

      const stepBy = (direction) => {
        const goal = Math.round(focus) + direction;
        velocity = 0;
        stepTween?.kill();
        const proxy = { value: focus };
        stepTween = gsap.to(proxy, {
          value: goal,
          duration: reduced ? 0 : 0.75,
          ease: TILE_EASE,
          overwrite: true,
          onUpdate: () => {
            focus = proxy.value;
            render();
          },
        });
      };

      gsap.set(cursor, { xPercent: -50, yPercent: -50, scale: 0, autoAlpha: 0 });
      if (arrow) gsap.set(arrow, { rotation: 0, transformOrigin: "50% 50%" });

      let pointer = null;
      let hovering = false;

      const placeCursor = (clientX, clientY) => {
        gsap.set(cursor, { x: clientX, y: clientY });
        const rect = root.getBoundingClientRect();
        const next = clientX < rect.left + rect.width / 2 ? -1 : 1;
        if (!arrow || next === facing) return;
        facing = next;
        gsap.to(arrow, {
          rotation: facing < 0 ? 180 : 0,
          duration: reduced ? 0 : 0.35,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      const showCursor = () => {
        if (hovering) return;
        hovering = true;
        gsap.killTweensOf(cursor, "scale,autoAlpha");
        gsap.to(cursor, {
          scale: 1,
          autoAlpha: 1,
          duration: reduced ? 0 : 0.35,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      const hideCursor = () => {
        if (!hovering) return;
        hovering = false;
        pointer = null;
        gsap.killTweensOf(cursor, "scale,autoAlpha");
        gsap.to(cursor, {
          scale: 0,
          autoAlpha: 0,
          duration: reduced ? 0 : 0.25,
          ease: "power2.inOut",
          overwrite: "auto",
        });
      };

      const trackPointer = () => {
        if (!pointer) return;
        const rect = root.getBoundingClientRect();
        const over =
          pointer.x >= rect.left &&
          pointer.x <= rect.right &&
          pointer.y >= rect.top &&
          pointer.y <= rect.bottom;
        if (!over) {
          hideCursor();
          return;
        }
        placeCursor(pointer.x, pointer.y);
        showCursor();
      };
      gsap.ticker.add(trackPointer);

      const onDown = (event) => {
        if (event.button !== 0) return;
        dragging = true;
        dragged = false;
        velocity = 0;
        stepTween?.kill();
        originX = event.clientX;
        lastX = event.clientX;
        lastTime = performance.now();
        root.classList.add("is-dragging");
        root.setPointerCapture?.(event.pointerId);
      };

      const onMove = (event) => {
        pointer = { x: event.clientX, y: event.clientY };
        placeCursor(event.clientX, event.clientY);
        showCursor();
        if (!dragging) return;
        const now = performance.now();
        const dt = Math.max(16, now - lastTime) / 1000;
        const delta = -(event.clientX - lastX) / step;
        if (Math.abs(event.clientX - originX) > 6) dragged = true;
        focus += delta;
        velocity = delta / dt;
        lastX = event.clientX;
        lastTime = now;
        render();
      };

      const onUp = (event) => {
        if (!dragging) return;
        dragging = false;
        root.classList.remove("is-dragging");
        if (root.hasPointerCapture?.(event.pointerId)) root.releasePointerCapture(event.pointerId);
        if (reduced) {
          focus = Math.round(focus);
          render();
        }
      };

      const onEnter = (event) => {
        onMove(event);
      };

      const onLeave = () => {
        if (dragging) return;
        hideCursor();
      };

      const onClick = (event) => {
        if (dragged) return;
        const rect = root.getBoundingClientRect();
        stepBy(event.clientX < rect.left + rect.width / 2 ? -1 : 1);
      };

      root.addEventListener("pointerdown", onDown);
      root.addEventListener("pointermove", onMove);
      root.addEventListener("pointerup", onUp);
      root.addEventListener("pointercancel", onUp);
      root.addEventListener("pointerenter", onEnter);
      root.addEventListener("pointerleave", onLeave);
      root.addEventListener("click", onClick);
      const onResize = () => render();
      window.addEventListener("resize", onResize);

      return () => {
        root.removeEventListener("pointerdown", onDown);
        root.removeEventListener("pointermove", onMove);
        root.removeEventListener("pointerup", onUp);
        root.removeEventListener("pointercancel", onUp);
        root.removeEventListener("pointerenter", onEnter);
        root.removeEventListener("pointerleave", onLeave);
        root.removeEventListener("click", onClick);
        window.removeEventListener("resize", onResize);
        stepTween?.kill();
        gsap.ticker.remove(trackPointer);
        if (!reduced) gsap.ticker.remove(tick);
        compactQuery.removeEventListener("change", onCompact);
        visibility.disconnect();
      };
    },
    { scope: rootRef }
  );

  return (
    <div className="float-tiles" ref={rootRef} aria-hidden="true">
      {createPortal(
        <div className="float-tiles__cursor" ref={cursorRef} aria-hidden="true">
          <span className="float-tiles__cursor-arrow">
            <svg viewBox="0 0 24 24">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </div>,
        document.body
      )}
      <div className="float-tiles__row">
        {projects.map((project, index) => (
          <article className="float-tiles__tile" key={project.id}>
            <div className="float-tiles__stage">
              <img
                className="float-tiles__shot"
                src={PEOPLE[index % PEOPLE.length]}
                alt=""
                draggable={false}
                decoding="async"
                decoding="async"
                loading={index < 2 ? "eager" : "lazy"}
                fetchPriority={index < 2 ? "high" : "low"}
              />
            </div>
            <div className="float-tiles__meta">
              <h3>{project.title}</h3>
              <p>{projectStatus(project)}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
