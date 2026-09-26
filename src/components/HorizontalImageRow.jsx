import { forwardRef, useImperativeHandle, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";
import "./HorizontalImageRow.css";

gsap.registerPlugin(useGSAP, CustomEase);
CustomEase.create("momentumSettle", "M0,0 C0.14,0.88 0.2,1 1,1");
CustomEase.create("rowEase", "M0,0 C0.22,1 0.36,1 1,1");

const CARDS = [
  { title: "Forest bridge" },
  { title: "Alpine light" },
  { title: "City dusk" },
  { title: "Desert ridge" },
  { title: "Coastal fog" },
];

const HorizontalImageRow = forwardRef(function HorizontalImageRow(_, ref) {
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const slotRefs = useRef([]);
  const stretchRefs = useRef([]);
  const apiRef = useRef({ prev: () => {}, next: () => {} });

  useImperativeHandle(ref, () => ({
    prev: () => apiRef.current.prev(),
    next: () => apiRef.current.next(),
  }));

  useGSAP(
    () => {
      const root = rootRef.current;
      const list = listRef.current;
      if (!root || !list) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const slots = slotRefs.current.filter(Boolean);
      const stretches = stretchRefs.current.filter(Boolean);

      gsap.set(list, { force3D: true, x: 0 });
      gsap.set(slots, { force3D: true, x: 0 });
      gsap.set(stretches, {
        force3D: true,
        scaleX: 1,
        transformOrigin: "50% 50%",
      });

      const cards = gsap.utils.toArray(".image-row__card", root);
      gsap.set(cards, { force3D: true, x: 0, y: 0 });

      const magneticCleanups = cards.map((card) => {
        const xTo = gsap.quickTo(card, "x", {
          duration: reduced ? 0 : 0.55,
          ease: "power3.out",
        });
        const yTo = gsap.quickTo(card, "y", {
          duration: reduced ? 0 : 0.55,
          ease: "power3.out",
        });

        const onMove = (event) => {
          if (reduced) return;
          const rect = card.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width - 0.5) * 12;
          const y = ((event.clientY - rect.top) / rect.height - 0.5) * 10;
          xTo(gsap.utils.clamp(-7, 7, x));
          yTo(gsap.utils.clamp(-6, 6, y));
        };

        const onLeave = () => {
          xTo(0);
          yTo(0);
        };

        card.addEventListener("pointermove", onMove);
        card.addEventListener("pointerleave", onLeave);

        return () => {
          card.removeEventListener("pointermove", onMove);
          card.removeEventListener("pointerleave", onLeave);
          gsap.set(card, { x: 0, y: 0 });
        };
      });

      const spreadTo = slots.map((slot, index) =>
        gsap.quickTo(slot, "x", {
          duration: reduced ? 0 : 0.55 + index * 0.06,
          ease: "momentumSettle",
        })
      );
      const stretchTo = stretches.map((stretch, index) =>
        gsap.quickTo(stretch, "scaleX", {
          duration: reduced ? 0 : 0.48 + index * 0.05,
          ease: "momentumSettle",
        })
      );

      const settleCards = () => {
        spreadTo.forEach((move) => move(0));
        stretchTo.forEach((stretch) => stretch(1));
      };
      const settleCall = gsap.delayedCall(0.08, settleCards).pause();

      let targetX = 0;
      let currentX = 0;
      let previousX = 0;
      let activeIndex = 0;
      let dragging = false;
      let dragStartX = 0;
      let dragStartTarget = 0;
      const lerp = reduced ? 1 : 0.14;

      function maxScroll() {
        return Math.max(0, list.scrollWidth - root.clientWidth);
      }

      function clampX(value) {
        return gsap.utils.clamp(-maxScroll(), 0, value);
      }

      function syncActive() {
        const viewportCenter = -currentX + root.clientWidth * 0.5;
        let nearest = 0;
        let nearestDistance = Infinity;
        slots.forEach((slot, index) => {
          const center = slot.offsetLeft + slot.offsetWidth * 0.5;
          const distance = Math.abs(center - viewportCenter);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = index;
          }
        });
        activeIndex = nearest;
      }

      function applyMomentum(delta) {
        const pull = reduced
          ? 0
          : gsap.utils.clamp(0, 72, Math.abs(delta) * 3.2);
        const movingForward = delta <= 0;
        const scale = 1 + (pull / 72) * 0.08;

        spreadTo.forEach((move, index) => {
          const distance = movingForward
            ? index * pull
            : -(slots.length - 1 - index) * pull;
          move(distance);
        });
        stretchTo.forEach((stretchCard) => stretchCard(scale));
        settleCall.restart(true);
      }

      const ticker = () => {
        currentX += (targetX - currentX) * lerp;
        if (Math.abs(targetX - currentX) < 0.05) currentX = targetX;

        const delta = currentX - previousX;
        previousX = currentX;

        gsap.set(list, { x: currentX });

        if (delta !== 0) {
          applyMomentum(delta);
          syncActive();
        }
      };

      gsap.ticker.add(ticker);

      function onPointerDown(event) {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        if (event.target.closest(".cards-crumb, .image-row__control")) return;
        dragging = true;
        dragStartX = event.clientX;
        dragStartTarget = targetX;
        root.setPointerCapture?.(event.pointerId);
      }

      function onPointerMove(event) {
        if (!dragging) return;
        targetX = clampX(dragStartTarget + (event.clientX - dragStartX));
      }

      function onPointerUp(event) {
        if (!dragging) return;
        dragging = false;
        root.releasePointerCapture?.(event.pointerId);
      }

      function scrollToCard(index) {
        activeIndex = gsap.utils.clamp(0, CARDS.length - 1, index);
        const slot = slots[activeIndex];
        const destination = clampX(
          -(
            slot.offsetLeft -
            (root.clientWidth - slot.offsetWidth) * 0.5
          )
        );
        const proxy = { x: targetX };

        gsap.to(proxy, {
          x: destination,
          duration: reduced ? 0 : 0.9,
          ease: "rowEase",
          overwrite: true,
          onUpdate: () => {
            targetX = proxy.x;
          },
        });
      }

      apiRef.current.prev = () => scrollToCard(activeIndex - 1);
      apiRef.current.next = () => scrollToCard(activeIndex + 1);

      const onResize = () => {
        targetX = clampX(targetX);
      };

      root.addEventListener("pointerdown", onPointerDown);
      root.addEventListener("pointermove", onPointerMove);
      root.addEventListener("pointerup", onPointerUp);
      root.addEventListener("pointercancel", onPointerUp);
      window.addEventListener("resize", onResize);

      return () => {
        magneticCleanups.forEach((fn) => fn());
        gsap.ticker.remove(ticker);
        settleCall.kill();
        root.removeEventListener("pointerdown", onPointerDown);
        root.removeEventListener("pointermove", onPointerMove);
        root.removeEventListener("pointerup", onPointerUp);
        root.removeEventListener("pointercancel", onPointerUp);
        window.removeEventListener("resize", onResize);
      };
    },
    { scope: rootRef }
  );

  return (
    <section
      className="image-row"
      id="cards"
      ref={rootRef}
      aria-label="Featured scenes"
    >
      <div className="image-row__viewport">
        <div className="image-row__list" ref={listRef}>
          {CARDS.map((card, index) => (
            <div
              className="image-row__slot"
              key={card.title}
              ref={(el) => {
                slotRefs.current[index] = el;
              }}
            >
              <div
                className="image-row__stretch"
                ref={(el) => {
                  stretchRefs.current[index] = el;
                }}
              >
                <article className="image-row__card">
                  <h3 className="image-row__title">{card.title}</h3>
                </article>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

export default HorizontalImageRow;
