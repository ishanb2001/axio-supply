import { useRef, useState } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import DynamicNav from "./DynamicNav";
import FaqAccordion from "./FaqAccordion";
import FeatureCards from "./FeatureCards";
import FloatTiles from "./FloatTiles";
import ExpandCards from "./ExpandCards";
import "./HomePage.css";

gsap.registerPlugin(useGSAP, CustomEase, ScrollTrigger);

const ROTATING_WORDS = ["platform", "environment", "ecosystem"];
const SLIDE_EASE = CustomEase.create("homeEaseInOut", "0.4,0,0.2,1");
const REVEAL_EASE = "power4.out";
const TICKER_SCROLL_EASE = CustomEase.create("tickerScrollEase", "0.76,0,0.24,1");
const CINEMA_EASE = CustomEase.create("cinemaEase", "0.65,0,0.35,1");

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

export default function HomePage({ onNavigate, playIntro = false }) {
  const homeRef = useRef(null);
  const footerRef = useRef(null);
  const [showIntro] = useState(playIntro);

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
        const width = glyphs.reduce((sum, glyph) => sum + glyph.getBoundingClientRect().width, 0);
        if (!width) return;
        word.style.fontSize = `${(word.clientWidth / width) * 100}px`;
      };

      let alive = true;
      let played = false;
      fitWord();

      const travel = (el) => el.parentElement?.offsetHeight || el.offsetHeight;

      const hide = () => {
        gsap.set(glyphs, {
          y: (index, el) => travel(el),
          yPercent: 0,
          overwrite: "auto",
        });
      };

      const rise = () => {
        played = true;
        gsap.fromTo(
          glyphs,
          { y: (index, el) => travel(el), yPercent: 0 },
          {
            y: 0,
            duration: 1.05,
            ease: "power3.out",
            stagger: 0.08,
            overwrite: "auto",
          }
        );
      };

      const onResize = () => {
        fitWord();
        if (!played) hide();
      };
      window.addEventListener("resize", onResize);

      if (reduced) {
        gsap.set(glyphs, { y: 0, yPercent: 0, overwrite: "auto" });
        return () => {
          alive = false;
          window.removeEventListener("resize", onResize);
        };
      }

      hide();

      ScrollTrigger.create({
        trigger: root,
        start: "top 85%",
        onEnter: rise,
        onLeaveBack: () => {
          played = false;
          hide();
        },
      });

      if (root.getBoundingClientRect().top < window.innerHeight * 0.85) {
        rise();
      }

      document.fonts?.ready.then(() => {
        if (!alive) return;
        fitWord();
        if (!played) hide();
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
            yPercent: 100,
            duration: 0.75,
            stagger: 0.1,
          },
          "-=0.52"
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

      <section className="home-banner" id="top">
        <div className="home-banner__layout">
          <div className="home-banner__inner">
            <div className="home-banner__badge-mask" data-reveal="eyebrow">
              <p className="home-banner__badge reveal-inner">
                <span className="home-banner__laurel" aria-hidden="true">
                  ❦
                </span>
                <span className="home-banner__badge-text">Webflow Awards Finalist</span>
                <span className="home-banner__laurel" aria-hidden="true">
                  ❦
                </span>
              </p>
            </div>

            <div className="home-banner__typo">
              <h1 className="home-banner__title" data-reveal="heading">
                <span className="home-banner__line home-banner__line--1">
                  <span className="reveal-inner">
                    One <RotatingWord />.
                  </span>
                </span>
                <span className="home-banner__line home-banner__line--2">
                  <span className="reveal-inner">Built for every layer.</span>
                </span>
              </h1>

              <div className="home-banner__end">
                <div className="home-banner__cta" data-reveal="cta">
                  <span className="reveal-inner">
                    <button
                      className="home-banner__button"
                      type="button"
                      onClick={() => onNavigate("library")}
                    >
                      Explore the Library
                    </button>
                  </span>
                </div>

                <p className="home-banner__lede" data-reveal="description">
                  <span className="home-banner__lede-line">
                    <span className="reveal-inner">
                      Preview live motion, components, and systems —
                    </span>
                  </span>
                  <span className="home-banner__lede-line">
                    <span className="reveal-inner">
                      then pick the ones that fit what you&apos;re building.
                    </span>
                  </span>
                </p>
              </div>
            </div>
          </div>

          <FloatTiles />
        </div>
      </section>

      <section className="home-expand">
        <div className="home-expand__inner">
          <div className="home-expand__copy">
            <h2 className="home-expand__title" data-scroll-reveal>
              <span className="scroll-reveal">
                <span className="scroll-reveal__inner">One platform.</span>
              </span>
              <span className="scroll-reveal">
                <span className="scroll-reveal__inner">every layer of the build.</span>
              </span>
            </h2>
          </div>

          <ExpandCards />
        </div>
      </section>

      <FeatureCards onOpen={() => onNavigate("library")} />

      <FaqAccordion />

      <footer className="home-footer" ref={footerRef}>
        <div className="home-footer__inner">
          <div className="home-footer__bar">
            <div className="home-footer__meta">
              <span>© {new Date().getFullYear()} axio</span>
              <ul className="home-footer__links">
                <li>
                  <button type="button" onClick={() => onNavigate("library")}>
                    Library
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onNavigate("library", { category: "Animation" })}>
                    Motion
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onNavigate("library")}>
                    Components
                  </button>
                </li>
              </ul>
            </div>
            <ul className="home-footer__social">
              <li>
                <a
                  href="https://www.linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M6.94 8.5H2.5V21h4.44V8.5zM4.72 3C3.49 3 2.5 3.99 2.5 5.22s.99 2.22 2.22 2.22 2.22-.99 2.22-2.22S5.95 3 4.72 3zM21.5 13.38V21h-4.44v-7.06c0-1.68-.03-3.84-2.34-3.84-2.34 0-2.7 1.83-2.7 3.72V21H7.58V8.5h4.26v1.71h.06c.59-1.12 2.04-2.3 4.2-2.3 4.49 0 5.4 2.96 5.4 6.8z" />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2zm0 7.92a3.12 3.12 0 1 1 0-6.24 3.12 3.12 0 0 1 0 6.24zM17.52 6.96a1.12 1.12 0 1 1-2.24 0 1.12 1.12 0 0 1 2.24 0zM12 2.88c-2.48 0-2.79.01-3.77.06-2.5.11-3.83 1.42-3.94 3.94-.05.98-.06 1.29-.06 3.77s.01 2.79.06 3.77c.11 2.51 1.43 3.83 3.94 3.94.98.05 1.29.06 3.77.06s2.79-.01 3.77-.06c2.52-.11 3.83-1.43 3.94-3.94.05-.98.06-1.29.06-3.77s-.01-2.79-.06-3.77c-.11-2.52-1.42-3.83-3.94-3.94-.98-.05-1.29-.06-3.77-.06zm0 1.68c2.44 0 2.73.01 3.69.05 1.85.08 2.71.96 2.79 2.79.05.96.05 1.25.05 3.69s0 2.73-.05 3.69c-.08 1.82-.93 2.71-2.79 2.79-.96.05-1.25.05-3.69.05s-2.73 0-3.69-.05c-1.87-.08-2.71-.97-2.79-2.79-.05-.96-.05-1.25-.05-3.69s0-2.73.05-3.69c.08-1.83.94-2.71 2.79-2.79.96-.04 1.25-.05 3.69-.05z" />
                  </svg>
                </a>
              </li>
              <li>
                <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18.9 2.25h3.25l-7.1 8.12L23.5 21.75h-6.56l-5.14-6.72-5.88 6.72H2.66l7.6-8.68L.5 2.25h6.72l4.64 6.14 6.04-6.14zm-1.14 17.52h1.8L6.4 4.08H4.47l13.29 15.69z" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="home-footer__word" aria-label={FOOTER_WORD}>
          {FOOTER_WORD.split("").map((letter, index) => (
            <span className="home-footer__char" aria-hidden="true" key={`${letter}-${index}`}>
              <span className="home-footer__glyph">{letter}</span>
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
