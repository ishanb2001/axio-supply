import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import "./FaqAccordion.css";

gsap.registerPlugin(useGSAP);

const HOVER_BG = "#e8e8ea";
const PRESS_BG = "#d4d4d8";
const HOVER_EASE_LEAD = "cubic-bezier(0.22, 1, 0.36, 1)";
const HOVER_EASE_SNAP = "cubic-bezier(0.34, 1.25, 0.64, 1)";
const EASE_EXPAND = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_ELASTIC_SNAP = "cubic-bezier(0.34, 1.25, 0.64, 1)";
const INACTIVE = "#8a8a8a";
const HOVER = "#444444";
const ACTIVE = "#111111";

const FAQ_ITEMS = [
  {
    q: "What is this library?",
    a: "A collection of live UI pieces — motion, navigation, cards, and glass — that you can preview in the browser and pull into a product.",
  },
  {
    q: "Are the components free?",
    a: "Most pieces are free to preview and use. A few marked Pro are paid. The badge on each card tells you which is which.",
  },
  {
    q: "Can I preview something before I use it?",
    a: "Yes. Open any card to see it running, then try it on desktop or a smaller screen before you take the code.",
  },
  {
    q: "How do I use a component?",
    a: "Find it in the library, open the live preview, and copy it into your page. Search is there when you already know the name.",
  },
  {
    q: "Will these match my project?",
    a: "They’re built as self-contained UI, so you can drop one into an existing page and restyle the type and color to fit.",
  },
  {
    q: "What kinds of UI are in here?",
    a: "Navigation, cards, galleries, scroll motion, hover states, and glass surfaces. The library is the full set.",
  },
];

export default function FaqAccordion() {
  const rootRef = useRef(null);

  useGSAP(
    (_context, contextSafe) => {
      const root = rootRef.current;
      if (!root) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const list = root.querySelector(".faq-list");
      const items = gsap.utils.toArray(".faq-item", root);
      const triggers = gsap.utils.toArray(".faq-item__trigger", root);
      const panels = gsap.utils.toArray(".faq-item__panel", root);
      const answers = gsap.utils.toArray(".faq-item__answer", root);
      const fills = gsap.utils.toArray(".faq-item__fill", root);
      const iconVerts = gsap.utils.toArray(".faq-item__icon-vert", root);
      const hoverEl = root.querySelector(".faq-hover");
      if (!list || !items.length || !hoverEl) return;

      gsap.set(iconVerts, { rotation: 90, transformOrigin: "50% 50%" });

      let openIndex = null;
      let hoveredItem = null;
      let hideHoverTimer = null;
      const hoverPos = { top: 0, bottom: 0 };

      const boxOf = (trigger) => {
        const origin = list.getBoundingClientRect().top;
        const rect = trigger.getBoundingClientRect();
        return { top: rect.top - origin, bottom: rect.bottom - origin };
      };

      const renderHover = () => {
        gsap.set(hoverEl, {
          top: hoverPos.top,
          height: Math.max(0, hoverPos.bottom - hoverPos.top),
        });
      };

      const colorTargets = (item) =>
        [
          item.querySelector(".faq-item__question"),
          item.querySelector(".faq-item__number"),
          item.querySelector(".faq-item__icon"),
        ].filter(Boolean);

      const paintItem = (item, color) => {
        colorTargets(item).forEach((el) => {
          gsap.to(el, {
            color,
            duration: reduced ? 0 : 0.24,
            ease: "power2.out",
            overwrite: "auto",
          });
        });
      };

      const hideHover = (duration = 0.22, delay = 0) => {
        gsap.to(hoverEl, {
          autoAlpha: 0,
          backgroundColor: HOVER_BG,
          duration: reduced ? 0 : duration,
          delay: reduced ? 0 : delay,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      const moveHoverTo = (trigger, { pressed = false } = {}) => {
        if (hideHoverTimer) {
          clearTimeout(hideHoverTimer);
          hideHoverTimer = null;
        }

        const box = boxOf(trigger);
        const visible = Number(gsap.getProperty(hoverEl, "opacity")) > 0.05;

        gsap.to(hoverEl, {
          autoAlpha: 1,
          backgroundColor: pressed ? PRESS_BG : HOVER_BG,
          duration: reduced ? 0 : 0.2,
          ease: "power2.out",
          overwrite: "auto",
        });

        if (reduced || !visible) {
          hoverPos.top = box.top;
          hoverPos.bottom = box.bottom;
          renderHover();
          return;
        }

        const isMovingDown = box.top > hoverPos.top;
        gsap.killTweensOf(hoverPos);

        if (isMovingDown) {
          gsap.to(hoverPos, {
            bottom: box.bottom,
            duration: 0.26,
            ease: HOVER_EASE_LEAD,
            onUpdate: renderHover,
            overwrite: "auto",
          });
          gsap.to(hoverPos, {
            top: box.top,
            duration: 0.38,
            ease: HOVER_EASE_SNAP,
            onUpdate: renderHover,
            overwrite: "auto",
          });
          return;
        }

        gsap.to(hoverPos, {
          top: box.top,
          duration: 0.26,
          ease: HOVER_EASE_LEAD,
          onUpdate: renderHover,
          overwrite: "auto",
        });
        gsap.to(hoverPos, {
          bottom: box.bottom,
          duration: 0.38,
          ease: HOVER_EASE_SNAP,
          onUpdate: renderHover,
          overwrite: "auto",
        });
      };

      const measure = (index) => {
        const panel = panels[index];
        const previous = panel.style.height;
        panel.style.height = "auto";
        const full = items[index].offsetHeight;
        const openHeight = panel.scrollHeight;
        const triggerH = triggers[index].offsetHeight;
        panel.style.height = previous;
        return { full, openHeight, triggerH };
      };

      const animateIcon = (item, open) => {
        const vert = item.querySelector(".faq-item__icon-vert");
        if (!vert) return;
        gsap.to(vert, {
          rotation: open ? 0 : 90,
          duration: reduced ? 0 : 0.62,
          ease: "power3.inOut",
          overwrite: "auto",
        });
      };

      const setOpen = (index) => {
        const nextOpen = openIndex === index ? null : index;
        const opening = nextOpen == null ? null : measure(nextOpen);

        items.forEach((item, itemIndex) => {
          const active = itemIndex === nextOpen;
          const wasOpen = itemIndex === openIndex;
          item.classList.toggle("is-active", active);
          triggers[itemIndex].setAttribute("aria-expanded", active ? "true" : "false");
          if (hoveredItem === item && active) hoveredItem = null;

          if (!active && !wasOpen) return;

          const fill = fills[itemIndex];
          const answer = answers[itemIndex];
          const panel = panels[itemIndex];
          paintItem(item, active ? ACTIVE : INACTIVE);
          animateIcon(item, active);

          if (active && opening) {
            if (reduced) {
              gsap.set(fill, { height: opening.full, autoAlpha: 1 });
              gsap.set(panel, { height: opening.openHeight });
              gsap.set(answer, { autoAlpha: 1, y: 0 });
              return;
            }
            gsap.set(fill, { height: opening.triggerH, autoAlpha: 1 });
            gsap.to(fill, {
              height: opening.full,
              duration: 0.46,
              ease: EASE_EXPAND,
              overwrite: "auto",
            });
            gsap.to(panel, {
              height: opening.openHeight,
              duration: 0.46,
              ease: EASE_EXPAND,
              overwrite: "auto",
            });
            gsap.fromTo(
              answer,
              { autoAlpha: 0, y: 8 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.26,
                delay: 0.12,
                ease: "power2.out",
                overwrite: "auto",
              }
            );
            return;
          }

          const triggerH = triggers[itemIndex].offsetHeight;
          if (reduced) {
            gsap.set(fill, { height: triggerH, autoAlpha: 0 });
            gsap.set(panel, { height: 0 });
            gsap.set(answer, { autoAlpha: 0, y: 8 });
            return;
          }
          gsap.to(answer, {
            autoAlpha: 0,
            y: 6,
            duration: 0.16,
            ease: "power2.in",
            overwrite: "auto",
          });
          gsap.to(panel, {
            height: 0,
            duration: 0.36,
            ease: EASE_EXPAND,
            overwrite: "auto",
          });
          gsap.to(fill, {
            height: triggerH,
            autoAlpha: 0,
            duration: 0.36,
            ease: EASE_EXPAND,
            overwrite: "auto",
          });
        });

        openIndex = nextOpen;
      };

      gsap.set(panels, { height: 0 });
      gsap.set(answers, { autoAlpha: 0, y: 8 });
      gsap.set(fills, { height: 0, autoAlpha: 0 });
      gsap.set(iconVerts, { rotation: 90, transformOrigin: "50% 50%" });
      gsap.set(hoverEl, { autoAlpha: 0, backgroundColor: HOVER_BG });
      items.forEach((item) => {
        colorTargets(item).forEach((el) => gsap.set(el, { color: INACTIVE }));
      });

      const cleanups = triggers.map((trigger, index) => {
        const item = items[index];
        const onPress = () => {
          if (!item.classList.contains("is-active")) moveHoverTo(trigger, { pressed: true });
        };
        const onHoverIn = contextSafe(() => {
          if (item.classList.contains("is-active")) {
            hideHover();
            return;
          }
          hoveredItem = item;
          moveHoverTo(trigger);
          paintItem(item, HOVER);
        });
        const onHoverOut = contextSafe(() => {
          if (hoveredItem === item) hoveredItem = null;
          if (!item.classList.contains("is-active")) paintItem(item, INACTIVE);
          hideHoverTimer = window.setTimeout(() => hideHover(), 40);
        });
        const onClick = () => {
          if (!item.classList.contains("is-active")) hideHover(0);
          setOpen(index);
        };

        trigger.addEventListener("click", onClick);
        trigger.addEventListener("pointerdown", onPress);
        trigger.addEventListener("pointerenter", onHoverIn);
        trigger.addEventListener("pointerleave", onHoverOut);

        return () => {
          trigger.removeEventListener("click", onClick);
          trigger.removeEventListener("pointerdown", onPress);
          trigger.removeEventListener("pointerenter", onHoverIn);
          trigger.removeEventListener("pointerleave", onHoverOut);
        };
      });

      const onResize = () => {
        if (openIndex == null) return;
        const { full, openHeight } = measure(openIndex);
        gsap.set(panels[openIndex], { height: openHeight });
        gsap.set(fills[openIndex], { height: full, autoAlpha: 1 });
      };

      window.addEventListener("resize", onResize);

      return () => {
        if (hideHoverTimer) clearTimeout(hideHoverTimer);
        gsap.killTweensOf(hoverPos);
        gsap.killTweensOf(hoverEl);
        gsap.killTweensOf(fills);
        gsap.killTweensOf(panels);
        gsap.killTweensOf(answers);
        gsap.killTweensOf(iconVerts);
        window.removeEventListener("resize", onResize);
        cleanups.forEach((fn) => fn());
      };
    },
    { scope: rootRef }
  );

  return (
    <section className="faq-section" id="faq" ref={rootRef}>
      <div className="faq-container">
        <div className="faq-header" data-scroll-reveal>
          <h2 className="faq-title">
            <span className="scroll-reveal">
              <span className="scroll-reveal__inner">Questions, answered</span>
            </span>
          </h2>
        </div>

        <div className="faq-menu">
          <div className="faq-list">
            <div className="faq-hover" aria-hidden="true" />
            {FAQ_ITEMS.map((item) => (
              <article className="faq-item" key={item.q}>
                <div className="faq-item__fill" aria-hidden="true" />
                <button className="faq-item__trigger" type="button" aria-expanded="false">
                  <span className="faq-item__content">
                    <span className="faq-item__question">{item.q}</span>
                  </span>
                  <span className="faq-item__icon" aria-hidden="true">
                    <span className="faq-item__icon-bar" />
                    <span className="faq-item__icon-bar faq-item__icon-vert" />
                  </span>
                </button>
                <div className="faq-item__panel">
                  <p className="faq-item__answer">{item.a}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
