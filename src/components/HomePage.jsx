import { useRef, useState } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import DynamicNav from "./DynamicNav";
import FaqAccordion from "./FaqAccordion";
import FeatureCards, { PIECES } from "./FeatureCards";
import FloatTiles from "./FloatTiles";
import ExpandCards from "./ExpandCards";
import BlackSections from "./BlackSections";
import "./BlackSections.css";
import "./HomePage.css";

gsap.registerPlugin(useGSAP, CustomEase, ScrollTrigger);

const ROTATING_WORDS = ["platform", "environment", "ecosystem"];
const TYPE_WORDS = ["Preview", "live,", "build", "with", "it."];
const TYPE_PILLS = [
  { id: "glass", label: "Glass\nlayers", tone: "green", rotate: -8, top: "0%", left: "0%" },
  { id: "scroll", label: "Scroll\nmotion", tone: "lilac", rotate: -12, top: "0%", right: "0%" },
  { id: "cards", label: "Card stack", tone: "blue", rotate: 7, bottom: "0%", left: "0%" },
  { id: "type", label: "Type set", tone: "clay", rotate: 9, bottom: "0%", right: "0%" },
];
const SLIDE_EASE = CustomEase.create("homeEaseInOut", "0.4,0,0.2,1");
const REVEAL_EASE = "power4.out";
const TICKER_SCROLL_EASE = CustomEase.create("tickerScrollEase", "0.76,0,0.24,1");
const CINEMA_EASE = CustomEase.create("cinemaEase", "0.65,0,0.35,1");

function PillMark({ id }) {
  if (id === "glass") {
    return (
      <svg viewBox="0 0 36 28" aria-hidden="true">
        <path d="M6 20.5 18 26l12-5.5V8.2L18 3 6 8.2v12.3Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M6 8.2 18 14l12-5.8M18 14v12" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (id === "scroll") {
    return (
      <svg viewBox="0 0 32 28" aria-hidden="true">
        <circle cx="16" cy="14" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M16 8.5v6l3.4 2.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "cards") {
    return (
      <svg viewBox="0 0 34 28" aria-hidden="true">
        <rect x="7" y="6" width="20" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10 22h16M12 25h12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 28" aria-hidden="true">
      <path d="M8 20.5 16 7l8 13.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M11.2 16.2h9.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function Rules() {
  return (
    <div className="home-rules" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

function TypeSet() {
  const rootRef = useRef(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const chars = gsap.utils.toArray(".home-type__char", root);
      const masks = gsap.utils.toArray(".home-type__mask", root);
      const pills = gsap.utils.toArray(".home-type__pill", root);
      const floats = gsap.utils.toArray(".home-type__pill-float", root);
      if (!chars.length) return;
      const line = root.querySelector(".home-type__line");
      const motion = gsap.matchMedia();

      motion.add("(max-width: 1024px)", () => {
        gsap.set(chars, { yPercent: 0, y: 0 });
        gsap.set(masks, { y: 0 });
        if (line) gsap.set(line, { clearProps: "filter" });
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!pills.length || reduced) {
          gsap.set(pills, { autoAlpha: 1, scale: 1, y: 0 });
          return;
        }
        pills.forEach((pill, index) => {
          gsap.fromTo(
            pill,
            { autoAlpha: 0, scale: 0.55, y: 28 },
            {
              autoAlpha: 1,
              scale: 1,
              y: 0,
              duration: 0.7,
              delay: index * 0.04,
              ease: "back.out(1.8)",
              scrollTrigger: {
                trigger: pill,
                start: "top 90%",
                toggleActions: "play none none reverse",
              },
            }
          );
        });
      });

      motion.add("(min-width: 1025px)", () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(chars, { yPercent: 0 });
        gsap.set(pills, { y: 0, autoAlpha: 1 });
        return;
      }

      if (pills.length) {
        const cover = root.parentElement?.querySelector(".home-library-cover");
        const rise = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root,
            start: "top 80%",
            endTrigger: cover || root,
            end: cover ? "top 25%" : "bottom top",
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
        pills.forEach((pill, index) => {
          const rotation = Number.parseFloat(getComputedStyle(pill).getPropertyValue("--pill-rotate")) || 0;
          const drift = 28 + index * 8;
          rise.fromTo(
            pill,
            { y: drift, rotation },
            { y: -drift, rotation, duration: 1 },
            0
          );
          rise.fromTo(pill, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.16 }, 0);
        });
      }

      const placeLetters = () => {
        if (!line) return;
        const rect = line.getBoundingClientRect();
        const view = window.innerHeight || 1;
        const progress = gsap.utils.clamp(0, 1, (view * 0.95 - rect.top) / (view * 0.5));
        const count = chars.length;
        chars.forEach((char, index) => {
          const start = (index / count) * 0.4;
          const local = gsap.utils.clamp(0, 1, (progress - start) / 0.6);
          gsap.set(char, { yPercent: (1 - local) * 110 });
        });
        const cover = root.parentElement?.querySelector(".home-library-cover");
        const pillsLayer = root.querySelector(".home-type__pills");
        if (cover) {
          const coverProgress = gsap.utils.clamp(0, 1, (view - cover.getBoundingClientRect().top) / view);
          const blur = `blur(${(coverProgress * 18).toFixed(2)}px)`;
          gsap.set(line, { filter: blur });
          if (pillsLayer) gsap.set(pillsLayer, { filter: blur });
        }
      };
      placeLetters();

      let bend = 0;
      let target = 0;
      const drag = ScrollTrigger.create({
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const velocity = self.getVelocity();
          target = velocity > 40 ? gsap.utils.clamp(0, 36, velocity / 70) : 0;
        },
      });
      const tick = () => {
        placeLetters();
        bend += (target - bend) * 0.14;
        target *= 0.86;
        const last = Math.max(masks.length - 1, 1);
        masks.forEach((mask, index) => {
          const across = (index / last) * 2 - 1;
          gsap.set(mask, { y: (1 - across * across) * bend });
        });
        floats.forEach((float, index) => {
          const direction = index % 2 === 0 ? -1 : 1;
          gsap.set(float, { y: direction * bend * 1.15 });
        });
      };
      gsap.ticker.add(tick);
      window.addEventListener("scroll", placeLetters, { passive: true });
      window.addEventListener("pageshow", placeLetters);
      window.addEventListener("load", placeLetters);
      const watches = [0, 50, 150, 400, 800].map((ms) => window.setTimeout(placeLetters, ms));

      return () => {
        window.removeEventListener("scroll", placeLetters);
        window.removeEventListener("pageshow", placeLetters);
        window.removeEventListener("load", placeLetters);
        watches.forEach((id) => window.clearTimeout(id));
        drag.kill();
        gsap.ticker.remove(tick);
      };
      });

      return () => motion.revert();
    },
    { scope: rootRef }
  );

  return (
    <section className="home-type" ref={rootRef} aria-label="Preview live, build with it.">
      <Rules />
      <div className="home-type__stage">
      <div className="home-type__pills" aria-hidden="true">
        {TYPE_PILLS.map((pill) => (
          <span
            className={`home-type__pill home-type__pill--${pill.tone}`}
            key={pill.id}
            style={{
              top: pill.top,
              left: pill.left,
              right: pill.right,
              bottom: pill.bottom,
              "--pill-rotate": `${pill.rotate}deg`,
            }}
          >
            <span className="home-type__pill-float">
              <span className="home-type__pill-copy">
                {pill.label.split("\n").map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </span>
              <span className="home-type__pill-mark">
                <PillMark id={pill.id} />
              </span>
            </span>
          </span>
        ))}
      </div>
      <p className="home-type__line">
        {TYPE_WORDS.map((word) => (
          <span className="home-type__word" key={word}>
            {[...word].map((letter, index) => (
              <span className="home-type__mask" key={`${word}-${index}`}>
                <span className="home-type__char">{letter}</span>
              </span>
            ))}
          </span>
        ))}
      </p>
      </div>
    </section>
  );
}

function RotatingWord({ words = ROTATING_WORDS }) {
  const rootRef = useRef(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const sizer = root.querySelector(".rotating-text__sizer");
      const wordEls = gsap.utils.toArray(".rotating-text__word", root);
      if (!sizer || wordEls.length < 1) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const hold = 3.6;
      const inDuration = 0.75;
      const outDuration = 0.6;
      let activeIndex = 0;
      let loop;
      let tl;

      const measure = (text) => {
        const prev = sizer.textContent;
        sizer.textContent = text;
        const width = Math.ceil(sizer.scrollWidth);
        sizer.textContent = prev;
        return width;
      };

      const fitWidth = (text, duration = 0) => {
        const width = measure(text);
        if (duration) {
          return gsap.to(root, {
            width,
            duration,
            ease: SLIDE_EASE,
            overwrite: "auto",
          });
        }
        gsap.set(root, { width });
        return null;
      };

      sizer.textContent = words[0];
      gsap.set(wordEls, { yPercent: 110, autoAlpha: 0 });
      gsap.set(wordEls[0], { yPercent: 0, autoAlpha: 1 });
      fitWidth(words[0]);

      if (reduced || wordEls.length < 2) return;

      const showNext = () => {
        const nextIndex = (activeIndex + 1) % wordEls.length;
        const prev = wordEls[activeIndex];
        const next = wordEls[nextIndex];

        tl = gsap.timeline({
          onComplete: () => {
            activeIndex = nextIndex;
            sizer.textContent = words[activeIndex];
            fitWidth(words[activeIndex]);
            loop = gsap.delayedCall(hold, showNext);
          },
        });

        tl.to(
          prev,
          {
            yPercent: -110,
            autoAlpha: 0,
            duration: outDuration,
            ease: SLIDE_EASE,
            overwrite: "auto",
          },
          0
        );

        tl.fromTo(
          next,
          { yPercent: 110, autoAlpha: 0 },
          {
            yPercent: 0,
            autoAlpha: 1,
            duration: inDuration,
            ease: SLIDE_EASE,
            overwrite: "auto",
          },
          0
        );

        tl.to(
          root,
          {
            width: measure(words[nextIndex]),
            duration: inDuration,
            ease: SLIDE_EASE,
            overwrite: "auto",
          },
          0
        );
      };

      loop = gsap.delayedCall(hold, showNext);

      const onResize = () => fitWidth(words[activeIndex]);
      window.addEventListener("resize", onResize);

      return () => {
        loop?.kill();
        tl?.kill();
        window.removeEventListener("resize", onResize);
      };
    },
    { scope: rootRef, dependencies: [words] }
  );

  return (
    <span className="rotating-text" ref={rootRef}>
      <span className="rotating-text__sizer" aria-hidden="true">
        {words[0]}
      </span>
      {words.map((word) => (
        <span key={word} className="rotating-text__word">
          {word}
        </span>
      ))}
    </span>
  );
}

const FOOTER_WORD = "axio";
const COLLECTION_LABEL = "Explore collection";
const CALLOUT_MOVE_EASE = CustomEase.create("calloutSlide", "0.65, 0, 0.35, 1");
const CALLOUT_HOLD = 2.15;
const CALLOUT_SLIDE = 1.15;
const CALLOUT_SCALES = [1, 0.86, 0.72, 0.58];
const CALLOUT_PEEKS = [0, 0.36, 0.26, 0.2];
const CALLOUT_VISIBLE = CALLOUT_SCALES.length;

function CalloutCards() {
  const rootRef = useRef(null);
  const pieces = [...PIECES.slice(3), ...PIECES.slice(0, 3)];

  useGSAP((_context, contextSafe) => {
    const root = rootRef.current;
    if (!root) return;

    const cards = gsap.utils.toArray(".home-callout__card", root);
    if (!cards.length) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const order = cards.slice();
    let animating = false;

    const slotsFor = () => {
      const cardHeight = cards[0].offsetHeight || 228;
      const deck = root.offsetHeight || 420;
      const frontY = Math.round(deck - cardHeight);
      const peeks = CALLOUT_PEEKS.map((share) => Math.round(cardHeight * share));
      return cards.map((_, index) => {
        const depth = Math.min(index, CALLOUT_VISIBLE - 1);
        const lift = peeks.slice(0, depth + 1).reduce((sum, peek) => sum + peek, 0);
        return {
          y: frontY - lift,
          scale: CALLOUT_SCALES[depth],
          z: cards.length - index,
        };
      });
    };

    const place = () => {
      const slots = slotsFor();
      order.forEach((card, index) => {
        const slot = slots[index];
        gsap.set(card, {
          y: slot.y,
          scale: slot.scale,
          rotation: 0,
          xPercent: -50,
          transformOrigin: "50% 70%",
          zIndex: slot.z,
          autoAlpha: 1,
        });
      });
      return slots;
    };

    place();
    if (reduced) return;

    const play = contextSafe(() => {
      const slots = slotsFor();
      const front = order[0];
      const cardHeight = cards[0].offsetHeight || 228;
      const exitY = slots[0].y + Math.round(cardHeight * 1.45);
      animating = true;
      gsap.set(front, { zIndex: cards.length + 4 });

      const tl = gsap.timeline({
        onComplete: () => {
          order.push(order.shift());
          place();
          animating = false;
          gsap.delayedCall(CALLOUT_HOLD, play);
        },
      });

      tl.to(front, {
        y: exitY,
        duration: CALLOUT_SLIDE,
        ease: CALLOUT_MOVE_EASE,
      }, 0);

      order.forEach((card, index) => {
        if (index === 0) return;
        const slot = slots[index - 1];
        tl.set(card, { zIndex: slot.z }, 0);
        tl.to(card, {
          y: slot.y,
          scale: slot.scale,
          duration: CALLOUT_SLIDE,
          ease: CALLOUT_MOVE_EASE,
        }, 0);
      });
    });

    gsap.delayedCall(CALLOUT_HOLD, play);

    const onResize = () => {
      if (animating) return;
      place();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, { scope: rootRef });

  return (
    <div className="home-callout__stack" ref={rootRef} aria-hidden="true">
      {pieces.map((piece) => (
        <article
          className="home-callout__card"
          key={piece.id}
          style={{ backgroundImage: piece.image ? `url(${piece.image})` : piece.gradient }}
        />
      ))}
    </div>
  );
}
const COLLECTION_EASE = CustomEase.create("collectionLetter", "0.32, 0.72, 0, 1");

function CollectionButton({ onClick }) {
  const buttonRef = useRef(null);

  useGSAP(() => {
    const button = buttonRef.current;
    if (!button) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const arrows = gsap.utils.toArray(".home-callout__arrow", button);
    const chars = gsap.utils.toArray(".home-callout__char", button);
    const glyphRows = chars.map((char) => gsap.utils.toArray(".home-callout__glyph", char));
    const restingGlyphs = glyphRows.map((row) => row[0]).filter(Boolean);
    const incomingGlyphs = glyphRows.map((row) => row[1]).filter(Boolean);
    if (arrows.length !== 2 || !restingGlyphs.length || restingGlyphs.length !== incomingGlyphs.length) return;

    gsap.set(arrows[1], { yPercent: 110 });
    gsap.set(incomingGlyphs, { yPercent: 110 });
    const letterStagger = { amount: 0.18, from: "start" };
    const hoverTl = gsap.timeline({ paused: true });
    hoverTl
      .to(button, { scale: 0.96, duration: 0.45, ease: TICKER_SCROLL_EASE }, 0)
      .to(arrows[0], { yPercent: -110, duration: 0.7, ease: TICKER_SCROLL_EASE }, 0)
      .fromTo(
        arrows[1],
        { yPercent: 110 },
        { yPercent: 0, duration: 0.7, ease: TICKER_SCROLL_EASE, immediateRender: false },
        0
      )
      .to(restingGlyphs, {
        yPercent: -110,
        duration: 0.8,
        ease: COLLECTION_EASE,
        stagger: letterStagger,
      }, 0)
      .fromTo(incomingGlyphs, { yPercent: 110 }, {
        yPercent: 0,
        duration: 0.8,
        ease: COLLECTION_EASE,
        stagger: letterStagger,
        immediateRender: false,
      }, 0);

    const onEnter = () => {
      if (reduced) {
        gsap.set(button, { scale: 0.96 });
        return;
      }
      hoverTl.play();
    };
    const onLeave = () => {
      if (reduced) {
        gsap.set(button, { scale: 1 });
        return;
      }
      hoverTl.reverse();
    };
    const onPress = () => {
      gsap.to(button, { y: 8, duration: 0.12, ease: "power2.out", overwrite: "auto" });
    };
    const onRelease = () => {
      gsap.to(button, { y: 0, duration: 0.45, delay: 0.07, ease: TICKER_SCROLL_EASE, overwrite: "auto" });
    };

    button.addEventListener("pointerenter", onEnter);
    button.addEventListener("pointerleave", onLeave);
    button.addEventListener("pointerdown", onPress);
    button.addEventListener("pointerup", onRelease);
    button.addEventListener("pointerleave", onRelease);
    button.addEventListener("pointercancel", onRelease);

    return () => {
      hoverTl.kill();
      button.removeEventListener("pointerenter", onEnter);
      button.removeEventListener("pointerleave", onLeave);
      button.removeEventListener("pointerdown", onPress);
      button.removeEventListener("pointerup", onRelease);
      button.removeEventListener("pointerleave", onRelease);
      button.removeEventListener("pointercancel", onRelease);
    };
  }, { scope: buttonRef });

  return (
    <button
      className="home-callout__collection"
      type="button"
      aria-label={COLLECTION_LABEL}
      onClick={onClick}
      ref={buttonRef}
    >
      <span className="home-callout__label" aria-hidden="true">
        {COLLECTION_LABEL.split("").map((char, index) => (
          <span className="home-callout__char" key={`${char}-${index}`}>
            <span className="home-callout__glyph">{char === " " ? "\u00a0" : char}</span>
            <span className="home-callout__glyph">{char === " " ? "\u00a0" : char}</span>
          </span>
        ))}
      </span>
      <span className="home-callout__arrow-clip" aria-hidden="true">
        <span className="home-callout__arrow">
          <svg viewBox="0 0 24 24">
            <path d="M4 12h16M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="home-callout__arrow">
          <svg viewBox="0 0 24 24">
            <path d="M4 12h16M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
    </button>
  );
}

export default function HomePage({ onNavigate, playIntro = false, locomotiveRef = null }) {
  const homeRef = useRef(null);
  const footerRef = useRef(null);
  const marqueeRef = useRef(null);
  const [showIntro] = useState(playIntro);
  const [footerEmail, setFooterEmail] = useState("");

  useGSAP(
    () => {
      const root = footerRef.current;
      if (!root) return;

      const glyphs = gsap.utils.toArray(".home-footer__glyph", root);
      const word = root.querySelector(".home-footer__word");
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!glyphs.length || !word) return;

      const fitWord = () => {
        word.style.fontSize = "100px";
        const available = word.clientWidth;
        const chars = gsap.utils.toArray(".home-footer__char", word);
        const needed = chars.reduce((sum, char) => sum + char.getBoundingClientRect().width, 0);
        if (!available || !needed) return;
        word.style.fontSize = `${(available / needed) * 100}px`;
      };

      let alive = true;
      fitWord();
      gsap.set(glyphs, { y: 0, yPercent: reduced ? 0 : 120, overwrite: "auto" });

      const onResize = () => {
        fitWord();
      };
      window.addEventListener("resize", onResize);

      if (!reduced) {
        gsap.to(glyphs, {
          yPercent: 0,
          duration: 1.05,
          ease: "power4.out",
          stagger: 0.09,
          scrollTrigger: {
            trigger: word,
            start: "top 92%",
            once: true,
          },
        });
      }

      document.fonts?.ready.then(() => {
        if (!alive) return;
        fitWord();
      });

      return () => {
        alive = false;
        window.removeEventListener("resize", onResize);
      };
    },
    { scope: footerRef }
  );

  useGSAP(
    () => {
      const root = marqueeRef.current;
      if (!root) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const track = root.querySelector(".home-marquee__track");
      const group = root.querySelector(".home-marquee__group");
      if (!track || !group) return;
      const play = () => {
        const distance = group.offsetWidth;
        if (!distance) return;
        gsap.killTweensOf(track);
        gsap.set(track, { x: 0 });
        gsap.to(track, {
          x: -distance,
          duration: Math.max(16, distance / 110),
          ease: "none",
          repeat: -1,
        });
      };
      play();
      window.addEventListener("resize", play);
      return () => {
        window.removeEventListener("resize", play);
      };
    },
    { scope: marqueeRef }
  );

  useGSAP(
    (context, contextSafe) => {
      const button = homeRef.current?.querySelector(".home-banner__button");
      const wipe = button?.querySelector(".home-banner__button-wipe");
      if (!button || !wipe) return;

      gsap.set(wipe, { scaleX: 0, transformOrigin: "0% 50%" });

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const tweenTo = (scaleX) => {
        gsap.to(wipe, {
          scaleX,
          duration: reduced ? 0 : 0.7,
          ease: "power3.inOut",
          overwrite: "auto",
        });
      };
      const onEnter = contextSafe(() => tweenTo(1));
      const onLeave = contextSafe(() => tweenTo(0));

      button.addEventListener("pointerenter", onEnter);
      button.addEventListener("pointerleave", onLeave);

      return () => {
        button.removeEventListener("pointerenter", onEnter);
        button.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: homeRef }
  );

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const nav = homeRef.current?.querySelector(".site-nav");
      const label = gsap.utils.toArray('[data-reveal="eyebrow"] .reveal-inner');
      const headingLines = gsap.utils.toArray('[data-reveal="heading"] .reveal-inner');
      const supportLines = gsap.utils.toArray('[data-reveal="description"] .reveal-inner');
      const ctaButton = gsap.utils.toArray('[data-reveal="cta"] .reveal-inner');

      const intro = homeRef.current?.querySelector(".home-intro");
      const introPanel = intro?.querySelector(".home-intro__panel");
      const introLetters = gsap.utils.toArray(".home-intro__letter", intro);

      if (reduced) {
        gsap.set([nav, ...label, ...headingLines, ...supportLines, ...ctaButton].filter(Boolean), {
          yPercent: 0,
        });
        if (intro) gsap.set(intro, { autoAlpha: 0, pointerEvents: "none" });
        homeRef.current?.classList.remove("is-intro");
        return;
      }

      if (!showIntro && intro) {
        gsap.set(intro, { autoAlpha: 0, pointerEvents: "none" });
        homeRef.current?.classList.remove("is-intro");
      }

      const tl = gsap.timeline({
        defaults: { ease: REVEAL_EASE, overwrite: "auto" },
      });

      if (showIntro && intro && introPanel && introLetters.length) {
        const pageBits = Array.from(homeRef.current.children).filter(
          (el) => el !== intro
        );
        document.body.classList.add("is-locked");
        homeRef.current.classList.add("is-intro");
        gsap.set(intro, { autoAlpha: 1, pointerEvents: "auto" });
        gsap.set(introLetters, { yPercent: 100 });
        gsap.set(introPanel, { scaleY: 0, transformOrigin: "50% 100%" });

        tl.to(introPanel, {
          scaleY: 1,
          duration: 0.38,
          ease: "back.out(1.12)",
        })
          .to(
            introLetters,
            {
              yPercent: 0,
              duration: 0.48,
              stagger: 0.04,
            },
            "-=0.12"
          )
          .to(
            introLetters,
            {
              yPercent: -110,
              duration: 0.28,
              stagger: 0.018,
              ease: "power3.in",
            },
            "+=0.1"
          )
          .set(introPanel, { transformOrigin: "50% 0%" })
          .add(() => {
            homeRef.current?.classList.remove("is-intro");
            gsap.set(pageBits, { autoAlpha: 1 });
            ScrollTrigger.refresh();
          })
          .to(
            introPanel,
            {
              scaleY: 0,
              duration: 0.38,
              ease: "power3.inOut",
            },
            "<0.02"
          )
          .set(intro, { autoAlpha: 0, pointerEvents: "none" })
          .add(() => document.body.classList.remove("is-locked"));
      }

      if (label.length) {
        tl.from(
          label,
          {
            yPercent: -100,
            duration: 0.75,
          },
          0
        );
      }

      if (headingLines.length) {
        tl.from(
          headingLines,
          {
            yPercent: 100,
            duration: 0.8,
            stagger: 0.1,
          },
          "-=0.48"
        );
      }

      if (supportLines.length) {
        tl.from(
          supportLines,
          {
            yPercent: 110,
            duration: 0.85,
          },
          headingLines.length ? "-=0.35" : 0
        );
      }

      if (ctaButton.length) {
        tl.from(
          ctaButton,
          {
            yPercent: 100,
            duration: 0.7,
          },
          "-=0.42"
        );
      }

      const ticker = homeRef.current?.querySelector(".home-ticker");
      const tickerTrack = ticker?.querySelector(".home-ticker__track");
      const tickerGroup = tickerTrack?.querySelector(".home-ticker__group");
      if (ticker && tickerTrack && tickerGroup) {
        gsap.to(tickerTrack, {
          x: () => -tickerGroup.scrollWidth * 0.38,
          ease: TICKER_SCROLL_EASE,
          scrollTrigger: {
            trigger: ticker,
            start: "top bottom",
            end: "bottom+=240% top",
            scrub: 0.28,
            invalidateOnRefresh: true,
          },
        });
      }

      const cinemaStage = homeRef.current?.querySelector(".home-cinema__pin");
      const cinemaMedia = homeRef.current?.querySelector(".home-cinema__media");
      if (cinemaStage && cinemaMedia) {
        const cinemaTl = gsap.timeline({
          defaults: { ease: CINEMA_EASE },
          scrollTrigger: {
            trigger: cinemaMedia,
            start: "top 92%",
            end: "top 8%",
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });

        cinemaTl.fromTo(
          cinemaMedia,
          {
            width: () => Math.min(720, window.innerWidth - 64),
          },
          {
            width: () => {
              const cards = homeRef.current?.querySelector(".home-expand__inner");
              return cards?.getBoundingClientRect().width || Math.min(1400, window.innerWidth - 80);
            },
            duration: 1,
          }
        );
      }

      const libraryStage = homeRef.current?.querySelector(".home-library-stage");
      const libraryCover = libraryStage?.querySelector(".home-library-cover");
      const librarySheet = libraryCover?.querySelector(".home-library-cover__sheet");
      const libraryType = libraryStage?.querySelector(".home-type");
      const libraryLine = libraryType?.querySelector(".home-type__line");
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let settleTimer = 0;
      const desktopMotion = gsap.matchMedia();
      if (libraryStage && libraryCover && librarySheet && libraryType && libraryLine && !reducedMotion) {
        desktopMotion.add("(min-width: 1025px)", () => {
          const fitSticky = () => {
            const height = libraryType.offsetHeight;
            const view = window.innerHeight;
            libraryType.style.top = height > view ? `${-(height - view)}px` : "0px";
          };
          fitSticky();
          ScrollTrigger.addEventListener("refreshInit", fitSticky);

          gsap.fromTo(
            librarySheet,
            { width: "78%" },
            {
              width: "100%",
              ease: "none",
              scrollTrigger: {
                trigger: libraryCover,
                start: "top bottom",
                end: "top top",
                scrub: true,
                invalidateOnRefresh: true,
              },
            }
          );

          gsap.fromTo(
            libraryType,
            { scale: 1, y: 0 },
            {
              scale: 0.9,
              y: -56,
              ease: "none",
              transformOrigin: "50% 42%",
              scrollTrigger: {
                trigger: libraryCover,
                start: "top bottom",
                end: "top top",
                scrub: true,
                invalidateOnRefresh: true,
              },
            }
          );

          let settling = false;
          ScrollTrigger.create({
            trigger: libraryCover,
            start: "top bottom",
            end: "top top",
            onUpdate: (self) => {
              if (settling) return;
              window.clearTimeout(settleTimer);
              if (self.progress <= 0.02 || self.progress >= 0.98) return;
              settleTimer = window.setTimeout(() => {
                if (settling) return;
                const progress = self.progress;
                if (progress <= 0.02 || progress >= 0.98) return;
                const destination = progress < 0.5 ? self.start : self.end;
                const locomotive = locomotiveRef?.current;
                settling = true;
                const release = () => {
                  settling = false;
                };
                if (locomotive?.scrollTo) {
                  locomotive.scrollTo(destination, {
                    duration: 0.8,
                    force: true,
                    lock: true,
                    easing: (t) => 1 - Math.pow(1 - t, 3),
                    onComplete: release,
                  });
                } else {
                  window.scrollTo({ top: destination, behavior: "smooth" });
                  window.setTimeout(release, 900);
                }
              }, 90);
            },
          });

          return () => {
            window.clearTimeout(settleTimer);
            ScrollTrigger.removeEventListener("refreshInit", fitSticky);
            libraryType.style.top = "";
          };
        });
      }

      gsap.utils.toArray("[data-scroll-reveal]", homeRef.current).forEach((group) => {
        const lines = gsap.utils.toArray(".scroll-reveal__inner", group);
        if (!lines.length) return;

        gsap.from(lines, {
          yPercent: 100,
          duration: 0.8,
          stagger: 0.1,
          ease: REVEAL_EASE,
          scrollTrigger: {
            trigger: group,
            start: "top 88%",
            once: true,
          },
        });
      });

      return () => {
        window.clearTimeout(settleTimer);
        desktopMotion.revert();
        document.body.classList.remove("is-locked");
        homeRef.current?.classList.remove("is-intro");
      };
    },
    { scope: homeRef }
  );


  return (
    <div className="home page-view" ref={homeRef}>
      <div className="home-intro" aria-hidden="true">
        <div className="home-intro__panel">
          <p className="home-intro__word">
            {["u", "i", "v", "o", "l", "v", "e"].map((letter, index) => (
              <span className="home-intro__mask" key={`${letter}-${index}`}>
                <span className="home-intro__letter">{letter}</span>
              </span>
            ))}
          </p>
        </div>
      </div>

      <DynamicNav onNavigate={onNavigate} />

      <div className="home-sheet">
      <section className="home-banner" id="top">
        <Rules />
        <div className="home-banner__layout">
          <div className="home-banner__inner">
            <div className="home-banner__typo">
              <div className="home-banner__lockup">
                <p className="home-banner__label" data-reveal="eyebrow">
                  <span className="reveal-inner">Preview it live</span>
                </p>
                <h1 className="home-banner__title" data-reveal="heading">
                  <span className="home-banner__line home-banner__line--1">
                    <span className="reveal-inner">
                      <span className="home-banner__lead">
                        <span className="home-banner__lead-kicker">One </span>
                        <span className="home-banner__lead-word">
                          <RotatingWord /><span className="home-banner__period">.</span>
                        </span>
                      </span>
                    </span>
                  </span>
                  <span className="home-banner__line home-banner__line--2">
                    <span className="reveal-inner">Built for you.</span>
                  </span>
                </h1>

                <p className="home-banner__description" data-reveal="description">
                  <span className="reveal-inner">
                    Open a piece in the browser, watch how it moves, and take the code when it belongs in the product.
                  </span>
                </p>
              </div>
            </div>
          </div>

          <FloatTiles />
        </div>
      </section>

      <div className="home-library-stage">
        <section className="home-expand">
          <Rules />
          <div className="home-expand__inner">
            <div className="home-expand__copy">
              <h2 className="home-expand__title" data-scroll-reveal>
                <span className="scroll-reveal">
                  <span className="scroll-reveal__inner">From motion to glass.</span>
                </span>
                <span className="scroll-reveal">
                  <span className="scroll-reveal__inner">One library.</span>
                </span>
              </h2>
            </div>

            <ExpandCards />
          </div>
        </section>

        <TypeSet />

        <div className="home-library-cover">
          <div className="home-library-cover__sheet">
            <div className="home-library-cover__panel" aria-hidden="true" />
            <FeatureCards onOpen={() => onNavigate("library")} />
            <BlackSections />
          </div>
        </div>
      </div>

      <div className="home-light">
        <Rules />
        <FaqAccordion />
        <section className="home-callout" aria-label="Get ready to animate">
          <div className="home-callout__copy">
            <h2 className="home-callout__title">
              <span>Get ready to</span>
              <span>animate</span>
            </h2>
            <CollectionButton onClick={() => onNavigate("library")} />
          </div>
          <CalloutCards />
        </section>

      <div className="home-marquee" ref={marqueeRef} aria-hidden="true">
        <div className="home-marquee__track">
          {[0, 1].map((group) => (
            <div className="home-marquee__group" key={group}>
              {Array.from({ length: 6 }, (_, index) => (
                <span className="home-marquee__item" key={`${group}-${index}`}>
                  See it live
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      </div>
      </div>

      <footer className="home-footer" ref={footerRef}>
        <div className="home-footer__reveal">
        <div className="home-footer__inner">
          <div className="home-footer__grid">
            <div className="home-footer__intro">
              <h2 className="home-footer__heading">Never miss what&apos;s next</h2>
              <form
                className="home-footer__signup"
                onSubmit={(event) => {
                  event.preventDefault();
                  setFooterEmail("");
                }}
              >
                <label className="home-footer__email">
                  <input
                    aria-label="Email"
                    type="email"
                    name="email"
                    value={footerEmail}
                    placeholder="Your email"
                    autoComplete="email"
                    onChange={(event) => setFooterEmail(event.target.value)}
                    required
                  />
                </label>
                <button className="home-footer__submit" type="submit">
                  Submit
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M1.8 8.1 14.2 2.4 8.6 14.2 7.2 9.1 1.8 8.1Z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                  </svg>
                </button>
              </form>
              <p className="home-footer__fine">
                By submitting your email, you&apos;ll be the first to know about new pieces in the library. You can unsubscribe at any time.
              </p>
            </div>
            <div className="home-footer__col">
              <h3>Social</h3>
              <ul>
                <li><a href="https://www.instagram.com" target="_blank" rel="noreferrer">Instagram</a></li>
                <li><a href="https://www.linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a></li>
                <li><a href="https://x.com" target="_blank" rel="noreferrer">X (Twitter)</a></li>
                <li><a href="https://www.youtube.com" target="_blank" rel="noreferrer">YouTube</a></li>
                <li><a href="https://bsky.app" target="_blank" rel="noreferrer">Bluesky</a></li>
              </ul>
            </div>
            <div className="home-footer__col">
              <h3>Pages</h3>
              <ul>
                <li><button type="button" onClick={() => onNavigate("library")}>Collection</button></li>
                <li><button type="button" onClick={() => document.querySelector(".faq-section")?.scrollIntoView({ behavior: "smooth" })}>FAQ</button></li>
                <li><button type="button" onClick={() => onNavigate("library", { tier: "pro" })}>Pricing</button></li>
                <li><button type="button" onClick={() => onNavigate("library", { category: "Gallery" })}>Showcase</button></li>
                <li><button type="button" onClick={() => onNavigate("library", { tier: "free" })}>Free effects</button></li>
              </ul>
            </div>
            <div className="home-footer__col">
              <h3>Contact</h3>
              <ul>
                <li><button type="button" onClick={() => document.querySelector(".home-footer__signup input")?.focus()}>Reach us</button></li>
              </ul>
              <button className="home-footer__app" type="button" onClick={() => onNavigate("library")}>
                Open library
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path fill="currentColor" d="M12.5 8.5c0-1.8 1.5-2.6 1.5-2.7-.8-1.2-2.1-1.4-2.6-1.4-1.1-.1-2.1.6-2.7.6-.6 0-1.5-.6-2.4-.6-1.2 0-2.3.7-2.9 1.8-1.3 2.2-.3 5.5.9 7.3.6.9 1.3 1.8 2.3 1.8.9 0 1.2-.6 2.3-.6s1.4.6 2.4.6 1.6-.9 2.2-1.7c.7-1 .9-1.9 1-2 0 0-1.9-.8-2-3.1Zm-1.8-5c.5-.6.8-1.5.7-2.3-.7.1-1.5.5-2 .1-.5.6-.9 1.5-.8 2.3.8 0 1.6-.4 2.1-.1Z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="home-footer__base">
            <span>© {new Date().getFullYear()} axio</span>
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              Back to the top
              <svg viewBox="0 0 12 12" aria-hidden="true">
                <path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
        <div className="home-footer__word" aria-label={FOOTER_WORD}>
          {FOOTER_WORD.split("").map((letter, index) => (
            <span className="home-footer__char" aria-hidden="true" key={`${letter}-${index}`}>
              <span className="home-footer__glyph">{letter}</span>
            </span>
          ))}
        </div>
        </div>
      </footer>
    </div>
  );
}
