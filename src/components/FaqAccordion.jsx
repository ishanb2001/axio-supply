import { useRef } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";
import "./FaqAccordion.css";

gsap.registerPlugin(useGSAP, CustomEase);

const OPEN_EASE = CustomEase.create("faqOpenTone", "0.8, 0, 0.18, 1");
const CLOSE_EASE = CustomEase.create("faqCloseTone", "0.7, 0, 0.22, 1");

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
      const items = gsap.utils.toArray(".faq-item", root);
      const triggers = gsap.utils.toArray(".faq-item__trigger", root);
      const panels = gsap.utils.toArray(".faq-item__panel", root);
      const answers = gsap.utils.toArray(".faq-item__answer", root);
      if (!items.length) return;

      let openIndex = null;

      const measure = (index) => {
        const panel = panels[index];
        const previous = panel.style.height;
        panel.style.height = "auto";
        const openHeight = panel.scrollHeight;
        panel.style.height = previous;
        return openHeight;
      };

      const setOpen = contextSafe((index) => {
        const nextOpen = openIndex === index ? null : index;

        items.forEach((item, itemIndex) => {
          const active = itemIndex === nextOpen;
          const wasOpen = itemIndex === openIndex;
          item.classList.toggle("is-active", active);
          triggers[itemIndex].setAttribute("aria-expanded", active ? "true" : "false");
          if (!active && !wasOpen) return;

          const panel = panels[itemIndex];
          const answer = answers[itemIndex];

          if (reduced) {
            gsap.set(panel, { height: active ? measure(itemIndex) : 0 });
            gsap.set(answer, { autoAlpha: active ? 1 : 0, y: 0 });
            return;
          }

          gsap.killTweensOf([panel, answer]);

          if (active) {
            const openHeight = measure(itemIndex);
            gsap.to(panel, {
              height: openHeight,
              duration: 0.58,
              ease: OPEN_EASE,
              overwrite: true,
            });
            gsap.fromTo(
              answer,
              { autoAlpha: 0, y: 14 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.48,
                delay: 0.04,
                ease: OPEN_EASE,
                overwrite: true,
              }
            );
            return;
          }

          gsap.to(answer, {
            autoAlpha: 0,
            y: 12,
            duration: 0.35,
            ease: CLOSE_EASE,
            overwrite: true,
          });
          gsap.to(panel, {
            height: 0,
            duration: 0.7,
            ease: CLOSE_EASE,
            overwrite: true,
          });
        });

        openIndex = nextOpen;
      });

      gsap.set(panels, { height: 0, overflow: "hidden" });
      gsap.set(answers, { autoAlpha: 0, y: 18 });

      const cleanups = triggers.map((trigger, index) => {
        const onClick = () => setOpen(index);
        trigger.addEventListener("click", onClick);
        return () => trigger.removeEventListener("click", onClick);
      });

      const onResize = () => {
        if (openIndex == null) return;
        gsap.set(panels[openIndex], { height: measure(openIndex) });
      };

      window.addEventListener("resize", onResize);

      return () => {
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
            {FAQ_ITEMS.map((item) => (
              <article className="faq-item" key={item.q}>
                <button className="faq-item__trigger" type="button" aria-expanded="false">
                  <span className="faq-item__question">{item.q}</span>
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
