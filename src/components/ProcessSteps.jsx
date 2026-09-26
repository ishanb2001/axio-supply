import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import "./ProcessSteps.css";

gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase);
CustomEase.create("appleOut", "M0,0 C0.22,1 0.36,1 1,1");
CustomEase.create("cardIn", "M0,0 C0.5,0 0.75,0.45 1,1");
CustomEase.create("coverEase", "M0,0 C0.33,0 0.2,1 1,1");

const CARDS = [
  {
    tone: 1,
    num: "01",
    title: "Consultation",
    quiet: "and assessment",
    points: [
      {
        label: "Initial meeting",
        body: "Understand goals, constraints, and what success looks like.",
      },
      {
        label: "Custom solutions",
        body: "Shape a path that fits the way your team already works.",
      },
    ],
  },
  {
    tone: 2,
    num: "02",
    title: "Solution design",
    quiet: "and proposal",
    points: [
      {
        label: "Strategic planning",
        body: "Map milestones, systems, and the quiet details in between.",
      },
      {
        label: "Proposal",
        body: "Clear scope, timelines, and outcomes — nothing extra.",
      },
    ],
  },
  {
    tone: 3,
    num: "03",
    title: "Implementation",
    quiet: "and integration",
    points: [
      {
        label: "Integration",
        body: "Connect systems carefully so day-to-day work stays uninterrupted.",
      },
      {
        label: "Training",
        body: "Bring the team up to speed with focused, practical guidance.",
      },
    ],
  },
  {
    tone: 4,
    num: "04",
    title: "Monitoring",
    quiet: "and optimization",
    points: [
      {
        label: "Monitoring",
        body: "Keep performance visible so issues are handled early.",
      },
      {
        label: "Optimization",
        body: "Refine continuously for clarity, speed, and reliability.",
      },
    ],
  },
];

export default function ProcessSteps() {
  const rootRef = useRef(null);
  const titleRef = useRef(null);
  const cardRefs = useRef([]);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const process = rootRef.current;
      const title = titleRef.current;
      const cards = cardRefs.current.filter(Boolean);
      if (!process || !title || !cards.length) return;

      gsap.set(title, { autoAlpha: 0, y: 28, filter: "blur(10px)" });
      gsap.to(title, {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: reduced ? 0.01 : 1.2,
        ease: "appleOut",
        scrollTrigger: {
          trigger: title,
          start: "top 88%",
          toggleActions: "play none none reverse",
        },
      });

      cards.forEach((card, index) => {
        gsap.set(card, {
          zIndex: index + 1,
          force3D: true,
          transformOrigin: "50% 0%",
          yPercent: index === 0 ? 0 : 112,
          y: 0,
          scale: 1,
          autoAlpha: 1,
        });
      });

      const steps = Math.max(1, cards.length - 1);

      if (reduced) {
        ScrollTrigger.create({
          trigger: process,
          start: "top top",
          end: () => `+=${steps * window.innerHeight * 0.5}`,
          pin: true,
          scrub: true,
          anticipatePin: 1,
          onUpdate(self) {
            const index = Math.round(self.progress * steps);
            cards.forEach((card, i) => {
              const passed = i < index;
              const active = i === index;
              gsap.set(card, {
                yPercent: active || passed ? 0 : 112,
                y: passed ? -24 : 0,
                scale: passed ? 0.9 : 1,
                autoAlpha: 1,
              });
            });
          },
        });
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "cardIn" },
        scrollTrigger: {
          trigger: process,
          start: "top top",
          end: () => `+=${steps * window.innerHeight * 0.95}`,
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          snap: {
            snapTo: "labels",
            duration: { min: 0.22, max: 0.55 },
            delay: 0.02,
            ease: "power2.inOut",
          },
        },
      });

      tl.addLabel("step-0");

      for (let i = 1; i < cards.length; i += 1) {
        const at = `step-${i}`;
        tl.addLabel(at);
        tl.to(cards[i], { yPercent: 0, duration: 1, ease: "coverEase" }, at);
        tl.to(
          cards[i - 1],
          { scale: 0.9, y: -24, duration: 1, ease: "cardIn" },
          at
        );
      }

      tl.addLabel("end");
    },
    { scope: rootRef }
  );

  return (
    <section className="process-steps" id="process" ref={rootRef}>
      <h2 className="process-steps__title" ref={titleRef}>
        A simpler way to collaborate
      </h2>

      <div className="process-steps__stage">
        {CARDS.map((card, index) => (
          <article
            key={card.num}
            className={`process-card process-card--tone-${card.tone}`}
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
          >
            <div className="process-card__head">
              <h3 className="process-card__title">
                {card.title}
                <span className="quiet"> {card.quiet}</span>
              </h3>
              <div className="process-card__num">{card.num}</div>
            </div>
            <div className="process-card__grid">
              {card.points.map((point) => (
                <div className="process-card__point" key={point.label}>
                  <h4 className="process-card__label">{point.label}</h4>
                  <p className="process-card__body">{point.body}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
